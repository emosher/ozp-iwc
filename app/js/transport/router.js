
var sibilant=sibilant || {};

/**
 * @typedef sibilant.TransportPacket
 * @property {string} src - The participant address that sent this packet
 * @property {string} dst - The intended recipient of this packet
 * @property {Number} ver - Protocol Version.  Should be 1
 * @property {Number} msg_id - A unique id for this packet.
 * @property {object} entity - The payload of this packet.
 * @property {Number} [time] - The time in milliseconds since epoch that this packet was created.
 * @property {Number} [reply_to] - Reference to the msg_id that this is in reply to.
 */

/**
 * @typedef sibilant.Participant
 * @property origin - The origin of this participant, confirmed via trusted sources.
 * @function send - A callback to send a message to this participant.  Will be called with participant as "this".
 */

/**
 * @event sibilant.Router#preRegisterParticipant
 * @mixes sibilant.CancelableEvent
 * @property {sibilant.TransportPacket} [packet] - The packet to be delivered
 * @property {object} registration - Information provided by the participant about it's registration
 * @property {sibilant.Participant} participant - The participant that will receive the packet

 */

/**
 * @event sibilant.Router#preSend
 * @mixes sibilant.CancelableEvent
 * @property {sibilant.TransportPacket} packet - The packet to be sent
 * @property {sibilant.Participant} participant - The participant that sent the packet
 */

/**
 * @event sibilant.Router#preDeliver
 * @mixes sibilant.CancelableEvent
 * @property {sibilant.TransportPacket} packet - The packet to be delivered
 * @property {sibilant.Participant} participant - The participant that will receive the packet
 */

/**
 * @event sibilant.Router#send
 * @property {sibilant.TransportPacket} packet - The packet to be delivered
 */

/**
 * @event sibilant.Router#prePeerReceive
 * @mixes sibilant.CancelableEvent
 * @property {sibilant.TransportPacket} packet
 * @property {sibilant.NetworkPacket} rawPacket
 */

/**
 * @class
 * @param {object} [config]
 * @param {sibilant.Peer} [config.peer=sibilant.defaultPeer]
 * @param {boolean} [config.forwardAll=false]
 */
sibilant.Router=function(config) {
	config=config || {};
	this.peer=config.peer || sibilant.defaultPeer;
	this.forwardAll=config.forwardAll || false;

	this.nobodyAddress="$nobody";
	this.routerControlAddress='$transport';
	
	var self=this;	
	
	// Stores all local addresses
	this.participants={};
	
	sibilant.metrics.gauge("transport.participants").set(function() {
		return Object.keys(self.participants).length;
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
		if(!message.entity) {
			event.cancel("nullEntity");
		}
		
		if(event.canceled) {
			sibilant.metrics.counter("transport.packets.invalidFormat").inc();
		}
	};
	
	var checkSenderOrigin=function(event) {
		// TODO: allow nobodyAddress to talk to control addresses
		var knownParticipant=self.participants[event.packet.src];
		if(knownParticipant && knownParticipant.origin !== event.participant.origin) {
			event.cancel("senderOriginMismatch");
			sibilant.metrics.counter("transport.packets.invalidSenderOrigin").inc();
		}
	};
	
	var events=new sibilant.Event();
	events.mixinOnOff(this);
	events.on("preSend",checkFormat);
	events.on("preSend",checkSenderOrigin);

	this.self_id=sibilant.util.generateId();
	
	this.createMessage=function(fields) {
		var now=new Date().getTime();
		fields.ver = fields.ver || 1;
		fields.time = fields.time || now;
		// TODO: track the last used timestamp and make sure we don't send a duplicate messageId
		// default the msg_id to the current timestamp
		fields.msg_id = fields.msg_id || now;
		return fields;
	};
	this.createReply=function(message,fields) {
		fields=this.createMessage(fields);
		fields.reply_to=message.msg_id;
		fields.src=fields.src || message.dst;
		fields.dst=fields.dst || message.src;
		return fields;
	};
	/**
	 * Allows a listener to add a new participant.  
	 * @fires sibilant.Router#registerParticipant
	 * @param {object} packet The handshake requesting registration.
	 * @param {object} participant the participant object that contains a send() function.
	 * @returns {string} returns participant id
	 */
	this.registerParticipant=function(packet,participant) {
		var participant_id;
		do {
				participant_id=sibilant.util.generateId() + "." + this.self_id;
		} while(this.participants.hasOwnProperty(participant_id));
		
		var registerEvent=new sibilant.CancelableEvent({
			'packet': packet,
			'registration': packet.entity,
			'participant': participant
		});
		events.trigger("preRegisterParticipant",registerEvent);

		if(registerEvent.canceled)
		{
			// someone vetoed this participant
			sibilant.log.log("registeredParticipant[DENIED] origin:"+participant.origin+ 
							" because " + registerEvent.cancelReason);
			return null;
		}
		this.participants[participant_id]=participant;
		sibilant.log.log("registeredParticipant["+participant_id+"] origin:"+participant.origin);
		return participant_id;
	};
	
	/**
	 * @fires sibilant.Router#preSend
	 * @param {sibilant.TransportPacket} packet
	 * @return {boolean} True if the message was delivered locally
	 */
	this.deliverLocal=function(packet) {
		// check if the recipient is local.  If so, don't bother broadcasting.
		var localParticipant=this.participants[packet.dst];
		if(localParticipant) {
			var preDeliverEvent=new sibilant.CancelableEvent({
				'packet': packet,
				'dstParticipant': localParticipant,
			});
			events.trigger("preDeliver",preDeliverEvent);
			if(preDeliverEvent.canceled) {
				sibilant.metrics.counter("transport.packets.rejected").inc();
				return false;
			}
			sibilant.metrics.counter("transport.packets.delivered").inc();
			localParticipant.send(packet,localParticipant);
			return true;
		}
		return false;
	};
	
	/**
	 * Used by participant listeners to route a message to other participants.
	 * @fires sibilant.Router#preSend
 	 * @fires sibilant.Router#send
 	 * @param {object} packet The packet to route.
	 * @param {object} participant Information about the participant that is attempting to send
	 *   the packet.
	 * @returns {undefined}
	 */
	this.send=function(packet,participant) {
		// if this is the handshake, register the participant
		// TODO: if the participant sends 10 handshakes, it'll get ten different registrations.
		// TODO: break this out of send and make it a named participant
		if(packet.dst === this.routerControlAddress && packet.src===this.nobodyAddress) {
			var participantId=this.registerParticipant(packet,participant);
			var reply;
			if(participantId === null) {
				reply=this.createReply(packet,
					{	dst: this.nobodyAddress,	entity: { status: "denied" } });
			} else {
				reply=this.createReply(packet,
					{dst: participantId,	entity: { status: "ok"}	});
			}
			participant.send(reply);
			return;
		}
		
		var preSendEvent=new sibilant.CancelableEvent({
			'packet': packet,
			'participant': participant,
		});
		events.trigger("preSend",preSendEvent);

		if(preSendEvent.canceled) {
			sibilant.metrics.counter("transport.packets.sendCanceled");
			return
		} 
		sibilant.metrics.counter("transport.packets.sent").inc();
		if(!this.deliverLocal(packet,participant) || this.forwardAll) {
			sibilant.metrics.counter("transport.packets.sentToPeer").inc();
			events.trigger("send",{'packet': packet});
			this.peer.send(packet);
		}
	};
		
	/**
	 * Recieve a packet from the peer
	 * @fires sibilant.Router#peerReceive
	 * @param packet {object} the packet to receive
	 */
	this.receiveFromPeer=function(packet) {
		sibilant.metrics.counter("transport.packets.receivedFromPeer").inc();
		var peerReceiveEvent=new sibilant.CancelableEvent({
			'packet' : packet.data,
			'rawPacket' : packet
		});
		events.trigger("prePeerReceive",peerReceiveEvent);
			
		if(!peerReceiveEvent.canceled){
			this.deliverLocal(packet.data);
		}
	};

	// Wire up to the peer
	this.peer.on("receive",function(event) {
		self.receiveFromPeer(event.packet);
	});
		
	// PostMessage listener is so fundamental, there's no point
	// in breaking it out.
	var sendPostMessage=function(message) {
		if(!message) { throw "CANNOT SEND NULL"; }
		this.sourceWindow.postMessage(message,this.origin);
	};
	
	// Listen for the post messages, treat them as participants
	// sending packets.  The origin check is done within the send itself.
	window.addEventListener("message", function(event) {
		self.send(event.data,{
			origin: event.origin,
			sourceWindow: event.source,
			send: sendPostMessage
		});
	}, false);
};

//TODO: move autocreation elsewhere
sibilant.defaultRouter=new sibilant.Router();