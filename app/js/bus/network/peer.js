var ozpIwc=ozpIwc || {};

/**
 * @typedef ozpIwc.NetworkPacket
 * @property {string} src_peer - The id of the peer who broadcast this packet.
 * @property {string} sequence - A monotonically increasing, unique identifier for this packet.
 * @property {object} data - The payload of this packet.
 */

/**
 * @event ozpIwc.Peer#receive
 * The peer has received a packet from other peers.
 * @property {ozpIwc.NetworkPacket} packet
 * @property {string} linkId
 */


/**
 * @event ozpIwc.Peer#preSend
 * A cancelable event that allows listeners to override the forwarding of
 * a given packet to other peers.
 * @extends ozpIwc.CancelableEvent
 * @property {ozpIwc.NetworkPacket} packet
 */

/**
 * @event ozpIwc.Peer#send
 * Notifies that a packet is being sent to other peers.  Links should use this
 * event to forward packets to other peers.
 * @property {ozpIwc.NetworkPacket} packet
 */

/**
 * @event ozpIwc.Peer#beforeShutdown
 * Fires when the peer is being explicitly or implicitly shut down.
 */

/**
 * The peer handles low-level broadcast communications between multiple browser contexts.
 * Links do the actual work of moving the packet to other browser contexts.  The links
 * call @{link ozpIwc.Peer#receive} when they need to deliver a packet to this peer and hook
 * the @{link event:ozpIwc.Peer#send} event in order to send packets.
 * @class
 */
ozpIwc.Peer=function() {

    // generate a random 4 byte id
    this.selfId=ozpIwc.util.generateId();

    // unique ids for all packets sent by this peer
    this.sequenceCounter=0;

    // track which packets are seen from each peer
    // key is the name of the peer
    // value is an array that contains the last 50 ids seen
    this.packetsSeen={};

    this.knownPeers={};

    this.events=new ozpIwc.Event();
    this.events.mixinOnOff(this);

    var self=this;

    // Shutdown handling
    this.unloadListener=function() {
        self.shutdown();
    };
    window.addEventListener('beforeunload',this.unloadListener);

};

ozpIwc.Peer.maxSeqIdPerSource=500;

/**
 * Helper to determine if we've seen this packet before
 * @param {ozpIwc.NetworkPacket} packet
 * @returns {boolean}
 */
ozpIwc.Peer.prototype.haveSeen=function(packet) {
    // don't forward our own packets
    if (packet.src_peer === this.selfId) {
        ozpIwc.metrics.counter('network.packets.droppedOwnPacket').inc();
        return true;
    }
    var seen = this.packetsSeen[packet.src_peer];
    if (!seen) {
        seen = this.packetsSeen[packet.src_peer] = [];
    }

    // abort if we've seen the packet before
    if (seen.indexOf(packet.sequence) >= 0) {
        return true;
    }

    //remove oldest array members when truncate needed
    seen.unshift(packet.sequence);
    if (seen.length >= ozpIwc.Peer.maxSeqIdPerSource) {
        seen.length = ozpIwc.Peer.maxSeqIdPerSource;
    }
    return false;
};

/**
 * Used by routers to broadcast a packet to network
 * @fires ozpIwc.Peer#preSend
 * @fires ozpIwc.Peer#send
 * @param {ozpIwc.NetworkPacket} packet
 */
ozpIwc.Peer.prototype.send= function(packet) {
    var networkPacket={
        src_peer: this.selfId,
        sequence: this.sequenceCounter++,
        data: packet
    };

    var preSendEvent=new ozpIwc.CancelableEvent({'packet': networkPacket});

    this.events.trigger("preSend",preSendEvent);
    if(!preSendEvent.canceled) {
        ozpIwc.metrics.counter('network.packets.sent').inc();
        console.log("triggering 'send' event for Peer with ID " + this.selfId + " resource: " + networkPacket.data.resource);
        this.events.trigger("send",{'packet':networkPacket});
    } else {
        ozpIwc.metrics.counter('network.packets.sendRejected').inc();
    }
};

/**
 * Called by the links when a new packet is recieved.
 * @fires ozpIwc.Peer#receive
 * @param {string} linkId
 * @param {ozpIwc.NetworkPacket} packet
 * @returns {unresolved}
 */
ozpIwc.Peer.prototype.receive=function(linkId,packet) {
    // drop it if we've seen it before
    if(this.haveSeen(packet)) {
        ozpIwc.metrics.counter('network.packets.dropped').inc();
        return;
    }
    ozpIwc.metrics.counter('network.packets.received').inc();
    this.events.trigger("receive",{'packet':packet,'linkId': linkId});
};

/**
 * Explicitly shuts down the peer.
 * @fires ozpIwc.Peer#send
 */
ozpIwc.Peer.prototype.shutdown=function() {
    this.events.trigger("beforeShutdown");
    window.removeEventListener('beforeunload',this.unloadListener);
};

			