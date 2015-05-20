var ozpIwc=ozpIwc || {};

/**
 * Client-side functionality of the IWC. This is the API for widget use.
 * @module client
 */

/**
 * This class will be heavily modified in the future.
 * @class Client
 * @namespace ozpIwc
 *
 * @todo accept a list of peer URLs that are searched in order of preference
 * @param {Object} config
 * @param {String} config.peerUrl - Base URL of the peer server
 * @param {Object} config.params - Parameters that will be passed to the bus.
 * @param {String} config.params.log - The IWC bus logging level.  One of "NONE","DEFAULT","ERROR","INFO","DEBUG", or "ALL"
 * @param {Boolean} [config.autoConnect=true] - Whether to automatically find and connect to a peer
 */
ozpIwc.Client=function(config) {
    config=config || {};

    /**
     * The address assigned to this client.
     * @property address
     * @type String
     */
    this.address="$nobody";

    /**
     * Key value store of callback functions for the client to act upon when receiving a reply via the IWC.
     * @property promiseCallbacks
     * @type Object
     */
    this.promiseCallbacks={};
    // coerce config.peerUrl to a function
    
    var configUrl=config.peerUrl;
    if(typeof(configUrl) === "string") {
        this.peerUrlCheck=function(url,resolve) {
            if(typeof url !== 'undefined'){
                resolve(url);
            } else {
                resolve(configUrl);
            }

        };
    } else if(Array.isArray(configUrl)) {
        this.peerUrlCheck=function(url,resolve) {
            if(configUrl.indexOf(url) >= 0) {
                resolve(url);
            }
            resolve(configUrl[0]);
        };
    } else if(typeof(configUrl) === "function") {
        /**
         * @property peerUrlCheck
         * @type String
         */
        this.peerUrlCheck=configUrl;
    } else {
        throw new Error("PeerUrl must be a string, array of strings, or function");
    }

    /**
     * @property autoConnect
     * @type {Boolean}
     * @default true
     */
    this.autoConnect=("autoConnect" in config) ? config.autoConnect : true;

    /**
     * @property msgIdSequence
     * @type Number
     * @default 0
     */
    this.msgIdSequence=0;

    /**
     * An events module for the Client
     * @property events
     * @type ozpIwc.Event
     */
    this.events=new ozpIwc.Event();
    this.events.mixinOnOff(this);

    /**
     * @property receivedPackets
     * @type Number
     * @default 0
     */
    this.receivedPackets=0;

    /**
     * @property receivedBytes
     * @type Number
     * @default 0
     */
    this.receivedBytes=0;

    /**
     * @property sentPackets
     * @type Number
     * @default 0
     */
    this.sentPackets=0;

    /**
     * @property sentBytes
     * @type Number
     * @default 0
     */
    this.sentBytes=0;

    /**
     * The epoch time the Client was instantiated.
     * @property startTime
     * @type Number
     */
    this.startTime=ozpIwc.util.now();

    /**
     * @property launchParams
     * @type Object
     * @default {}
     */
    this.launchParams=config.params || {};
    
    this.readLaunchParams(window.name);
    this.readLaunchParams(window.location.search);
    this.readLaunchParams(window.location.hash);
    
    /**
     * A map of available apis and their actions.
     * @property apiMap
     * @type Object
     */
    this.apiMap= ozpIwc.apiMap || {};

    /**
     * @property wrapperMap
     * @type Object
     * @default {}
     */
    this.wrapperMap={};


    /**
     * @property preconnectionQueue
     * @type Array
     * @default []
     */
    this.preconnectionQueue=[];

    /**
     * @property watchMsgMap
     * @type Object
     * @default {}
     */
    this.watchMsgMap = {};
    this.registeredCallbacks = {};


    /**
     * @property launchedIntents
     * @type Array
     * @default []
     */
    this.launchedIntents = [];

    this.constructApiFunctions();
    var self=this;
    this.unloadHandler=function() { self.disconnect();};
    ozpIwc.util.addEventListener('beforeunload',this.unloadHandler);

    if(this.autoConnect) {
        this.connect();
    }


};

/**
 * Parses launch parameters based on the raw string input it receives.
 *
 * @method readLaunchParams
 * @param {String} rawString
 */
ozpIwc.Client.prototype.readLaunchParams=function(rawString) {
    // of the form ozpIwc.VARIABLE=VALUE, where:
    //   VARIABLE is alphanumeric + "_"
    //   VALUE does not contain & or #
    var re=/ozpIwc.(\w+)=([^&#]+)/g;
    var m;
    while((m=re.exec(rawString)) !== null) {
        var params = decodeURIComponent(m[2]);
        try{
            params = JSON.parse(params);
        } catch(e){
            // ignore the errors and just pass through the string
        }
        this.launchParams[m[1]]=params;
    }
};
/**
 * Receive a packet from the connected peer.  If the packet is a reply, then
 * the callback for that reply is invoked.  Otherwise, it fires a receive event
 *
 * Fires:
 *     - {{#crossLink "ozpIwc.Client/receive:event}}{{/crossLink}}
 *
 * @method receive
 * @protected
 * @param {ozpIwc.TransportPacket} packet
 */
ozpIwc.Client.prototype.receive=function(packet) {
    var handled = false;

    //Try and handle this packet as a reply message
    if(packet.src === "$transport" || (packet.replyTo && this.promiseCallbacks[packet.replyTo])) {

        var replyCancel = false;
        var replyDone=function() {
            replyCancel = true;
        };
        this.promiseCallbacks[packet.replyTo](packet,replyDone);

        if (replyCancel) {
            this.cancelPromiseCallback(packet.replyTo);
            handled = true;
        }

    }

    //Try and handle this packet as callback message
    if(!handled && packet.replyTo && this.registeredCallbacks[packet.replyTo]){
        handled = true;

        var registeredCancel = false;
        var registeredDone=function() {
            registeredCancel = true;
        };

        this.registeredCallbacks[packet.replyTo](packet,registeredDone);
        if (registeredCancel) {
            if(this.watchMsgMap[packet.replyTo].action === "watch") {
                this.api(this.watchMsgMap[packet.replyTo].dst).unwatch(this.watchMsgMap[packet.replyTo].resource);
            }
            this.cancelRegisteredCallback(packet.replyTo);
        }
    }

    // Otherwise trigger "receive" for someone to handle it
    if(!handled){
        /**
         * Fired when the client receives a packet.
         * @event #receive
         */
        this.events.trigger("receive",packet);
    }
};
/**
 * Sends a packet through the IWC.
 *
 * @method send
 * @param {String} dst Where to send the packet.
 * @param {Object} entity  The payload of the packet.
 * @param {Function} callback The Callback for any replies. The callback will be persisted if it returns a truth-like
 * value, canceled if it returns a false-like value.
 */
ozpIwc.Client.prototype.send=function(fields,callback,preexistingPromiseRes,preexistingPromiseRej) {
    var promiseRes = preexistingPromiseRes;
    var promiseRej = preexistingPromiseRej;
    var promise =  new Promise(function(resolve,reject){

        if(!promiseRes && !promiseRej){
            promiseRes = resolve;
            promiseRej = reject;
        }
    });

    if(!(this.isConnected() || fields.dst==="$transport")) {
        // when send is switched to promises, create the promise first and return it here, as well
        this.preconnectionQueue.push({
            'fields': fields,
            'callback': callback,
            'promiseRes': promiseRes,
            'promiseRej': promiseRej
        });
        return promise;
    }

    var now=new Date().getTime();
    var id="p:"+this.msgIdSequence++; // makes the code below read better
    var packet={
        ver: 1,
        src: this.address,
        msgId: id,
        time: now
    };

    for(var k in fields) {
        packet[k]=fields[k];
    }

    var self = this;

    if(callback) {
        this.registeredCallbacks[id] = function (reply, done) {
            if(reply.entity && reply.entity.inFlightIntent) {
                self.intentInvocationHandling(packet.resource,reply.entity.inFlightIntent,callback);
            } else {
                callback(reply, done);
            }
        };
    }

    this.promiseCallbacks[id]=function (reply,done) {
        if (reply.src === "$transport" || /(ok).*/.test(reply.response)) {
            done();
            promiseRes(reply);
        } else if (/(bad|no).*/.test(reply.response)) {
            done();
            promiseRej(reply);
        } else {
            // it was not a promise callback
        }
    };

    ozpIwc.util.safePostMessage(this.peer,packet,'*');
    this.sentBytes+=packet.length;
    this.sentPackets++;

    if(packet.action === "watch") {
        this.watchMsgMap[id] = packet;
    } else if(packet.action === "unwatch" && packet.replyTo) {
        this.cancelRegisteredCallback(packet.replyTo);
    }
    return promise;
};

/**
 * Builds the client api calls from the values in client.apiMap
 *
 * @method constructApiFunctions
 */
ozpIwc.Client.prototype.constructApiFunctions = function(){
    for (var api in this.apiMap) {
        var apiObj = this.apiMap[api];
        var apiFuncName = apiObj.address.replace('.api', '');

        //prevent overriding client constructed fields, but allow updating of constructed APIs
        if (!this.hasOwnProperty(apiFuncName) || this.apiMap[api].functionName === apiFuncName) {
            // wrap this in a function to break the closure
            // on apiObj.address that would otherwise register
            // everything for the last api in the list
            /*jshint loopfunc:true*/
            (function (self,addr) {
                self[apiFuncName] = function () {
                    return self.api(addr);
                };
                self.apiMap[addr] = self.apiMap[addr] || {};
                self.apiMap[addr].functionName = apiFuncName;
                self.updateApi(addr);
            })(this,apiObj.address);
        }
    }
};

/**
 * Calls the names.api to gather the /api/* resources to gain knowledge of available api actions of the current bus.
 *
 * @method gatherApiInformation
 * @returns {Promise}
 */
ozpIwc.Client.prototype.gatherApiInformation = function(){
    var self = this;
    // gather api information
    return this.send({
        dst: "names.api",
        action: "get",
        resource: "/api"
    }).then(function(reply){
        if(reply.response === 'ok'){
            return reply.entity;
        } else {
            throw reply.response;
        }
    }).then(function(apis) {
        var promiseArray = [];
        apis.forEach(function (api) {
            var promise = self.send({
                dst: "names.api",
                action: "get",
                resource: api
            }).then(function (res) {
                if (res.response === 'ok') {
                    var name = api.replace('/api/', '');
                    self.apiMap[name] = self.apiMap[name] || {};
                    self.apiMap[name].address =  name;
                    self.apiMap[name].actions = res.entity.actions;
                } else {
                    throw res.response;
                }
            });
            promiseArray.push(promise);
        });
        return Promise.all(promiseArray);
    });
};

/**
 * Returns whether or not the Client is connected to the IWC bus.
 *
 * @method isConnected
 * @returns {Boolean}
 */
ozpIwc.Client.prototype.isConnected=function(){
    return this.address !== "$nobody";
};

/**
 * Cancel a reply callback registration.
 * @method cancelPromiseCallback
 * @param (String} msgId The packet replyTo ID for which the callback was registered.
 *
 * @return {Boolean} True if the cancel was successful, otherwise false.
 */
ozpIwc.Client.prototype.cancelPromiseCallback=function(msgId) {
    var success=false;
    if (msgId) {
        delete this.promiseCallbacks[msgId];
        success=true;
    }
    return success;
};

/**
 * Cancel a watch callback registration.
 *
 * @method cancelRegisteredCallback
 * @param (String} msgId The packet replyTo ID for which the callback was registered.
 *
 * @return {Boolean} True if the cancel was successful, otherwise false.
 */
ozpIwc.Client.prototype.cancelRegisteredCallback=function(msgId) {
    var success=false;
    if (msgId) {
        delete this.registeredCallbacks[msgId];
        delete this.watchMsgMap[msgId];
        success=true;
    }
    return success;
};

/**
 * Registers callbacks
 *
 * @method on
 * @param {String} event The event to call the callback on.
 * @param {Function} callback The function to be called.
 *
 */
ozpIwc.Client.prototype.on=function(event,callback) {
    if(event==="connected" && this.isConnected()) {
        callback(this);
        return;
    }
    return this.events.on.apply(this.events,arguments);
};

/**
 * De-registers callbacks
 *
 * @method off
 * @param {String} event The event to call the callback on.
 * @param {Function} callback The function to be called.
 *
 */
ozpIwc.Client.prototype.off=function(event,callback) {
    return this.events.off.apply(this.events,arguments);
};

/**
 * Disconnects the client from the IWC bus.
 *
 * @method disconnect
 */
ozpIwc.Client.prototype.disconnect=function() {
    this.promiseCallbacks={};
    this.registeredCallbacks={};
    ozpIwc.util.removeEventListener("message",this.postMessageHandler);
    ozpIwc.util.removeEventListener("unload",this.unloadHandler);
    
    this.connectPromise = null;
    if(this.iframe) {
        this.iframe.src = "about:blank";
        var self = this;
        window.setTimeout(function(){
            self.iframe.remove();
            self.iframe = null;
        },0);
    }
};


/**
 * Connects the client from the IWC bus.
 * Fires:
 *     - {{#crossLink "ozpIwc.Client/#connected"}}{{/crossLink}}
 *
 * @method connect
 */
ozpIwc.Client.prototype.connect=function() {
    if(!this.connectPromise) {
        var self=this;

        /**
         * Promise to chain off of for client connection asynchronous actions.
         * @property connectPromise
         * @type Promise
         */
        this.connectPromise=new Promise(function(resolve) {
            self.peerUrlCheck(self.launchParams.peer,resolve);
        }).then(function(url) {
            // now that we know the url to connect to, find a peer element
            // currently, this is only via creating an iframe.
            self.peerUrl=url;
            self.peerOrigin=ozpIwc.util.determineOrigin(url);
            return self.createIframePeer();
        }).then(function() {
            // start listening to the bus and ask for an address
            this.postMessageHandler = function (event) {
                if (event.origin !== self.peerOrigin) {
                    return;
                }
                try {
                    var message = event.data;
                    if (typeof(message) === 'string') {
                        message = JSON.parse(event.data);
                    }
                    self.receive(message);
                    self.receivedBytes += (event.data.length * 2);
                    self.receivedPackets++;
                } catch (e) {
                    // ignore!
                }
            };
            // receive postmessage events
            ozpIwc.util.addEventListener("message", this.postMessageHandler);
            return self.send({dst: "$transport"});
        }).then(function(message) {
            self.address = message.dst;

            /**
             * Fired when the client receives its address.
             * @event #gotAddress
             */
            self.events.trigger("gotAddress", self);

            // dump any queued sends, trigger that we are fully connected
            self.preconnectionQueue.forEach(function (p) {
                self.send(p.fields, p.callback, p.promiseRes, p.promiseRej);
            });
            self.preconnectionQueue = [];

            if (!self.launchParams.inFlightIntent) {
                return;
            }

            // fetch the inFlightIntent
            var packet = {
                dst: "intents.api",
                resource: self.launchParams.inFlightIntent,
                action: "get"
            };
            return self.send(packet);
        }).then(function (response) {
            if(response) {
                self.launchedIntents.push(response);
                if (response.response === 'ok') {
                    for (var k in response.entity) {
                        self.launchParams[k] = response.entity[k];
                    }
                }
            }
            /**
             * Fired when the client is connected to the IWC bus.
             * @event #connected
             */
            self.events.trigger("connected");
        });
    }
    return this.connectPromise; 
};

/**
 * Creates an invisible iFrame Peer for IWC bus communication.
 *
 * @method createIframePeer
 */
ozpIwc.Client.prototype.createIframePeer=function() {
    var self=this;
    return new Promise(function(resolve,reject) {
        var createIframeShim=function() {
            self.iframe = document.createElement("iframe");
            self.iframe.addEventListener("load",function() {
                resolve();
            });
						var url=self.peerUrl+"/iframe_peer.html";
						if(self.launchParams.log) {
							url+="?log="+self.launchParams.log;
						}
            self.iframe.src=url;
            self.iframe.height=1;
            self.iframe.width=1;
            self.iframe.setAttribute("area-hidden",true);
            self.iframe.setAttribute("hidden",true);
            self.iframe.style.setProperty ("display", "none", "important");
            document.body.appendChild(self.iframe);
            self.peer=self.iframe.contentWindow;
            

        };
        // need at least the body tag to be loaded, so wait until it's loaded
        if(document.readyState === 'complete' ) {
            createIframeShim();
        } else {
            ozpIwc.util.addEventListener("load",createIframeShim);
        }
    });
};

/**
 * Handles intent invocation packets. Communicates back with the intents.api to operate the in flight intent state
 * machine.
 *
 * @method intentInvocationHandling
 * @param resource {String} The resource of the packet that sent the intent invocation
 * @param intentResource {String} The in flight intent resource, used internally to operate the in flight intent state machine
 * @param callback {Function} The intent handler's callback function
 * @returns {Promise}
 */
ozpIwc.Client.prototype.intentInvocationHandling = function(resource,intentResource,callback) {
    var self = this;
    var res;
    return self.send({
        dst: "intents.api",
        action: "get",
        resource: intentResource
    }).then(function (response) {
        response.entity.handler = {
            address: self.address,
            resource: resource
        };
        response.entity.state = "running";

        res = response;
        return self.send({
            dst: "intents.api",
            contentType: response.contentType,
            action: "set",
            resource: intentResource,
            entity: response.entity
        });
    }).then(function (reply) {
        //Now run the intent
        res.entity.reply.entity = callback(res.entity) || {};
        // then respond to the inflight resource
        res.entity.state = "complete";
        res.entity.reply.contentType = res.entity.intent.type;
        return self.send({
            dst: "intents.api",
            contentType: res.contentType,
            action: "set",
            resource: intentResource,
            entity: res.entity
        });
    });
};

/**
 * Calls the specific api wrapper given an api name specified.
 * If the wrapper does not exist it is created.
 *
 * @method api
 * @param apiName {String} The name of the api.
 * @returns {Function} returns the wrapper call for the given api.
 */
ozpIwc.Client.prototype.api=function(apiName) {
    return this.wrapperMap[apiName] || this.updateApi(apiName);
};


/**
 * Updates the wrapper map for api use. Whenever functionality is added or removed from the apiMap the
 * updateApi must be called to reflect said changes on the wrapper map.
 *
 * @method updateApi
 * @param apiName {String} The name of the api
 * @returns {Function} returns the wrapper call for the given api.
 */
ozpIwc.Client.prototype.updateApi = function(apiName){
    var augment = function (dst,action,client) {
        return function (resource, fragment, otherCallback) {
            // If a fragment isn't supplied argument #2 should be a callback (if supplied)
            if(typeof fragment === "function"){
                otherCallback = fragment;
                fragment = {};
            }
            var packet = {
                'dst': dst,
                'action': action,
                'resource': resource,
                'entity': {}
            };
            for (var k in fragment) {
                packet[k] = fragment[k];
            }
            if(dst === "intents.api" && action === "register"){
                for(var i in client.launchedIntents){
                    var loadedResource = '/' + client.launchedIntents[i].entity.intent.type + '/' + client.launchedIntents[i].entity.intent.action;
                    if(resource === loadedResource){
                        client.intentInvocationHandling(resource,client.launchedIntents[i].resource,otherCallback);
                        delete client.launchedIntents[i];
                    }
                }
            }
            return client.send(packet,otherCallback);
        };
    };

    var wrapper=this.wrapperMap[apiName] || {};
    if(this.apiMap.hasOwnProperty(apiName)) {
        var api = this.apiMap[apiName];
        wrapper = {};
        for (var i = 0; i < api.actions.length; ++i) {
            var action = api.actions[i];
            wrapper[action] = augment(api.address, action, this);
        }

        this.wrapperMap[apiName] = wrapper;
    }
    wrapper.apiName=apiName;
    return wrapper;
};