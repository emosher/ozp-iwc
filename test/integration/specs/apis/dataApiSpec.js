describe("Data API", function () {
    var client;
    var participant;
    
    beforeEach(function(done) {
        client=new ozpIwc.Client({
            peerUrl: "http://localhost:14002"
        });
        participant=new ozpIwc.test.MockParticipant({
            clientUrl: "http://localhost:14001",
            'client': client
        });
        
        var gate=done_semaphore(2,done);

        participant.on("connected",gate);
        client.on("connected",gate);
    });
    
    afterEach(function() {
        client.disconnect();
        participant.close();
    });

    it('sets a value visible to other clients',function(done) {
        participant.send({
                'dst': "data.api",
                'resource': "/test",
                'action' : "set",
                'entity' : { 'foo' : 1 }
        },function() {
            client.send({
                'dst': "data.api",
                'resource' : "/test",
                'action': "get"
            },function(packet) {
                expect(packet.entity).toEqual({'foo':1});
                done();
            });
        });

        
    });

    it('setting a value generates a change to other clients',function(done) {
        client.send({
            'dst': "data.api",
            'resource' : "/test",
            'action': "watch"
        },function(packet) {
            if(packet.response==="changed") {
                expect(packet.entity.newValue).toEqual({'foo':1});
                expect(packet.entity.oldValue).toBeUndefined();
                done();
            }
            return true;
        });
        
        participant.send({
                'dst': "data.api",
                'resource': "/test",
                'action' : "set",
                'entity' : { 'foo' : 1 }
        });
    });
    
    it("can delete a value set by someone else",function(done) {
        participant.send({
                'dst': "data.api",
                'resource': "/test",
                'action' : "set",
                'entity' : { 'foo' : 1 }
        },function() {
            client.send({
                'dst': "data.api",
                'resource' : "/test",
                'action': "delete"
            },function(packet) {
                expect(packet.response).toEqual("ok");
                client.send({
                    'dst': "data.api",
                    'resource' : "/test",
                    'action': "get"
                },function(packet) {
                    expect(packet.entity).toBeUndefined();
                    done();
                });
            });
        });
        
    });
    
    it('Integration bus cleans up after every run',function(done) {
        client.send({
            'dst': "data.api",
            'resource' : "/test",
            'action': "get"
        },function(packet) {
            expect(packet.entity).toBeUndefined();
            done();
        });
    });
    
    xit('can list children added by another client',function(done) {
        
    });
    
    xit('can remove children added by another client',function(done){
        
    });
    
    xit('gets a change notice on a child being added by another client',function(done){
        
    });

    xit('gets a change notice on a child being removed by another client',function(done){
        
    });

    xit('permissions on the entity restrict access to the origin',function(done){
        
    });    
});
