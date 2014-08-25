describe("KeyBroadcastLocalStorageLink", function () {
    var peer;
    var link;
    var event;

    var dataGenerator = function (size) {
        var result = "";
        var chars = "abcdefghijklmnopqrstuvwxyz";
        for (var i = 0; i < size; i++) {
            result += chars.substr(Math.floor(Math.random() * 26), 1);
        }
        return result;
    };

    var transportPacketGenerator = function (entity) {
        return {
            msgId: ozpIwc.util.generateId(),
            entity: entity
        };
    };

    var networkPacketGenerator = function (transportPacket) {
        return {
            sequence: link.peer.sequenceCounter++,
            src_peer: ozpIwc.util.generateId(),
            data: transportPacket
        };
    };

    beforeEach(function () {
        clockOffset = 0;
        localStorage.clear();

        peer = new ozpIwc.Peer();
        link = new ozpIwc.KeyBroadcastLocalStorageLink({
            peer: peer,
            fragmentSize: 100,
            fragmentTimeout: 500
        });
    });

    afterEach(function () {
        jasmine.clock().uninstall();
        event = link = peer = null;
        clockOffset = 0;
    });

    describe("Sending", function () {
        it("fragments packets larger than fragmentSize", function (done) {
            var called = false;
            // random packet size <= 10 mb;
            var dataSize = 250;
            var expectedFragments = Math.ceil(dataSize / link.fragmentSize);

            var sentPacket = networkPacketGenerator(transportPacketGenerator(dataGenerator(dataSize)));

            // overriding the send implementation to test what gets sent out
            link.sendImpl = function (packet) {
                if (!called) {
                    called = true;
                    console.log(packet);
                    expect(packet.data.total).toEqual(expectedFragments);
                    done();
                }
            };

            link.send(sentPacket);
        });

        it("fragments data into chunks into packets smaller than fragmentSize", function (done) {
            var called = false;
            var dataSize = 150;
            var expectedFragments = Math.ceil(dataSize / link.fragmentSize);

            var fragments = [];
            var sentPacket = networkPacketGenerator(transportPacketGenerator(dataGenerator(dataSize)));

            link.sendImpl = function (packet) {
                var fragmentPacket = packet.data;
                expect(fragmentPacket.total).toEqual(expectedFragments);

                // Store off all packets from the msgId
                fragments[fragmentPacket.msgId] = fragments[fragmentPacket.msgId] || [];
                fragments[fragmentPacket.msgId][fragmentPacket.id] = fragmentPacket.chunk;

                // Once all packets received then test the defragmenting
                if (fragments[fragmentPacket.msgId].length == expectedFragments && !called) {
                    called = true;
                    for (var i = 0; i < fragmentPacket.total; i++) {
                        expect(fragmentPacket.chunk.length).not.toBeGreaterThan(this.fragmentSize);
                    }
                    done();
                }
            };

            link.send(sentPacket);
        });

        it("fragments data into JSON parsable chunks", function (done) {
            var called = false;
            var dataSize = 150;
            var expectedFragments = Math.ceil(dataSize / link.fragmentSize);

            var fragments = [];
            var deFragmented = '';
            var sentPacket = networkPacketGenerator(transportPacketGenerator(dataGenerator(dataSize)));

            var referencePacket = ozpIwc.util.clone(sentPacket);

            link.sendImpl = function (packet) {
                var fragmentPacket = packet.data;

                expect(fragmentPacket.total).toEqual(expectedFragments);

                fragments[fragmentPacket.msgId] = fragments[fragmentPacket.msgId] || [];
                fragments[fragmentPacket.msgId][fragmentPacket.id] = fragmentPacket.chunk;

                if (fragments[fragmentPacket.msgId].length == expectedFragments && !called) {
                    called = true;
                    for (var i = 0; i < fragmentPacket.total; i++) {
                        deFragmented += fragments[fragmentPacket.msgId][i]
                    }
                    expect(JSON.parse(fragments[fragmentPacket.msgId].join(''))).toEqual(referencePacket.data);
                    done();
                }
            };

            link.send(sentPacket);
        });

    });
    describe("Receiving", function () {
        it("handles fragment receiving", function (done) {
            var called = false;
            var dataSize = 150;
            var sentPacket = networkPacketGenerator(transportPacketGenerator(dataGenerator(dataSize)));
            var referencePacket = ozpIwc.util.clone(sentPacket);

            link.peer.receive = function (linkId, packet) {
                if (!called) {
                    called = true;
                    expect(packet.data).toEqual(referencePacket.data);
                    done();
                }
            };

            //Route the packet directly to the receive (for unit test purpose)
            link.sendImpl = function (packet) {
                console.log(packet.sequence);
                link.handleFragment(packet);
            };

            link.send(sentPacket);
        });
        it("drops fragments if all aren't received within fragmentTimeout", function () {

            var fragmentPacket = {
                fragment: true,
                total: 2,
                id: 0,
                msgId: ozpIwc.util.generateId(),
                chunk: dataGenerator(10)
            };
            var networkPacket = networkPacketGenerator(fragmentPacket);

            var fragmentIndex = fragmentPacket.msgId;

            var droppedPacketCount = ozpIwc.metrics.counter('network.packets.dropped').value;
            var droppedFragmentCount = ozpIwc.metrics.counter('network.fragments.dropped').value;
            console.log(droppedFragmentCount);

            link.handleFragment(networkPacket);
            var expectedFragments = link.fragments[fragmentIndex].total;
            expect(link.fragments[fragmentIndex].chunks.length).toEqual(1);

            jasmine.clock().tick(1000);

            expect(link.fragments[fragmentIndex]).toBeUndefined();

            expect(ozpIwc.metrics.counter('network.packets.dropped').value).toEqual(droppedPacketCount + 1);
            expect(ozpIwc.metrics.counter('network.fragments.dropped').value).toEqual(droppedFragmentCount + expectedFragments);
            console.log(ozpIwc.metrics.counter('network.packets.dropped').value);
        });

        it("converts fragments back into a TransportPacket", function() {
            var msgId = ozpIwc.util.generateId();
            var src_peer = ozpIwc.util.generateId();
            var fragmentPacket1 = {
                fragment: true,
                total: 2,
                id: 0,
                msgId: msgId,
                chunk: "{foo:"
            };
            var fragmentPacket2 = {
                fragment: true,
                total: 2,
                id: 1,
                msgId: msgId,
                chunk: "true}"
            };
            var networkPacket1 = networkPacketGenerator(fragmentPacket1);
            networkPacket1.src_peer = src_peer;
            var networkPacket2 = networkPacketGenerator(fragmentPacket2);
            networkPacket2.src_peer = src_peer;

            // override link.peer.receive to check output
            link.peer.receive = function (linkId, networkPacket) {
                expect(networkPacket.sequence).toEqual(fragmentPacket2.sequence);
                expect(networkPacket.src_peer).toEqual(fragmentPacket2.src_peer);
                expect(networkPacket.data).toEqual({foo: true});
            };
            link.handleFragment(networkPacket1);
            link.handleFragment(networkPacket2);
        })
    });
});
