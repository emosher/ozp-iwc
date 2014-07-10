
ozpIwc.InternalParticipant=ozpIwc.util.extend(ozpIwc.Participant,function(config) {
    config=config || {};
	ozpIwc.Participant.apply(this,arguments);
	this.replyCallbacks={};
	this.participantType="internal";
	this.name=config.name;

    var self = this;
    ozpIwc.metrics.gauge('transport.internal.participants').set(function() {
        return {'callbacks':  self.getCallbackCount()};
    });
});

/**
 * Gets the count of the registered reply callbacks
 * @returns {number} the number of registered callbacks
 */
ozpIwc.InternalParticipant.prototype.getCallbackCount=function() {
    if (!this.replyCallbacks | !Object.keys(this.replyCallbacks)) {
        return 0;
    }
    return Object.keys(this.replyCallbacks).length;
};

/**
 * @param {ozpIwc.PacketContext} packetContext
 * @returns {boolean} true if this packet could have additional recipients
 */
ozpIwc.InternalParticipant.prototype.receiveFromRouter=function(packetContext) { 
	var packet=packetContext.packet;
	if(packet.replyTo && this.replyCallbacks[packet.replyTo]) {
		if (!this.replyCallbacks[packet.replyTo](packet)) {
            this.cancelCallback(msgId);
        }
	} else {
		this.events.trigger("receive",packet);
	}
};


ozpIwc.InternalParticipant.prototype.send=function(packet,callback) {
	var packet=this.fixPacket(packet);
	if(callback) {
		this.replyCallbacks[packet.msgId]=callback;
	}
	ozpIwc.Participant.prototype.send.apply(this,arguments);

	return packet;
};

ozpIwc.InternalParticipant.prototype.cancelCallback=function(msgId) {
    var success=false;
    if (msgId) {
        delete this.replyCallbacks[msgId];
        success=true;
    }
    return success;
};
