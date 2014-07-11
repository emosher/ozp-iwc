/**
 * Multi-peer example.
 *
 */

describe('Participant Integration', function () {
    var clients = [];

    var setPacket = {
        dst: "data.api",
        action: "set",
        resource: "/test",
        entity: "test works",
        test: true
    };

    var watchPacket = {
        dst: "data.api",
        action: "watch",
        resource: "/test"
    };

    var maxPacketsPerSource = function (packetsSeen) {
        var maxPackets = 0;
        for (var src in packetsSeen) {
            if (packetsSeen[src].length > maxPackets) {
                maxPackets = packetsSeen[src];
            }
        }
        return maxPackets;
    };

    beforeEach(function (done) {
        var clientGen = {
            clientUrl: "http://localhost:14000/integration/additionalOrigin.html"
        };
        var clientCount = 0;
        var numClients = 2;
        var called = false;

        for (var i = 0; i < numClients; i++) {
            generateClient(clientGen, function (client) {
                clients.push(client);
                clientCount++;
                // Wait until
                if (clientCount == numClients && !called) {
                    called = true;
                    done();
                }
            });
        }
    });

    afterEach(function () {
        for (var i = 0; i < clients.length; i++) {
            if (clients[i]) {
                clients[i].remove();
            }
        }
        clients = [];
    });


    it('can watch resources set by peers.', function (done) {
        var called = false;

        var watchCallback = function (reply) {
            if (!called && reply.action === 'changed') {
                called = true;

                expect(reply.action).toEqual('changed');
                //TODO: should the new value be in entity.newValue.entity?
                expect(reply.entity.newValue).toEqual(setPacket.entity);

                done();
                // returning falsy will cause callback to not persist.
                return null;


            } else if (reply.action === 'ok') {
                clients[1].send(setPacket);
            }

            // returning truthy will cause callback to persist.
            return true;
        };

        clients[0].send(watchPacket, watchCallback);
    });


    it('limits packet History to ozpIwc.Peer.maxSeqIdPerSource', function (done) {
        var called = false;
        var receiveCount = 0;
        var echoCallback = function (event) {
            if (event.echo) {
                expect(event.maxSeqIdPerSource).not.toBeLessThan(maxPacketsPerSource(event.packetsSeen));
                if (!called && receiveCount++ >= 1010) {
                    expect(maxPacketsPerSource(event.packetsSeen)).not.toBeLessThan(1000);
                    called = true;
                    done();
                }
            }
        };

        clients[0].on("receive", echoCallback);
        for (var i = 0; i <= 1010; i++) {
            clients[0].send(setPacket);
        }
    });

    it('reads metrics gauges', function (done) {
        var called = false;
        var receiveCount = 0;
        var echoCallback = function (event) {
            if (event.echo) {
                if (!called && receiveCount++ >= 100) {
                    expect(event.routerParticipants).not.toBeLessThan(1);
                    expect(event.postMessageParticipants).not.toBeLessThan(1);
                    expect(event.leaderGroupElectionQueue).toBeDefined;
                    expect(event.internalParticipantCallbacks).toBeDefined;
                    expect(event.authorizedRoles).toBeDefined;
                    expect(event.authenticatedRoles).toBeDefined;
                    expect(event.metricsTypes).toBeDefined;
                    expect(event.linksStorage).toBeDefined;
                    console.log("links storage: " + event.linksStorage);
                    called = true;
                    done();
                }
            }
        };

        clients[0].on("receive", echoCallback);
        for (var i = 0; i <= 100; i++) {
            clients[0].send(setPacket);
        }
    });
});
