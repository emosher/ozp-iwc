var ozpIwc=ozpIwc || {};

/**
 * @typedef ozpIwc.TransportPacket
 * @property {string} src - The participant address that sent this packet
 * @property {string} dst - The intended recipient of this packet
 * @property {Number} ver - Protocol Version.  Should be 1
 * @property {Number} msgId - A unique id for this packet.
 * @property {object} entity - The payload of this packet.
 * @property {object} [permissions] - Permissions required to see the payload of this packet.
 * @property {Number} [time] - The time in milliseconds since epoch that this packet was created.
 * @property {Number} [replyTo] - Reference to the msgId that this is in reply to.
 * @property {string} [action] - Action to be performed.
 * @property {string} [resource] - Resource to perform the action upon.
 * @property {boolean} [test] - Marker for test packets.
 */

/**
 * @class 
 * @param {object} config
 * @param {ozpIwc.TransportPacket} config.packet
 * @param {ozpIwc.Router} config.router
 * @param {ozpIwc.Participant} [config.srcParticpant]
 * @param {ozpIwc.Participant} [config.dstParticpant]
 * @property {ozpIwc.TransportPacket} packet
 * @property {ozpIwc.Router} router
 * @property {ozpIwc.Participant} [srcParticpant]
 * @property {ozpIwc.Participant} [dstParticpant]
 */
ozpIwc.TransportPacketContext=function(config) {
	for(var i in config) {
		this[i]=config[i];
	}
};

/**
 * 
 * @param {ozpIwc.TransportPacket} response
 * @returns {ozpIwc.TransportPacket} the packet that was sent
 */
ozpIwc.TransportPacketContext.prototype.replyTo=function(response) {
	var now=new Date().getTime();
	response.ver = response.ver || 1;
	response.time = response.time || now;
	// TODO: track the last used timestamp and make sure we don't send a duplicate messageId
	// default the msgId to the current timestamp
	response.msgId = response.msgId || now;
	response.replyTo=response.replyTo || this.packet.msgId;
	response.src=response.src || this.packet.dst;
	response.dst=response.dst || this.packet.src;
	this.router.send(response);
	return response;
};

/**
 * @event ozpIwc.Router#preRegisterParticipant
 * @mixes ozpIwc.CancelableEvent
 * @property {ozpIwc.TransportPacket} [packet] - The packet to be delivered
 * @property {object} registration - Information provided by the participant about it's registration
 * @property {ozpIwc.Participant} participant - The participant that will receive the packet
 */

/**
 * @event ozpIwc.Router#preSend
 * @mixes ozpIwc.CancelableEvent
 * @property {ozpIwc.TransportPacket} packet - The packet to be sent
 * @property {ozpIwc.Participant} participant - The participant that sent the packet
 */

/**
 * @event ozpIwc.Router#preDeliver
 * @mixes ozpIwc.CancelableEvent
 * @property {ozpIwc.TransportPacket} packet - The packet to be delivered
 * @property {ozpIwc.Participant} participant - The participant that will receive the packet
 */

/**
 * @event ozpIwc.Router#send
 * @property {ozpIwc.TransportPacket} packet - The packet to be delivered
 */

/**
 * @event ozpIwc.Router#prePeerReceive
 * @mixes ozpIwc.CancelableEvent
 * @property {ozpIwc.TransportPacket} packet
 * @property {ozpIwc.NetworkPacket} rawPacket
 */
/**
 * @class
 */
ozpIwc.RouterWatchdog=ozpIwc.util.extend(ozpIwc.InternalParticipant,function(config) {
	ozpIwc.InternalParticipant.apply(this,arguments);
	
	this.participantType="routerWatchdog";
	this.on("connected",function() {
		this.name=this.router.selfId;
	},this);
	
	this.heartbeatFrequency=config.heartbeatFrequency || 10000;
	var self=this;
	
	this.timer=window.setInterval(function() {
		var heartbeat={
			dst: "names.api",
			action: "set",
			resource: "/router/" + self.router.selfId,
			entity: { participants: {} }
		};
		for(var k in self.router.participants) {
			heartbeat.entity.participants[k]=self.router.participants[k].heartbeatStatus();
		}
		self.send(heartbeat);
	},this.heartbeatFrequency);
});

ozpIwc.RouterWatchdog.prototype.connectToRouter=function(router,address) {
	ozpIwc.Participant.prototype.connectToRouter.apply(this,arguments);
	this.name=router.selfId;
};

ozpIwc.RouterWatchdog.prototype.shutdown=function() {
	window.clearInterval(this.timer);
};

/**
 * @class
 * @param {object} [config]
 * @param {ozpIwc.Peer} [config.peer=ozpIwc.defaultPeer]
 */
ozpIwc.Router=function(config) {
	config=config || {};
	this.peer=config.peer || ozpIwc.defaultPeer;

//	this.nobodyAddress="$nobody";
//	this.routerControlAddress='$transport';
	var self=this;	

	this.selfId=ozpIwc.util.generateId();
	
	// Stores all local addresses
	this.participants={};
	
	ozpIwc.metrics.gauge("iwc.router." + this.selfId + ".participants").set(function() {
		return Object.keys(self.participants).length;
	});

	this.events=new ozpIwc.Event();
	this.events.mixinOnOff(this);
	
	// Wire up to the peer
	this.peer.on("receive",function(event) {
		self.receiveFromPeer(event.packet);
	});
	
	var checkFormat=function(event) {
		var message=event.packet;
		if(message.ver !== 1) {
			event.cancel("badVersion");
		}
		if(!message.src) {
			event.cancel("nullSource");
		}
		if(!message.dst) {
			event.cancel("nullDestination");
		}
		if(event.canceled) {
			ozpIwc.metrics.counter("iwc.router." + this.selfId + ".packets.invalidFormat").inc();
		}
	};
	this.events.on("preSend",checkFormat);
	this.watchdog=new ozpIwc.RouterWatchdog({router: this});
	this.registerParticipant(this.watchdog);
};

ozpIwc.Router.prototype.shutdown=function() {
    this.watchdog.shutdown();
}

/**
 * Allows a listener to add a new participant.  
 * @fires ozpIwc.Router#registerParticipant
 * @param {object} participant the participant object that contains a send() function.
 * @param {object} packet The handshake requesting registration.
 * @returns {string} returns participant id
 */
ozpIwc.Router.prototype.registerParticipant=function(participant,packet) {
	packet = packet || {};
	var address;
	do {
			address=ozpIwc.util.generateId() + "." + this.selfId;
	} while(this.participants.hasOwnProperty(address));

	var registerEvent=new ozpIwc.CancelableEvent({
		'packet': packet,
		'registration': packet.entity,
		'participant': participant
	});
	this.events.trigger("preRegisterParticipant",registerEvent);

	if(registerEvent.canceled){
		// someone vetoed this participant
		ozpIwc.log.log("registeredParticipant[DENIED] origin:"+participant.origin+ 
						" because " + registerEvent.cancelReason);
		return null;
	}
        this.participants[address] = participant;
	participant.connectToRouter(this,address);
	
//	ozpIwc.log.log("registeredParticipant["+participant_id+"] origin:"+participant.origin);
	return address;
};

/**
 * @fires ozpIwc.Router#preSend
 * @param {ozpIwc.TransportPacket} packet
 * @param {ozpIwc.Participant} sendingParticipant
 */
ozpIwc.Router.prototype.deliverLocal=function(packet,sendingParticipant) {
	if(!packet) {
		throw "Cannot deliver a null packet!";
	}
	var localParticipant=this.participants[packet.dst];
	if(!localParticipant) {
		return;
	}
	var packetContext=new ozpIwc.TransportPacketContext({
		'packet':packet,
		'router': this,
		'srcParticipant': sendingParticipant,
		'dstParticipant': localParticipant
	});

	var preDeliverEvent=new ozpIwc.CancelableEvent({
		'packet': packet,
		'dstParticipant': localParticipant,
		'srcParticipant': sendingParticipant			
	});

	if(this.events.trigger("preDeliver",preDeliverEvent).canceled) {
		ozpIwc.metrics.counter("iwc.router." + this.selfId + ".packets.rejected").inc();
		return;
	}

	ozpIwc.authorization.isPermitted({
        'subject':localParticipant.securityAttributes,
        'object': packet.permissions,
        'action': {'action': 'receive'}
    })
		.success(function() {
			ozpIwc.metrics.counter("iwc.transport." + localParticipant.address + ".packets.delivered").inc();
			localParticipant.receiveFromRouter(packetContext);
		})
		.failure(function() {
			/** @todo do we send a "denied" message to the destination?  drop?  who knows? */
			ozpIwc.metrics.counter("iwc.transport." + localParticipant.address + ".packets.forbidden").inc();
		});
	
};


/**
 * Registers a participant for a multicast group
 * @param {ozpIwc.Participant} participant
 * @param {String[]} multicastGroups
 */
ozpIwc.Router.prototype.registerMulticast=function(participant,multicastGroups) {
	var self=this;
	multicastGroups.forEach(function(groupName) {
		var g=self.participants[groupName];
		if(!g) {
			g=self.participants[groupName]=new ozpIwc.MulticastParticipant(groupName);
		}
		g.addMember(participant);
	});
	return multicastGroups;
};

/**
 * Used by participant listeners to route a message to other participants.
 * @fires ozpIwc.Router#preSend
 * @fires ozpIwc.Router#send
 * @param {ozpIwc.TransportPacket} packet The packet to route.
 * @param {ozpIwc.Participant} sendingParticipant Information about the participant that is attempting to send
 *   the packet.
 * @returns {undefined}
 */
ozpIwc.Router.prototype.send=function(packet,sendingParticipant) {

	var preSendEvent=new ozpIwc.CancelableEvent({
		'packet': packet,
		'participant': sendingParticipant
	});
	this.events.trigger("preSend",preSendEvent);

	if(preSendEvent.canceled) {
		ozpIwc.metrics.counter("iwc.router." + this.selfId + ".packets.sendCanceled");
		return;
	} 
	ozpIwc.metrics.counter("iwc.router." + this.selfId + ".packets.sent").inc();
	this.deliverLocal(packet,sendingParticipant);
	this.events.trigger("send",{'packet': packet});
	this.peer.send(packet);
};

/**
 * Receive a packet from the peer
 * @fires ozpIwc.Router#peerReceive
 * @param packet {ozpIwc.TransportPacket} the packet to receive
 */
ozpIwc.Router.prototype.receiveFromPeer=function(packet) {
	ozpIwc.metrics.counter("iwc.router." + this.selfId + ".packets.receivedFromPeer").inc();
	var peerReceiveEvent=new ozpIwc.CancelableEvent({
		'packet' : packet.data,
		'rawPacket' : packet
	});
	this.events.trigger("prePeerReceive",peerReceiveEvent);

	if(!peerReceiveEvent.canceled){
		this.deliverLocal(packet.data);
	}
};

