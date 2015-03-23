var debuggerModule=angular.module("ozpIwc.debugger",[
    'ui.bootstrap',
    'ui.grid',
    'ui.grid.selection',
    'ui.router'
]).config(function($stateProvider, $urlRouterProvider) {
      // For any unmatched url, redirect to General
      $urlRouterProvider.otherwise("/general");

      $stateProvider
        .state('general', {
            url: "/general",
            templateUrl: "templates/generalState.tpl.html"
        })
        .state('metrics', {
            url: "/metrics",
            templateUrl: "templates/metricsState.tpl.html"
        })
        .state('traffic-snooper', {
            url: "/traffic-snooper",
            templateUrl: "templates/trafficSnooperState.tpl.html"
        })
        .state('elections', {
            url: "/elections",
            templateUrl: "templates/electionsState.tpl.html"
        })
        .state('system-api', {
            url: "/system-api",
            templateUrl: "templates/systemApiState.tpl.html"
        })
        .state('data-api', {
            url: "/data-api",
            templateUrl: "templates/dataApiState.tpl.html"
        })
        .state('intents-api', {
            url: "/intents-api",
            templateUrl: "templates/intentsApiState.tpl.html"
        })
        .state('names-api', {
            url: "/names-api",
            templateUrl: "templates/namesApiState.tpl.html"
        })
        .state('hal-browser', {
            url: "/hal-browser/:url",
            templateUrl: "templates/halBrowserState.tpl.html"
        });
});


debuggerModule.factory("iwcClient",function() {
    var client=new ozpIwc.InternalParticipant({name: "debuggerClient"});
    ozpIwc.defaultRouter.registerParticipant(client);
    client.apiMap = ozpIwc.apiMap;
    client.wrapperMap = {};
    client.connect=function() {
        if(!this.connectPromise) {
            var self=this;

            /**
             * Promise to chain off of for client connection asynchronous actions.
             * @property connectPromise
             * @type Promise
             */
            this.connectPromise=new Promise(function(resolve, reject) {
                    for(var api in self.apiMap){
                        var apiObj = self.apiMap[api];
                        var apiFuncName = apiObj.address.replace('.api','');

                        //prevent overriding client constructed fields
                        if(!self.hasOwnProperty(apiFuncName)){
                            // wrap this in a function to break the closure
                            // on apiObj.address that would otherwise register
                            // everything for the last api in the list
                            /*jshint loopfunc:true*/
                            (function(addr){
                                self[apiFuncName] = function(){
                                    return self.api(addr);
                                };
                                self.apiMap[addr] = self.apiMap[addr] || {};
                                self.apiMap[addr].functionName = apiFuncName;
                            })(apiObj.address);
                        }
                    }
                    /**
                     * Fired when the client is connected to the IWC bus.
                     * @event #connected
                     */
                    self.events.trigger("connected");
                    resolve();
            })['catch'](function(error) {
                ozpIwc.log.log("Failed to connect to bus ",error);
            });
        }
        return this.connectPromise;
    };


    client.intentInvocationHandling = function(resource,intentResource,callback) {
        var self = this;
        return new Promise(function(resolve,reject) {
            self.send({
                dst: "intents.api",
                action: "get",
                resource: intentResource
            }, function (response, done) {
                response.entity.handler = {
                    address: self.address,
                    resource: resource
                };
                response.entity.state = "running";


                self.send({
                    dst: "intents.api",
                    contentType: response.contentType,
                    action: "set",
                    resource: intentResource,
                    entity: response.entity
                }, function (reply, done) {
                    //Now run the intent
                    response.entity.reply.entity = callback(response.entity) || {};
                    // then respond to the inflight resource
                    response.entity.state = "complete";
                    response.entity.reply.contentType = response.entity.intent.type;
                    self.send({
                        dst: "intents.api",
                        contentType: response.contentType,
                        action: "set",
                        resource: intentResource,
                        entity: response.entity
                    });
                    done();
                    resolve(response);
                });
                done();
            });
        });
    };

    client.augment = function (dst,action) {
        var self = this;
        return function (resource, fragment, otherCallback) {
            // If a fragment isn't supplied argument #2 should be a callback (if supplied)
            if(typeof fragment === "function"){
                otherCallback = fragment;
                fragment = {};
            }
            return new Promise(function (resolve, reject) {
                var packet = {
                    'dst': dst,
                    'action': action,
                    'resource': resource,
                    'entity': {}
                };
                for (var k in fragment) {
                    packet[k] = fragment[k];
                }
                var packetResponse = false;
                var callbackResponse = !!!otherCallback;
                self.send(packet, function (reply,done) {

                    function initialDone() {
                        if(callbackResponse){
                            done();
                        } else {
                            packetResponse = true;
                        }
                    }

                    function callbackDone() {
                        if(packetResponse){
                            done();
                        } else {
                            callbackResponse = true;
                        }
                    }
                    if (reply.response === 'ok') {
                        resolve(reply);
                        initialDone();
                    } else if (/(bad|no).*/.test(reply.response)) {
                        reject(reply);
                        initialDone();
                    }
                    else if (otherCallback) {
                        if(reply.entity && reply.entity.inFlightIntent) {
                            self.intentInvocationHandling(resource,reply.entity.inFlightIntent,otherCallback,callbackDone);
                        } else {
                            otherCallback(reply, callbackDone);
                        }
                    }
                });
                if(dst === "intents.api" && action === "register"){
                    for(var i in self.launchedIntents){
                        var loadedResource = '/' + self.launchedIntents[i].entity.intent.type + '/' + self.launchedIntents[i].entity.intent.action;
                        if(resource === loadedResource){
                            self.intentInvocationHandling(resource,self.launchedIntents[i].resource,otherCallback);
                            delete self.launchedIntents[i];
                        }
                    }
                }
            });
        };
    };

    client.api=function(apiName) {
        this.wrapperMap = this.wrapperMap || {};
        var wrapper = this.wrapperMap[apiName];
        if (!wrapper) {
            if(this.apiMap.hasOwnProperty(apiName)) {
                var api = this.apiMap[apiName];
                wrapper = {};
                for (var i = 0; i < api.actions.length; ++i) {
                    var action = api.actions[i];
                    wrapper[action] = this.augment(api.address, action);
                }

                this.wrapperMap[apiName] = wrapper;
            }
        }
        wrapper.apiName=apiName;
        return wrapper;
    };
    client.connect();
    return client;
});
        
        
debuggerModule.controller("debuggerController",["$scope","iwcClient",function(scope,client) {
    scope.ozpIwc = ozpIwc;
    scope.apiRootUrl = ozpIwc.apiRootUrl;
    scope.tab = 'general';
}]);
debuggerModule.service("apiSettingService",function(){
    this.apis={
        'data.api' : {
            'address': "data.api",
            'hasChildren':true
        },
        'intents.api': {
            'address': "intents.api",
            'actions': [{
                action: "invoke",
                contentTypes: ['application/vnd.ozp-iwc-intent-definition-v1+json',
                    'application/vnd.ozp-iwc-intent-handler-v1+json']
            },{
                action: "broadcast",
                contentTypes: ['application/vnd.ozp-iwc-intent-definition-v1+json',
                    'application/vnd.ozp-iwc-intent-handler-v1+json']
            }]
        },
        'system.api': {
            'address': "system.api",
            'actions': [{
                action: "launch",
                contentTypes: ['application/vnd.ozp-application-v1+json']
            }]
        },
        'names.api': {
            'address': "names.api"
        }
    };
});
