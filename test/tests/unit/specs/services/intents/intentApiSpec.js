describe("Intent API Class", function () {

    var apiBase;
    var endpoint;

    // mock data for the endpoints
    var data={
        "http://example.com/intents/1": {response: {
            _links: {
                self: {href:"http://example.com/intents/1"}
            }             
        }}
    };
    data["/"]={ response: {
        _links: {item: Object.keys(data).map(function(k) { return {href:k};})},
        _embedded: { item: [] }             
    }};

    beforeEach(function () {
        apiBase = new ozpIwc.IntentsApi({
            'participant': new TestClientParticipant(),
            'name': "testIntents.api",
            'router': new FakeRouter()
        });
        apiBase.isRequestQueueing=false;

        endpoint=jasmine.createSpyObj('endpoint',['get','put','delete']);
//        ozpIwc.endpoint=function() { return endpoint; };
        ozpIwc.endpoint=jasmine.createSpy("ozpIwc.endpoint");
        ozpIwc.endpoint.and.returnValue(endpoint);
        spyOn(ozpIwc.util,"openWindow");
        
        endpoint.get.and.callFake(function(url) {
            return Promise.resolve(data[url]);
         });
    });
    
    pit("fetches data from the server",function() {
        return apiBase.transitionToLoading().then(function() {
           expect(endpoint.get).toHaveBeenCalledWith("/");
           Object.keys(data).forEach(function(uri){
               expect(endpoint.get).toHaveBeenCalledWith(uri); 
           });
        });
    });
    pit("registers handlers",function() {
        var testPacket=new TestPacketContext({
            'packet': {
                'resource': "/text/plain/view",
                'action': "register",
                'contentType' : "application/vnd.ozp-iwc-intent-handler-v1+json",
                'entity': {
                    'bar':2
                }
            },
            'leaderState': "leader"
        });
        return apiBase.receivePacketContext(testPacket).then(function(){
            expect(testPacket.responses[0]).toEqual(jasmine.objectContaining({
                response: "ok"
            }));
            expect(testPacket.responses[0].entity.resource).toMatch(/text\/plain\/view\/.*/);
        });
    });

    describe("invocation workflow",function() {
        var handlerResource="/text/plain/view/1234";
         
        var makeInvocationPacket=function(resource) {
            return new TestPacketContext({
                'packet': {
                    'resource': resource,
                    'action': "invoke",
                    'contentType' : "text/plain",
                    'entity': "Some Text"
                },
                'leaderState': "leader"
            });
        };
        
        beforeEach(function() {
            apiBase.data[handlerResource]=new ozpIwc.ApiNode({
                'resource': handlerResource,
                'contentType' : "application/vnd.ozp-iwc-intent-handler-v1+json",
                'entity': {
                    'type': "text/plain",
                    'action' : "view",
                    'invokeIntent': {
                        dst: "system.api",
                        resource: "/intentHandler",
                        action: "view"
                    }
                }
            });
            apiBase.data["/text/plain/view/7890"]=new ozpIwc.ApiNode({
                'resource': "/text/plain/view/7890",
                'contentType' : "application/vnd.ozp-iwc-intent-handler-v1+json",
                'entity': {
                    'type': "text/plain",
                    'action' : "view",
                    'invokeIntent': {
                        dst: "someApplication",
                        resource: "/intentHandler",
                        action: "view"
                    }
                }
            });
        });
        
        pit("invokes handlers directly",function() {
            var invocationPacket=makeInvocationPacket(handlerResource);
            return apiBase.receivePacketContext(invocationPacket).then(function() {
                expect(invocationPacket).toHaveSent({
                    dst: invocationPacket.packet.src,
                    response: "ok"
                });
                var inflightNode=apiBase.data[invocationPacket.responses[0].entity.inFlightIntent]
                expect(inflightNode.entity.state).toEqual("delivering");
            });
        });

        pit("presents the chooser when there are multiple choices",function() {
            var invocationPacket=makeInvocationPacket("/text/plain/view");
            return apiBase.receivePacketContext(invocationPacket).then(function() {
                expect(invocationPacket).toHaveSent({
                    dst: invocationPacket.packet.src,
                    response: "ok"
                });
                var inflightNode=apiBase.data[invocationPacket.responses[0].entity.inFlightIntent];
                expect(inflightNode.entity.state).toEqual("choosing");
                expect(ozpIwc.util.openWindow)
                    .toHaveBeenCalledWith("intentsChooser.html",jasmine.objectContaining({
                        "ozpIwc.peer": ozpIwc.BUS_ROOT,
                        "ozpIwc.intentSelection": "intents.api"+inflightNode.resource
                    }));
            });
        });
        
        pit("presents the chooser when there are multiple choices",function() {
            var invocationPacket=makeInvocationPacket("/text/plain/view");
            return apiBase.receivePacketContext(invocationPacket).then(function() {
                expect(invocationPacket).toHaveSent({
                    dst: invocationPacket.packet.src,
                    response: "ok"
                });
                var inflightNode=apiBase.data[invocationPacket.responses[0].entity.inFlightIntent];
                expect(inflightNode.entity.state).toEqual("choosing");
                expect(ozpIwc.util.openWindow)
                    .toHaveBeenCalledWith("intentsChooser.html",jasmine.objectContaining({
                        "ozpIwc.peer": ozpIwc.BUS_ROOT,
                        "ozpIwc.intentSelection": "intents.api"+inflightNode.resource
                    }));
            });
        });
        xit("uses a saved preference when one exists",function() {
        });
        
        xit("sends the delivering packet when the chooser picks a handler",function() {
        });
        
        xit("marks the invocation as running when ",function() {
        });
        
        xit("sends the delivering packet when the chooser picks a handler",function() {
        });
    });
});