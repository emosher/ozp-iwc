var ozpIwc=ozpIwc || {};




/**
 * @class
 * @extends ozpIwc.Participant
 * @param {string} name
 */
ozpIwc.MulticastParticipant=ozpIwc.util.extend(ozpIwc.Participant,function(name) {
	this.name=name;
	this.participantType="multicast";

    ozpIwc.Participant.apply(this,arguments);
	this.members=[];
    
    this.namesResource="/multicast/"+this.name;
    
    this.heartBeatContentType="application/ozpIwc-multicast-address-v1+json";
    this.heartBeatStatus.members=[];
    this.on("connectedToRouter",function() {
        this.namesResource="/multicast/" + this.name;
    },this);
});

/**
 * Receives a packet on behalf of the multicast group.
 * @param {ozpIwc.TransportPacket} packet
 * @returns {Boolean}
 */
ozpIwc.MulticastParticipant.prototype.receiveFromRouterImpl=function(packet) {
	this.members.forEach(function(m) {
        // as we send to each member, update the context to make it believe that it's the only recipient
        packet.dstParticipant=m;
        m.receiveFromRouter(packet);
    });
	return false;
};

/**
 * 
 * @param {ozpIwc.Participant} participant
 */
ozpIwc.MulticastParticipant.prototype.addMember=function(participant) {
	this.members.push(participant);
    this.heartBeatStatus.members.push(participant.address);
};