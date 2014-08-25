var ozpIwc=ozpIwc || {};

/**
 * @class
 * @mixes ozpIwc.security.Actor
 * @property {string} address - The assigned address to this address.
 * @property {ozpIwc.security.Subject} securityAttributes - The security attributes for this participant.
 */
ozpIwc.Participant=function() {
    this.events=new ozpIwc.Event();
	this.events.mixinOnOff(this);
	this.securityAttributes={};
    this.msgId=0;
    var fakeMeter=new ozpIwc.metricTypes.Meter();
    this.sentPacketsMeter=fakeMeter;
    this.receivedPacketsMeter=fakeMeter;
    this.forbiddenPacketsMeter=fakeMeter;
    
    this.participantType=this.constructor.name;
    this.heartBeatContentType="application/ozpIwc-address-v1+json";
    this.heartBeatStatus={
        name: this.name,
        type: this.participantType || this.constructor.name
    };
};

/**
 * @param {ozpIwc.PacketContext} packetContext
 * @returns {boolean} true if this packet could have additional recipients
 */
ozpIwc.Participant.prototype.receiveFromRouter=function(packetContext) {
    var self = this;
    ozpIwc.authorization.isPermitted({
        'subject': this.securityAttributes,
        'object': packetContext.packet.permissions
    })
        .success(function(){
            self.receivedPacketsMeter.mark();

            self.receiveFromRouterImpl(packetContext);
        })
        .failure(function() {
            /** @todo do we send a "denied" message to the destination?  drop?  who knows? */
            self.forbiddenPacketsMeter.mark();
        });
};

/**
 * Overridden by inherited Participants.
 * @override
 * @param packetContext
 * @returns {boolean}
 */
ozpIwc.Participant.prototype.receiveFromRouterImpl = function (packetContext) {
    // doesn't really do anything other than return a bool and prevent "unused param" warnings
    return !packetContext;
};
/**
 * @param {ozpIwc.Router} router
 * @param {string} address
 * @returns {boolean} true if this packet could have additional recipients
 */
ozpIwc.Participant.prototype.connectToRouter=function(router,address) {
    this.address=address;
    this.router=router;
    this.securityAttributes.rawAddress=address;
    this.msgId=0;
    this.metricRoot="participants."+ this.address.split(".").reverse().join(".");
    this.sentPacketsMeter=ozpIwc.metrics.meter(this.metricRoot,"sentPackets").unit("packets");
    this.receivedPacketsMeter=ozpIwc.metrics.meter(this.metricRoot,"receivedPackets").unit("packets");
    this.forbiddenPacketsMeter=ozpIwc.metrics.meter(this.metricRoot,"forbiddenPackets").unit("packets");
    
    this.namesResource="/address/"+this.address;
    this.heartBeatStatus.address=this.address;
    this.heartBeatStatus.name=this.name;
    this.heartBeatStatus.type=this.participantType || this.constructor.name;

    this.events.trigger("connectedToRouter");
};

/**
 * Populates fields relevant to this packet if they aren't already set:
 * src, ver, msgId, and time.
 * @param {ozpIwc.TransportPacket} packet
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.Participant.prototype.fixPacket=function(packet) {
    // clean up the packet a bit on behalf of the sender
    packet.src=packet.src || this.address;
    packet.ver = packet.ver || 1;

    // if the packet doesn't have a msgId, generate one
    packet.msgId = packet.msgId || this.generateMsgId();

    // might as well be helpful and set the time, too
    packet.time = packet.time || ozpIwc.util.now();
    return packet;
};

/**
 * Sends a packet to this participants router.  Calls fixPacket
 * before doing so.
 * @param {ozpIwc.TransportPacket} packet
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.Participant.prototype.send=function(packet) {
    packet=this.fixPacket(packet);
    this.sentPacketsMeter.mark();
    this.router.send(packet,this);
    return packet;
};


ozpIwc.Participant.prototype.generateMsgId=function() {
    return "i:" + this.msgId++;
};

ozpIwc.Participant.prototype.heartbeat=function() {
    if(this.router) {
        this.send({
            'dst': "names.api",
            'resource': this.namesResource,
            'action' : "set",
            'entity' : this.heartBeatStatus,
            'contentType' : this.heartBeatContentType
        },function() {/* eat the response*/});
    }
};