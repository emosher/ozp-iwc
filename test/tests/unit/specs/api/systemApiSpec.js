describe("System API",function() {

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
        systemApi=new ozpIwc.SystemApi({
            'participant': new TestParticipant()
        });

        systemApi.data["/application/abcApp"]=applicationNode=systemApi.findOrMakeValue(applicationPacket);
        systemApi.participant.sentPackets = [];
    });

    afterEach(function() {
        ozpIwc.endpoint=oldEndpoints;
        systemApi=null;
        applicationNode=null;
        userNode=null;
        systemNode=null;
    });

    it (" prevents user from setting an application", function(){
        var packetContext = new TestPacketContext({
            'packet': applicationPacket
        });
        systemApi.data = {};
        systemApi.handleSet(applicationNode,packetContext);

        var reply=packetContext.responses[0];
        expect(reply.response).toEqual("badAction");

        // check that the participant info was not added.
        expect(systemApi.data[applicationNode.resource]).toBeUndefined();
    });

    it (" prevents user from deleting an application", function(){
        var packetContext = new TestPacketContext({
            'packet':{
                'action': 'delete'
            }
        });
//        var node = systemApi.data[applicationNode.resource].entity;
        systemApi.handleDelete(applicationNode,packetContext);

        var reply=packetContext.responses[0];
        expect(reply.response).toEqual("badAction");

        // check that the participant info was not added.
        expect(systemApi.data[applicationNode.resource]).not.toBeUndefined();
    });

    it ("gets an application",function(){
        var packetContext=new TestPacketContext({
            'packet':{
                'action': 'get'
            }
        });

        systemApi.handleGet(applicationNode,packetContext);
        var reply=packetContext.responses[0];
        expect(reply.response).toEqual("ok");
        expect(systemApi.data[applicationNode.resource].entity).toEqual(reply.entity);
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
            "url": "http://" + window.location.hostname + ":15000/?color=blue",
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
                            'url': "http://" + window.location.hostname + ":15000/?color=blue",
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