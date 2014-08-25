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

                expect(reply.response).toEqual('changed');
                //TODO: should the new value be in entity.newValue.entity?
                expect(reply.entity.newValue).toEqual(setPacket.entity);

                done();
                // returning falsy will cause callback to not persist.
                return null;


            } else if (reply.response === 'ok') {
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
                        called = true;
                        done();
                    }
                }
            };

            clients[0].on("receive", echoCallback);
            for (var i = 0; i <= 100; i++) {
                clients[0].send(setPacket);
            }}
    );

    it('gets the current participant address', function (done) {
        var called = false;
        var echoCallback = function (event) {
            if (event.echo) {
                expect(event.alias).toEqual(event.literal);
                if (!called) {
                    called=true;
                    done();
                }
            }
        };

        clients[0].on("receive", echoCallback);
        clients[0].send(setPacket);
    });

    it('Queries names.api for the registered participant information', function (done) {
        var called = false;
        var getAddressListPacket = {
            dst: "names.api",
            action: "get",
            resource: "/address"
        };

        var foundAddresses=[];

        var addressCallback=function(packet) {
            var found=false;
            console.log("Found " + packet.entity.participantType + " participant");
            Object.keys(packet.entity).forEach(function(key) {
                if (typeof packet.entity[key] === 'object') {
                    console.log("\t" + key + " values");
                    if (packet.entity[key]) {
                        Object.keys(packet.entity[key]).forEach(function (subKey) {
                            console.log("\t\t" + subKey + " = " + packet.entity[key][subKey]);
                        });
                    }
                } else {
                    console.log("\t" + key + " = " + packet.entity[key]);
                }
                found=true;
            });
            expect(found).toBeTruthy();

            if (foundAddresses.length == 0) {
                if (!called) {
                    called = true;
                    done();
                }
            } else {
                var id=foundAddresses.shift();
                var getAddressPacket = {
                    dst: "names.api",
                    action: "get",
                    resource: "/address/" + id
                };
                clients[0].send(getAddressPacket,addressCallback);
            }
            return false;
        }

        var addressListCallback=function(packet) {
            packet.entity.forEach(function(id) {
                if (id !== 'undefined') {
                    foundAddresses.push(id);
                    console.log("retrieved address: " + id)
                }
            });

            expect(foundAddresses.length).toBeGreaterThan(0);
            var id=foundAddresses.shift();
            var getAddressPacket = {
                dst: "names.api",
                action: "get",
                resource: "/address/" + id
            };
            clients[0].send(getAddressPacket,addressCallback);
            return false;
        };

        clients[0].send(getAddressListPacket,addressListCallback);
    });

    it('Queries names.api for the registered multicast group information', function (done) {

        var called = false;
        var getMulticastListPacket = {
            dst: "names.api",
            action: "get",
            resource: "/multicast"
        };

        var foundAddresses=[];

        var multicastCallback=function(packet) {
            var found=false;
            console.log("Found multicast group");
            packet.entity.forEach(function(address) {
                console.log("address: " + address);
                found=true;
            });
            expect(found).toBeTruthy();

            if (foundAddresses.length == 0) {
                if (!called) {
                    called = true;
                    done();
                }
            } else {
                var id=foundAddresses.shift();
                var getMulticastPacket = {
                    dst: "names.api",
                    action: "get",
                    resource: "/multicast/" + id
                };
                clients[0].send(getMulticastPacket,multicastCallback);
            }
            return false;
        }

        var multicastListCallback=function(packet) {
            packet.entity.forEach(function(id) {
                if (id !== 'undefined') {
                    foundAddresses.push(id);
                    console.log("retrieved multicast address: " + id)
                }
            });

            expect(foundAddresses.length).toBeGreaterThan(0);
            var id=foundAddresses.shift();
            var getMulticastPacket = {
                dst: "names.api",
                action: "get",
                resource: "/multicast/" + id
            };
            clients[0].send(getMulticastPacket,multicastCallback);
            return false;
        };

        clients[0].send(getMulticastListPacket,multicastListCallback);
    });

    it('Queries system.api for the default user information', function (done) {
        var called = false;
        var getUserPacket = {
            dst: "system.api",
            action: "get",
            resource: "/user"
        };

        var callback=function(packet) {
            expect(packet.entity.name).toEqual(ozpIwc.apiRoot._embedded.user.name);
            expect(packet.entity.userName).toEqual(ozpIwc.apiRoot._embedded.user.userName);
            if (!called) {
                called = true;
                done();
            }
            return false;
        };

        clients[0].send(getUserPacket,callback);
    });

    it('Queries system.api for the default system information', function (done) {
        var called = false;
        var getSystemPacket = {
            dst: "system.api",
            action: "get",
            resource: "/system"
        };

        var callback=function(packet) {
            expect(packet.entity.name).toEqual(ozpIwc.apiRoot._embedded.system.name);
            expect(packet.entity.version).toEqual(ozpIwc.apiRoot._embedded.system.version);
            if (!called) {
                called = true;
                done();
            }
            return false;
        };

        clients[0].send(getSystemPacket,callback);
    });

});
