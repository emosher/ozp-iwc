
ozpIwc.InternalParticipant=ozpIwc.util.extend(ozpIwc.Participant,function(config) {
    config=config || {};
	ozpIwc.Participant.apply(this,arguments);
	this.replyCallbacks={};
	this.participantType="internal";
	this.name=config.name;

    var self = this;
    this.on("connectedToRouter",function() {
        ozpIwc.metrics.gauge(self.metricRoot,"registeredCallbacks").set(function() {
            return self.getCallbackCount();
        });
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
ozpIwc.InternalParticipant.prototype.receiveFromRouterImpl=function(packetContext) {
	var packet=packetContext.packet;
	if(packet.replyTo && this.replyCallbacks[packet.replyTo]) {
		if (!this.replyCallbacks[packet.replyTo](packet)) {
            this.cancelCallback(packet.replyTo);
        }
	} else {
		this.events.trigger("receive",packetContext);
	}
};


ozpIwc.InternalParticipant.prototype.send=function(originalPacket,callback) {
    var packet=this.fixPacket(originalPacket);
	if(callback) {
		this.replyCallbacks[packet.msgId]=callback;
	}
    var self=this;
	ozpIwc.util.setImmediate(function() {
        ozpIwc.Participant.prototype.send.call(self,packet);
    });

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
