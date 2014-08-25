/**
 * Network Integration
 */


describe("Names API", function () {
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


    describe("/address resources", function() {
        xit("returns info about myself via get /address/${client.address}",function(done) {
            
        });

        xit("uses the /me alias for get /address/${client.address}",function(done) {
            
        });    
        xit("returns limited info about another client",function(done) {
            
        });
        xit("returns metrics information about me at /address/${client.address}/metrics",function(done) {
            
        });

        xit("set action is noPerm",function(done) {
            
        });
        xit("delete action is noPerm",function(done) {
            
        });

    });
    describe("/multicast resources",function() {
        xit("adds client to the group with an addChild action on /multicast/${name}",function(done) {
            
        });    
        xit("returns multicast group info for /multicast/${name}",function(done) {
            
        });

        xit("returns the group members for /multicast/${name} for members",function(done) {
            
        });
        xit("returns metrics information about the multicast group at /multicast/${name}/metrics",function(done) {
            
        });
        
        xit("set action is noPerm",function(done) {
            
        });
        xit("delete action is noPerm",function(done) {
            
        });

    });
    
    describe("/api resources",function() {
        xit("returns a list of APIs at /api",function(done) {
            
        });
        xit("returns a descriptor at /api/data.api",function(done) {
            
        });
        xit("returns API metrics at /api/data.api/metrics",function(done) {
            
        });
        
        xit("set action is noPerm",function(done) {
            
        });
        xit("delete action is noPerm",function(done) {
            
        });
    });


    xdescribe("Legacy integration tests",function() {
        it('Client sets values', function () {
            var called = false;
            var sentPacket;

            var setCallback = function (reply) {
                if (!called) {
                    called = true;

                    expect(reply.replyTo).toEqual(sentPacket.msgId);
                    expect(reply.response).toEqual('ok');

                    done();
                    return null;
                }
            };

            sentPacket = client.send(setPacket, setCallback);
        });


        it('Client gets values', function (done) {
            var called = false;
            var sentSetPacket, sentGetPacket;

            var getCallback = function (reply) {
                if (!called) {
                    called = true;

                    expect(reply.replyTo).toEqual(sentGetPacket.msgId);
                    expect(reply.entity).toEqual(sentSetPacket.entity);

                    done();
                    return null;
                }
            };

            sentSetPacket = client.send(setPacket, function (reply) {
                sentGetPacket = client.send(getPacket, getCallback);
            });
        });

        it('Client deletes values', function (done) {
            var called = false;
            var sentDeletePacket;
            var deleteCallback = function (reply) {
                if (!called) {
                    called = true;

                    expect(reply.replyTo).toEqual(sentDeletePacket.msgId);
                    expect(reply.response).toEqual('ok');

                    done();
                    return null;
                }
            };

            sentDeletePacket = client.send(deletePacket, deleteCallback);
        });


        it('Client watches & un-watches keys', function (done) {
            var called = false;
            var sentWatchPacket, sentUnwatchPacket, sentSetPacket;

            var watchPacket = {
                dst: "names.api.test",
                action: "watch",
                resource: "/address/testAddress"
            };

            var unwatchPacket = {
                dst: "names.api.test",
                action: "unwatch",
                resource: "/address/testAddress"
            };

            var unwatchCallback = function (reply) {
                if (!called) {
                    called = true;

                    expect(reply.replyTo).toEqual(sentUnwatchPacket.msgId);
                    expect(reply.response).toEqual('ok');

                    done();
                    return null;
                }
            };

            var watchCallback = function (reply) {
                if (reply.action === "changed") {
                    expect(reply.replyTo).toEqual(sentWatchPacket.msgId);
                    expect(reply.entity.newValue).toEqual(sentSetPacket.entity);

                    sentUnwatchPacket = client.send(unwatchPacket, unwatchCallback);
                    return null;
                }
                // return truthy to persist callback
                return true;
            };

            sentWatchPacket = client.send(watchPacket, watchCallback);
            sentSetPacket = client.send(setPacket);
        });
    });
});
