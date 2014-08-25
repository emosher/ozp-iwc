describe("Data API",function() {

	var dataApi;
	var node;
	beforeEach(function() {	
		dataApi=new ozpIwc.DataApi({
			'participant': new TestParticipant()
		});
        
        node=new ozpIwc.DataApiValue({
            'resource': "/node",
            'entity' : { 'foo':1 },
            'contentType' : "application/json",
            'version' : 1
        });
	});
	
	afterEach(function() {
		dataApi=null;
        node=null;
	});
    
    it("adds a child",function() {
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/node",
                'action': "addChild",
                'entity': {
                    'bar':2
                },
                'contentType': "application/fake+json"
            }
        });
		
        dataApi.handleAddchild(node,packetContext);

        var reply=packetContext.responses[0];
        expect(reply.response).toEqual("ok");
        expect(reply.entity.resource).toBeDefined();
        
        // the node should have the new resource as it's only child
        expect(node.children[0]).toEqual(reply.entity.resource);

        // check that the child node was actually created.
        expect(dataApi.data[reply.entity.resource].entity).toEqual({'bar':2});
    });
        
    it("removes a child",function() {
        node.addChild("child1");
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/node",
                'action': "removeChild",
                'entity': {
                    'resource': "child1"
                },
                'contentType': "application/fake+json"
            }
        });
		
        dataApi.handleRemovechild(node,packetContext);

        var reply=packetContext.responses[0];
        expect(reply.response).toEqual("ok");
        expect(node.children).toEqual([]);

    });

    it("generates changes for added children",function() {
        dataApi.data['/node']=node;
        node.watch({'src': "watcher",'msgId': 1234});
        
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/node",
                'action': "addChild",
                'entity': {
                    'bar':2
                },
                'contentType': "application/fake+json"
            },
            'leaderState': "leader"
        });
		
        dataApi.routePacket(packetContext);

        expect(dataApi.participant.sentPackets.length).toEqual(1);
        var changePacket=dataApi.participant.sentPackets[0];
        expect(changePacket.response).toEqual("changed");
        expect(changePacket.entity.addedChildren[0]).toMatch(/\/node\/[0-9a-f]+/);
    });
    it("generates changes for removed children",function() {
        dataApi.data['/node']=node;
        node.addChild("child1");
        node.watch({'src': "watcher",'msgId': 1234});
        
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/node",
                'action': "removeChild",
                'entity': {
                    'resource': "child1"
                },
                'contentType': "application/fake+json"
            },
            'leaderState': "leader"
        });
		
        dataApi.routePacket(packetContext);

        expect(dataApi.participant.sentPackets.length).toEqual(1);
        var changePacket=dataApi.participant.sentPackets[0];
        expect(changePacket.response).toEqual("changed");
        expect(changePacket.entity.removedChildren[0]).toEqual("child1");
    });

        
});