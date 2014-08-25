//========================================================
// Fake peer that just stores the packets that it receives
//========================================================
var FakePeer = function() {
    this.events = new ozpIwc.Event();

    this.events.mixinOnOff(this);

    this.packets = [];
    this.send = function(packet) {
        this.packets.push(packet);
    };
};

//========================================================
// TestParticipant for connecting to a router
//========================================================
var TestParticipant = ozpIwc.util.extend(ozpIwc.InternalParticipant, function(config) {
    ozpIwc.InternalParticipant.apply(this, arguments);
    config = config || {};
    this.origin = config.origin || "foo.com";
    this.packets = [];
    this.sentPackets = [];
    // since we aren't connecting to a router, mock these out, too
    this.metricRoot = "testparticipant";
    this.sentPacketsMeter = ozpIwc.metrics.meter(this.metricRoot, "sentPackets");
    this.receivedPacketsMeter = ozpIwc.metrics.meter(this.metricRoot, "receivedPackets");
    this.forbiddenPacketsMeter = ozpIwc.metrics.meter(this.metricRoot, "forbiddenPackets");

    var self = this;

    this.router = {
        'send': function() {
        }
    };

    this.receiveFromRouter = function(packet) {
        this.packets.push(packet);
        return ozpIwc.InternalParticipant.prototype.receiveFromRouter.call(this, packet);
    };

    this.send = function(packet, callback) {
        packet = ozpIwc.InternalParticipant.prototype.send.call(this, packet, callback);
        this.sentPackets.push(packet);
        // tick to trigger the async send
        tick(0);
        return packet;
    };

    this.reply = function(originalPacket, packet, callback) {
        packet.ver = packet.ver || originalPacket.ver || 1;
        packet.src = packet.src || originalPacket.dst || this.address;
        packet.dst = packet.dst || originalPacket.src || config.dst;
        packet.msgId = packet.msgId || this.messageId++;
        packet.time = packet.time || new Date().getTime();

        packet.replyTo = originalPacket.msgId;

        packet.action = packet.action || originalPacket.action;
        packet.resource = packet.resource || originalPacket.resource;

        this.sentPackets.push(packet);

        if (callback) {
            this.callbacks[packet.msgId] = callback;
        }
        if (this.router) {
            this.router.send(packet, this);
        }
        return packet;
    };
});

var FakePeer = function() {
    this.events = new ozpIwc.Event();

    this.events.mixinOnOff(this);

    this.packets = [];
    this.send = function(packet) {
        this.packets.push(packet);
    };
};

//================================================
// Packetbuilders for testing API classes
//================================================
var TestPacketContext = ozpIwc.util.extend(ozpIwc.TransportPacketContext, function() {
    ozpIwc.TransportPacketContext.apply(this, arguments);
    var self = this;
    this.responses = [];
    this.router = {
        send: function(packet) {
            self.responses.push(packet);
        }
    };
});

var FakeRouter = function() {
    this.jitter = 0;
    this.packetQueue=[];
    this.participants=[];
    this.send = function(packet) {
//        				console.log("Sending(" + packet.src + "): ",packet);

        if (this.packetQueue.length === 0 || Math.random() > this.jitter) {
            this.packetQueue.push(packet);
        } else {
//				console.log("JITTER!");
            this.packetQueue.splice(-1, 0, packet);
        }

    };
    this.registerParticipant = function(p) {
        p.connectToRouter(this, (this.participants.length + 1) + ".fake");
        this.participants.push(p);
    };
    this.pump = function() {
        var processed = 0;
        while (this.packetQueue.length) {
            processed++;
            var packet = this.packetQueue.shift();
				console.log("PACKET(" + packet.src + "): ",packet);
            this.participants.forEach(function(l) {
                if (l.address !== packet.src) {
                    l.receiveFromRouter(new TestPacketContext({'packet': packet}));
                }
            });
        }
        return processed;
    };
    this.createMessage = function(m) {
        return m;
    };
    this.registerMulticast = function() {
    };
};