
var debuggerModule=angular.module("ozpIwc.debugger",[
    'ngRoute',
    'ui.bootstrap'
]);
        
        
debuggerModule.factory("iwcClient",function() {
    var client=new ozpIwc.InternalParticipant({name: "debuggerClient"});
    ozpIwc.defaultRouter.registerParticipant(client);
    return client;
});
        
        
debuggerModule.controller("debuggerController",["$scope","iwcClient",function(scope,client) {
    scope.client=client;
    scope.apis=[
        {'address': "data.api"},
        {'address': "intents.api"},
        {'address': "system.api"},
        {'address': "names.api"}
    ];
}]);
        
        
debuggerModule.controller("packetLogController",["$scope",function(scope) {
    scope.logging=false;
    scope.viewFilter="";
    scope.packets=[];
    scope.maxShown=50;
    
    function logPacket(msg) {        
        if(!scope.logging) {
            return;
        }
              
        var packet=msg.packet;
        scope.$apply(function() {
           scope.packets.push(packet);
        });
    };
    
    ozpIwc.defaultPeer.on("receive",logPacket);
    ozpIwc.defaultPeer.on("send",logPacket);
    
}]);
        
        
debuggerModule.controller("apiDisplayController",["$scope","iwcClient",function(scope,client) {
    scope.keys=[];
    scope.loadKey=function(key) {
        client.send({
            'dst': scope.api.address,
            'action': "get",
            'resource': key.resource
        },function(response) {
            for(i in response) {
                key[i]=response[i];
            }
            key.isLoaded=true;
        });
        client.send({
            'dst': scope.api.address,
            'action': "list",
            'resource': key.resource
        },function(response) {
            if(response.response==="ok") {
                key.children=response.entity;
            }else {
                key.children="Not Supported: " + response.response;
            }
        });
    };
    scope.refresh=function() {
        client.send({
            'dst': scope.api.address,
            'action': "list"
        },function(response) {
            scope.keys=response.entity.map(function(k) {
                var key={
                    'resource': k,
                    'isLoaded':false,
                    'isWatched':false
                };
                scope.loadKey(key);
                return key;
            });
        });
    };
    

    
    scope.watchKey=function(key) {
        if(key.isWatched) {
            client.send({
                'dst': scope.api.address,
                'action': "watch",
                'resource': key.resource
            },function(response) {
                if(response.response === 'changed') {
                    scope.$evalAsync(function() {
                        key.entity=response.entity.newValue;
                        key.permissions=response.permissions;
                        key.contentType=response.contentType;
                    });
                }
                return key.isWatched;
            });
        }
    };
    scope.refresh();
}]);

        
debuggerModule.controller("metricsController",['$scope','$interval',function(scope,$interval) {
    scope.updateFrequency=1000;
    scope.updateActive=true;
        
    scope.refresh=function() {
        scope.metrics=ozpIwc.metrics.allMetrics().map(function(m) {
            return {
                'name' :m.name,
                'unit' : m.unit(),
                'value' : m.get()
            };
        });
    };
    
    scope.refresh();
    
    var timer=null;
    var updateTimer=function() {
        if(timer) {
            $interval.cancel(timer);
        }
        if(scope.updateActive) {
            timer=$interval(scope.refresh,scope.updateFrequency);
        }
    };
    
    
    scope.$watch('updateActive', updateTimer);
    scope.$watch('updateFrequency', updateTimer);
}]);