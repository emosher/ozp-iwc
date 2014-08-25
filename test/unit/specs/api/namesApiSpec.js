describe("Names API",function() {

	var namesApi;
    
	beforeEach(function() {
		namesApi=new ozpIwc.NamesApi({
			'participant': new TestParticipant()
		});
	});

	afterEach(function() {
		namesApi=null;
	});

    it("responds with badResource for arbitrary resources",function() {
        var context=new TestPacketContext({
            'leaderState': "leader",
            'packet': {
                'resource': "/doesNotExist",
                'action': "get",
                'msgId' : "1234",
                'src' : "srcParticipant"
            }
        });
        namesApi.routePacket(context);            
        expect(context.responses[0].response).toEqual("badResource");
    });
    [ {
            'resource': "/address",
            'contentType' : "application/ozpIwc-address-v1+json"
      },{
            'resource': "/multicast",
            'contentType' : "application/ozpIwc-multicast-address-v1+json"
      },{
            'resource': "/api",
            'contentType' : "application/ozpIwc-api-descriptor-v1+json"
      },{
            'resource': "/router",
            'contentType' : "application/ozpIwc-router-v1+json"
      }   
    ].forEach(function(r) {
        describe("Resource tree " + r.resource, function() {
            it("exists",function() {
                var context=new TestPacketContext({
                    'leaderState': "leader",
                    'packet': {
                        'resource': r.resource,
                        'action': "get",
                        'msgId' : "1234",
                        'src' : "srcParticipant"
                    }
                });
                namesApi.routePacket(context);            
                expect(context.responses[0].response).toEqual("ok");
                expect(context.responses[0].entity).toEqual([]);
                expect(context.responses[0].contentType).toEqual(r.contentType);
            });
            it("responds with noPermission when attempting to set",function() {
                var context=new TestPacketContext({
                    'leaderState': "leader",
                    'packet': {
                        'resource': r.resource,
                        'action': "set",
                        'msgId' : "1234",
                        'src' : "srcParticipant",
                        'entity' : { 'foo' : 1 }
                    }
                });
                namesApi.routePacket(context);            
                expect(context.responses[0].response).toEqual("noPermission");
            });
            it("allows  " + r.contentType + " when setting a value in the tree",function() {
                var context=new TestPacketContext({
                    'leaderState': "leader",
                    'packet': {
                        'resource': r.resource + "/testValue",
                        'contentType': r.contentType,
                        'action': "set",
                        'msgId' : "1234",
                        'src' : "srcParticipant",
                        'entity' : { 'foo' : 1 }
                    }
                });
                namesApi.routePacket(context);            
                expect(context.responses[0].response).toEqual("ok");
            });
            it("updates the collection  when setting a value in the tree",function() {
                namesApi.routePacket(new TestPacketContext({
                    'leaderState': "leader",
                    'packet': {
                        'resource': r.resource + "/testValue",
                        'contentType': r.contentType,
                        'action': "set",
                        'msgId' : "1234",
                        'src' : "srcParticipant",
                        'entity' : { 'foo' : 1 }
                    }
                }));
                var context=new TestPacketContext({
                    'leaderState': "leader",
                    'packet': {
                        'resource': r.resource,
                        'action': "get",
                        'msgId' : "1234",
                        'src' : "srcParticipant"
                    }
                });
                namesApi.routePacket(context);            
                expect(context.responses[0].response).toEqual("ok");
                expect(context.responses[0].entity).toContain(r.resource + "/testValue");
                expect(context.responses[0].contentType).toEqual(r.contentType);
                
            });
            it("responds with badContent when missing the contentType",function() {
                var context=new TestPacketContext({
                    'leaderState': "leader",
                    'packet': {
                        'resource': r.resource + "/testValue",
                        'action': "set",
                        'msgId' : "1234",
                        'src' : "srcParticipant",
                        'entity' : { 'foo' : 1 }
                    }
                });
                namesApi.routePacket(context);            
                expect(context.responses[0].response).toEqual("badContent");
            });

            it("responds with badContent with invalid contentType",function() {
                var context=new TestPacketContext({
                    'leaderState': "leader",
                    'packet': {
                        'resource': r.resource + "/testValue",
                        'action': "set",
                        'contentType': r.contentType+"+xml",
                        'msgId' : "1234",
                        'src' : "srcParticipant",
                        'entity' : { 'foo' : 1 }
                    }
                });
                namesApi.routePacket(context);            
                expect(context.responses[0].response).toEqual("badContent");
            });

        });
    });


});