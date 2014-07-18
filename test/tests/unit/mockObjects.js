//================================================
// Packetbuilders for testing API classes
//================================================
var TestPacketContext=ozpIwc.util.extend(ozpIwc.TransportPacketContext, function() {
    ozpIwc.TransportPacketContext.apply(this,arguments);
    var self=this;
    this.responses=[];
    this.router= {
        send: function(packet) {
            self.responses.push(packet);
        }
    };
});

//================================================
// Packetbuilders for testing API classes
//================================================
var watchPacket=function(node,src,msgId) {
    return new TestPacketContext({
        'packet': {
            'src': src,
            'resource' : node,
            'msgId' : msgId
        }
    });
};
//================================================
// Time-advancement for IWC objects that use time
//================================================

var clockOffset=0;

var tick=function(t) { 
	clockOffset+=t;
	try {
		jasmine.clock().tick(t);
	} catch (e) {
		// do nothing
	}
};

// mock out the now function to let us fast forward time
ozpIwc.util.now=function() {
	return new Date().getTime() + clockOffset;
};


//========================================================
// Fake peer that just stores the packets that it receives
//========================================================
var FakePeer=function() {
	this.events=new ozpIwc.Event();
		
	this.events.mixinOnOff(this);
		
	this.packets=[];
	this.send=function(packet) {
		this.packets.push(packet);
	};
};

//========================================================
// TestParticipant for connecting to a router
//========================================================
var TestParticipant=ozpIwc.util.extend(ozpIwc.InternalParticipant,function(config) {
    ozpIwc.InternalParticipant.apply(this,arguments);
    config=config || {};
    this.origin=config.origin || "foo.com";
	this.packets=[];
    this.sentPackets=[];

    var self=this;

    this.router={
        'send' : function() {}
    };

    this.receiveFromRouter=function(packet){
		this.packets.push(packet); 
		return ozpIwc.InternalParticipant.prototype.receiveFromRouter.call(this,packet);
	};

	this.send=function(packet,callback) {
        packet=ozpIwc.InternalParticipant.prototype.send.call(this,packet,callback);
        this.sentPackets.push(packet);
    	return packet;
	};
	
	this.reply=function(originalPacket,packet,callback) {
		packet.ver=packet.ver || originalPacket.ver || 1;
		packet.src=packet.src || originalPacket.dst || this.address;
		packet.dst=packet.dst || originalPacket.src || config.dst;
		packet.msgId= packet.msgId || this.messageId++;
		packet.time=packet.time || new Date().getTime();
		
		packet.replyTo=originalPacket.msgId;

		packet.action=packet.action || originalPacket.action;
		packet.resource=packet.resource || originalPacket.resource;

        this.sentPackets.push(packet);

        if(callback) {
			this.callbacks[packet.msgId]=callback;
		}
        if(this.router) {
            this.router.send(packet,this);
        }
        return packet;	
	};
});