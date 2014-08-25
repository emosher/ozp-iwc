
describe("IWC Client", function() {
    var client;
    var participant;

    var pinger = function(remoteClient, testAddress) {
        var sendTick = function() {
            remoteClient.send({
                dst: testAddress,
                entity: {'tick': ozpIwc.util.now()}
            });
            window.setTimeout(sendTick, 10);
        };
        sendTick();
    };

    var latency = function(packet) {
        return ozpIwc.util.now() - packet.time;
    };

    afterEach(function() {
        if (client) {
            client.disconnect();
        }
        if (participant) {
            participant.close();
        }
    });

    it("Can be used before the connection is fully established", function(done) {
        client = new ozpIwc.Client({
            'peerUrl': "http://localhost:14002"
        });
        
        var gate = done_semaphore(2, done);
        console.log("In test");
        client.send({
            'dst': "data.api",
            'action': "get",
            'resource': ""
        },function(response) {
            console.log("Got reply",response);
            gate();
        });
        
        client.on("connected",gate);
        
        
    });

    describe("", function() {

        beforeEach(function(done) {
            client = new ozpIwc.Client({
                'peerUrl': "http://localhost:14002"
            });
            participant = new ozpIwc.test.MockParticipant({
                'clientUrl': "http://localhost:14001",
                'client': client
            });

            var gate = done_semaphore(2, done);

            participant.on("connected", gate);
            client.on("connected", gate);
        });


        it("has an address", function() {
            expect(client.address).not.toBe("$nobody");
        });

        it("hears the ping", function(done) {
            participant.run(pinger);

            // current version of jasmine breaks if done() is called multiple times
            // use the called flag to prevent this
            var called = false;
            client.on("receive", function(packet) {
                if (packet.entity.tick && !called) {
                    done();
                    called = true;
                }
            });
        });


        it("gets pings in order", function(done) {
            participant.run(pinger);

            // current version of jasmine breaks if done() is called multiple times
            // use the called flag to prevent this
            var callCount = 10;
            var lastPing = 0;

            client.on("receive", function(packet) {
                if (packet.entity.tick) {
                    expect(packet.entity.tick).toBeGreaterThan(lastPing);
                    lastPing = packet.entity.tick;
                    if (callCount-- === 0) {
                        done();
                    }
                }
            });

        });

        it('sends 15mb packets', function(done) {
            client.on("receive", function(packet) {
                if (packet.entity.bulkyData) {
                    expect(packet.entity.bulkyData.length).toEqual(19131876);
                    done();
                }
            });


            participant.run(function(remoteClient, testAddress) {
                var result = "0123456789abcdefghijklmnopqrstuvwxyz";

                // quickly creates result.length * 3^12 characters of data
                for (var i = 0; i < 12; i++) {
                    result += result + result;
                }
                console.log("Sending data of size ", result.length);
                remoteClient.send({
                    dst: testAddress,
                    entity: {
                        'bulkyData': result
                    }
                });
            });
        });
    });
});
