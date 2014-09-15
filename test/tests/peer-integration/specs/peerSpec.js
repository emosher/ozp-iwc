/**
 * Multi-peer example.
 *
 */

describe('Participant Integration', function () {

    var client;
    var participant;
    var setPacket;
    var sendHandler;

    var initHandler = function() {

        console.log("setting 'send' listener for Peer with ID " + ozpIwc.defaultPeer.selfId);
        sendHandler = function (event) {
            console.log("SEND EVENT FIRED ON PEER");
            var packet = event.packet.data;
            //intercept test packets and return, with additional info, to sending Participant
            if (packet.test) {
                console.log("***** TEST PACKET FOUND *****");
                var authenticatedRoles = 0;
                var authorizedRoles = 0;
                var internalParticipantCallbacks = 0;
                var leaderGroupElectionQueue = 0;
                var postMessageParticipants = 0;
                var routerParticipants = 0;
                var linksStorage = 0;
                var metricsTypes = 0;
                var specs = ozpIwc.metrics.gauge('security.authentication.roles').get();
                if (specs) {
                    authenticatedRoles = specs.roles;
                }
                specs = ozpIwc.metrics.gauge('security.authorization.roles').get();
                if (specs) {
                    authorizedRoles = specs.roles;
                }
                specs = ozpIwc.metrics.gauge('transport.internal.participants').get();
                if (specs) {
                    internalParticipantCallbacks = specs.callbacks;
                }
                specs = ozpIwc.metrics.gauge('transport.leaderGroup.election').get();
                if (specs) {
                    leaderGroupElectionQueue = specs.queue;
                }
                specs = ozpIwc.metrics.gauge('transport.postMessageListener.participants').get();
                if (specs) {
                    postMessageParticipants = specs.participants;
                }
                specs = ozpIwc.metrics.gauge('transport.router.participants').get();
                if (specs) {
                    routerParticipants = specs.participants;
                }
                specs = ozpIwc.metrics.gauge('1links.localStorage.buffer').get();
                if (specs) {
                    linksStorage = specs.used;
                }
                specs = ozpIwc.metrics.gauge('registry.metrics').get();
                if (specs) {
                    metricsTypes = specs.types;
                } else {
                    console.log("no metrics");
                }
                var testReply = {
                    ver: 1,
                    src: participant.address,
                    alias: ozpIwc.namesApi.findOrMakeValue({
                        resource: '/me',
                        'contentType': "ozp-address-object-v1+json",
                        'src': participant.address,
                        'version': 1
                    }).entity,
                    literal: ozpIwc.namesApi.findOrMakeValue({
                        'resource': '/address/' + participant.address,
                        'contentType': "ozp-address-object-v1+json",
                        'src': participant.address,
                        'version': 1
                    }).entity,
                    msgId: "p:" + participant.msgIdSequence++,
                    time: new Date().getTime(),
                    dst: packet.src,
                    maxSeqIdPerSource: ozpIwc.Peer.maxSeqIdPerSource,
                    packetsSeen: ozpIwc.defaultPeer.packetsSeen,
                    defragmented: (event.packet.defragmented) ? event.packet.defragmented : false,
                    'authenticatedRoles': authenticatedRoles,
                    'authorizedRoles': authorizedRoles,
                    'internalParticipantCallbacks': internalParticipantCallbacks,
                    'leaderGroupElectionQueue': leaderGroupElectionQueue,
                    'postMessageParticipants': postMessageParticipants,
                    'routerParticipants': routerParticipants,
                    'linksStorage': linksStorage,
                    'metricsTypes': metricsTypes,
                    echo: true,//marker used by originating Participant
                    packet: packet
                };
                ozpIwc.defaultRouter.send(testReply, participant);
            }
        };
        ozpIwc.defaultPeer.events.on("send", sendHandler);
    };

    beforeEach(function(done) {
        initHandler();
        client=new ozpIwc.Client({
            peerUrl: "http://localhost:14002"
        });

        participant=new ozpIwc.test.MockParticipant({
            clientUrl: "http://localhost:14001",
            'client': client
        });

        var gate=done_semaphore(2,done);

        participant.on("connected",gate);
        client.on('connected', function() {
            setPacket={
                dst: 'data.api',
                action: 'set',
                resource: '/test',
                entity: 'test works',
                test: true
            };
            gate();
        });

    });

    afterEach(function(done) {
        ozpIwc.defaultPeer.events.off("send",sendHandler);
        client.disconnect();
        participant.close();
        done();
    });

    var maxPacketsPerSource = function (packetsSeen) {
        var maxPackets = 0;
        for (var src in packetsSeen) {
            if (packetsSeen[src].length > maxPackets) {
                maxPackets = packetsSeen[src];
            }
        }
        return maxPackets;
    };

    it('can watch resources set by peers.', function (done) {
        var called = false;

        client.api('data.api').watch(setPacket.resource,{},function(reply) {
            if (!called && reply.response === 'changed') {
                called = true;
                expect(reply.entity.newValue).toEqual(setPacket.entity);
                done();
                return null;//cancel callback


            } else if (reply.response === 'ok') {
                participant.send(setPacket);
            }
            return true;//persist callback
        })
            .catch(function(error) {
                expect(error).toEqual('');
            });
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
        console.log('listening for receive on client with address ' + client.address);
        client.on("receive", echoCallback);
        setPacket.dst=client.address;
        for (var i = 0; i <= 1010; i++) {
            participant.send(setPacket)
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

        client.on("receive", echoCallback);
        for (var i = 0; i <= 1010; i++) {
            participant.send(setPacket,function(reply) {
                expect(reply.response).toEqual('ok');
            });
        }
    });

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

        client.on("receive", echoCallback);
        participant.send(setPacket,function(reply) {
            expect(reply.response).toEqual('ok');
        });
    });

    it('Queries names.api for the registered participant information', function (done) {
        var called = false;
        var addressCount=0;

        var getAddressInfo = function(id) {
            (function() {
                client.api('names.api').get('/address/'+id)
                    .then(function(reply) {
                        var found=false;
                        console.log("Found " + reply.entity.participantType + " participant");
                        Object.keys(reply.entity).forEach(function(key) {
                            if (typeof reply.entity[key] === 'object') {
                                console.log("\t" + key + " values");
                                if (reply.entity[key]) {
                                    Object.keys(reply.entity[key]).forEach(function (subKey) {
                                        console.log("\t\t" + subKey + " = " + reply.entity[key][subKey]);
                                    });
                                }
                            } else {
                                console.log("\t" + key + " = " + reply.entity[key]);
                            }
                            found=true;
                        });
                        expect(found).toBeTruthy();
                        if (!called && --addressCount == 0) {
                            called=true;
                            done();
                        }
                    })
                    .catch(function(error) {
                        expect(error).toEqual('');
                    });
            })();
        };

        client.api('names.api').get('/address')
            .then(function(reply) {
                addressCount=reply.entity.length;
                reply.entity.forEach(function(id) {
                    if (id !== 'undefined') {
                        getAddressInfo(id);
                    }
                });

                expect(addressCount).toBeGreaterThan(0);
                return false;
            })
            .catch(function(error) {
                expect(error).toEqual('');
            });
    });

    it('Queries names.api for the registered multicast group information', function (done) {
        var called = false;
        var addressCount=0;

        var getAddressInfo = function(id) {
            (function() {
                client.api('names.api').get('/multicast/'+id)
                    .then(function(reply) {
                        var found=false;
                        console.log("Found " + reply.entity.participantType + " participant");
                        Object.keys(reply.entity).forEach(function(key) {
                            if (typeof reply.entity[key] === 'object') {
                                console.log("\t" + key + " values");
                                if (reply.entity[key]) {
                                    Object.keys(reply.entity[key]).forEach(function (subKey) {
                                        console.log("\t\t" + subKey + " = " + reply.entity[key][subKey]);
                                    });
                                }
                            } else {
                                console.log("\t" + key + " = " + reply.entity[key]);
                            }
                            found=true;
                        });
                        expect(found).toBeTruthy();
                        if (!called && --addressCount == 0) {
                            called=true;
                            done();
                        }
                    })
                    .catch(function(error) {
                        expect(error).toEqual('');
                    });
            })();
        };

        client.api('names.api').get('/multicast')
            .then(function(reply) {
                addressCount=reply.entity.length;
                reply.entity.forEach(function(id) {
                    if (id !== 'undefined') {
                        getAddressInfo(id);
                    }
                });

                expect(addressCount).toBeGreaterThan(0);
                return false;
            })
            .catch(function(error) {
                expect(error).toEqual('');
            });
    });

    it('Queries system.api for the default user information', function (done) {
        var called = false;

        client.api('system.api').get('/user')
            .then(function(reply) {
                expect(reply.entity.name).toEqual(ozpIwc.apiRoot._embedded.user.name);
                expect(reply.entity.userName).toEqual(ozpIwc.apiRoot._embedded.user.userName);
                if (!called) {
                    called = true;
                    done();
                }
            })
            .catch(function(error) {
                expect(error).toEqual('');
            });
    });

    it('Queries system.api for the default system information', function (done) {
        var called = false;

        client.api('system.api').get('/system')
            .then(function(reply) {
                expect(reply.entity.name).toEqual(ozpIwc.apiRoot._embedded.system.name);
                expect(reply.entity.version).toEqual(ozpIwc.apiRoot._embedded.system.version);
                if (!called) {
                    called = true;
                    done();
                }
            })
            .catch(function(error) {
                expect(error).toEqual('');
            });
    });

});
