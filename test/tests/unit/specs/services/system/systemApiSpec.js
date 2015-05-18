describe("System API", function() {

    var systemApi;
    var applicationNode;
    var userNode;
    var systemNode;
    var oldEndpoints;
    var applicationPacket = {
        'resource': "/application/abcApp",
        'contentType' : "application/vnd.ozp-application-v1+json",
        'version' : 1,
        'entity' : {
            "name" : "Blue Bouncing Ball",
            "description" : "A blue bouncing ball",
            "type" : "application",
            "state" : "active",
            "uiHints": {
                "width" : 400,
                "height" : 400,
                "singleton" : false
            },
            "tags": [
                "demo"
            ],
            "intents": [
                {
                    "type": "application/ozp-demo-ball+json",
                    "action": "view",
                    "icon": "http://" + window.location.hostname + ":15000/largeIcon.png",
                    "label": "Blue Ball"
                }
            ],
            "icons" : {
                "small": "http://" + window.location.hostname + ":15000/largeIcon.png",
                "large": "http://" + window.location.hostname + ":15000/smallIcon.png"
            },
            "screenShots" : [
                {
                    "href" : "http://" + window.location.hostname + ":15000/screenShot.png",
                    "title" : "A screenshot"
                }
            ],
            "launchUrls" : {
                "default": "http://" + window.location.hostname + ":15000/?color=blue",
                "test" : "http://test.localhost:15000/?color=blue"
            },
            "_links": {
                "self" : { "href": "/api/application/v1/12345"},
                "describes" : { "href": "http://" + window.location.hostname + ":15000/?color=blue"}
            }
        }
    };
    beforeEach(function() {
        oldEndpoints=ozpIwc.endpoint;
        ozpIwc.endpoint=function() {
            return {
                get: function() { return Promise.resolve(); }
            };            
        };
        systemApi = new ozpIwc.SystemApi({
            'name': "system.test.api",
            'participant': new TestClientParticipant(),
            'router': new FakeRouter()
        });
        systemApi.isRequestQueueing = false;
        systemApi.participant.sentPackets = [];
        systemApi.createNode(applicationPacket);
    });

    afterEach(function() {
        systemApi = null;
       ozpIwc.endpoint=oldEndpoints;
        systemApi=null;
        applicationNode=null;
        userNode=null;
        systemNode=null;
     });

    pit("does not allow set on /application/{id}", function() {
        var context = new TestPacketContext({
            'leaderState': "leader",
            'packet': {
                'resource': "/application/1234",
                'action': "set",
                'msgId': "1234",
                'src': "srcParticipant",
                entity: {
                    launchUrls: {
                        default: "http://bogus.com"
                    }
                }
            }
        });
        return systemApi.receivePacketContext(context).then(function() {
            expect(context.responses[0].response).toEqual("badAction");
        });
    });

    pit (" prevents user from deleting an application", function(){
        var context = new TestPacketContext({
            'leaderState': "leader",
            'packet': {
                'resource': "/application/1234",
                'action': "delete",
                'msgId': "1234",
                'src': "srcParticipant",
                entity: {
                    launchUrls: {
                        default: "http://bogus.com"
                    }
                }
            }
        });
        return systemApi.receivePacketContext(context).then(function() {
            expect(context.responses[0].response).toEqual("badAction");
        });
		});

    it ("gets an application",function(){
         var context = new TestPacketContext({
            'leaderState': "leader",
            'packet': {
                'resource': "/application/1234",
                'action': "delete",
                'msgId': "1234",
                'src': "srcParticipant",
                entity: {
                    launchUrls: {
                        default: "http://bogus.com"
                    }
                }
            }
        });
        return systemApi.receivePacketContext(context).then(function() {
					var reply=context.responses[0];
	        expect(reply.response).toEqual("ok");
	        expect(reply.entity).toEqual(systemApi.data[applicationNode.resource]);
        });
    });

    it('handles launch actions', function(){
        var launchData={
                    'foo': 1
                };
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/application/abcApp",
                'entity' : launchData
            },
            action: 'launch'
        });
        systemApi.handleLaunch(applicationNode,packetContext);

        var reply=packetContext.responses[0];
        expect(reply.response).toEqual("ok");

        var sent = systemApi.participant.sentPackets[0];
        expect(sent.action).toEqual("invoke");
        expect(sent.dst).toEqual("intents.api");
        expect(sent.entity).toEqual({ 
            "url": "http://localhost:15000/?color=blue",
            "applicationId": "/application/abcApp",
            "launchData": launchData
        });
    });

    it('handles invoke actions by launching applications', function(){
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/application/abcApp",
                'entity' : {
                    'foo': 1,
                    'inFlightIntent': '/intents/invocation/123',
                    'inFlightIntentEntity': {
                        'entity': {
                            'url': "http://localhost:15000/?color=blue",
                            "applicationId": "/application/abcApp",
                            "launchData": "Hello World"
                        }
                    }
                      
                }
            },
            action: 'invoke'
        });
        spyOn( ozpIwc.util,"openWindow");

        systemApi.rootHandleInvoke(applicationNode,packetContext);

        var reply=packetContext.responses[0];
        expect(reply.response).toEqual("ok");

        expect(ozpIwc.util.openWindow.calls.mostRecent().args[0]).toEqual("http://" + window.location.hostname + ":15000/?color=blue");
        var params= decodeURIComponent(ozpIwc.util.openWindow.calls.mostRecent().args[1]).split('&');
        expect(params.length).toEqual(2);
        expect(params[0]).toEqual('ozpIwc.peer='+ozpIwc.BUS_ROOT);
        expect(params[1]).toEqual('ozpIwc.inFlightIntent='+packetContext.packet.entity.inFlightIntent);
    });
});