var ozpIwc=ozpIwc || {};

/**
 * Baseclass for APIs that need leader election.  Uses the Bully algorithm for leader election.
 * @class
 * @param {object} config
 * @param {String} config.name 
 *        The name of this API.
 * @param {string} [config.electionAddress=config.name+".election"] 
 *        The multicast channel for running elections.  
 *        The leader will register to receive multicast on this channel.
 * @param {number} [config.priority=Math.Random] 
 *        How strongly this node feels it should be leader.
 * @param {function} [config.priorityLessThan] 
 *        Function that provides a strict total ordering on the priority.  Default is "<".
 * @param {number} [config.electionTimeout=250] 
 *        Number of milliseconds to wait before declaring victory on an election. 
 
 */
ozpIwc.LeaderGroupParticipant=ozpIwc.util.extend(ozpIwc.InternalParticipant,function(config) {
	ozpIwc.InternalParticipant.apply(this,arguments);

	if(!config.name) {
		throw "Config must contain a name value";
	}
	
	// Networking info
	this.name=config.name;
	
	this.electionAddress=config.electionAddress || (this.name + ".election");

	// Election times and how to score them
	this.priority = config.priority || ozpIwc.defaultLeaderPriority || -ozpIwc.util.now();
	this.priorityLessThan = config.priorityLessThan || function(l,r) { return l < r; };
	this.electionTimeout=config.electionTimeout || 250; // quarter second
	this.leaderState="connecting";
	this.electionQueue=[];
	
	// tracking the current leader
	this.leader=null;
	this.leaderPriority=null;

	this.participantType="leaderGroup";
	this.name=config.name;
	
	this.on("startElection",function() {
			this.electionQueue=[];
	},this);
	
	this.on("becameLeader",function() {
		this.electionQueue.forEach(function(p) {
			this.forwardToTarget(p);
		},this);
		this.electionQueue=[];
	},this);

	this.on("newLeader",function() {
		this.electionQueue=[];
	},this);
	var self=this;
	
	// handoff when we shut down
	window.addEventListener("beforeunload",function() {
        //Priority has to be the minimum possible
        self.priority=-Number.MAX_VALUE;
        self.leaderPriority=-Number.MAX_VALUE;
        if(self.leaderState === "leader") {
            self.events.trigger("unloadState");
        }
	});

    ozpIwc.metrics.gauge('transport.leaderGroup.election').set(function() {
        var queue = self.getElectionQueue();
        return {'queue': queue ? queue.length : 0};
    });
	this.on("connectedToRouter",function() {
        this.router.registerMulticast(this,[this.electionAddress,this.name]);
        this.startElection();
    },this);
    this.on("receive",this.routePacket,this);
});

/**
 * Retrieve the election queue. Called by closures which need access to the
 * queue as it grows
 * @returns {Array} the election queue
 */
ozpIwc.LeaderGroupParticipant.prototype.getElectionQueue=function() {
    return this.electionQueue;
};


/**
 * Checks to see if the leadership group is in an election
 * @returns {Boolean} True if in an election state, otherwise false
 */
ozpIwc.LeaderGroupParticipant.prototype.inElection=function() {
	return !!this.electionTimer;
};

/**
 * Checks to see if this instance is the leader of it's group.
 * @returns {Boolean}
 */
ozpIwc.LeaderGroupParticipant.prototype.isLeader=function() {
	return this.leader === this.address;
};

/**
 * Sends a message to the leadership group.
 * @private
 * @param {string} type - the type of message-- "election" or "victory"
 */
ozpIwc.LeaderGroupParticipant.prototype.sendElectionMessage=function(type, config) {
    config = config || {};
    var state = config.state || {};
	this.send({
		'src': this.address,
		'dst': this.electionAddress,
		'action': type,
		'entity': {
			'priority': this.priority,
            'state': state
		}
	});
};

/**
 * Attempt to start a new election.
 * @protected
 * @returns {undefined}
 * @fire ozpIwc.LeaderGroupParticipant#startElection
 * @fire ozpIwc.LeaderGroupParticipant#becameLeader
 */
ozpIwc.LeaderGroupParticipant.prototype.startElection=function(config) {
    config = config || {};
    var state = config.state || {};

	// don't start a new election if we are in one
	if(this.inElection()) {
		return;
	}
	this.leaderState="election";
	this.events.trigger("startElection");

    this.victoryDebounce = null;
	
	var self=this;
	// if no one overrules us, declare victory
	this.electionTimer=window.setTimeout(function() {
		self.cancelElection();
        self.leaderState = "leader";
        self.leader=self.address;
        self.leaderPriority=self.priority;
        self.events.trigger("becameLeader");

        self.sendElectionMessage("victory");

        // Debouncing before setting state.
        self.victoryDebounce = window.setTimeout(function(){
            if (self.leaderState === "leader") {
                if (self.stateStore && Object.keys(self.stateStore).length > 0) {
                    self.events.trigger("acquireState", self.stateStore);
                    self.stateStore = {};
                }
            }
        },100);
	},this.electionTimeout);

	this.sendElectionMessage("election", {state: state});
};

/**
 * Cancels an in-progress election that we started.
 * @protected
 * @fire ozpIwc.LeaderGroupParticipant#endElection
 */
ozpIwc.LeaderGroupParticipant.prototype.cancelElection=function() {
	if(this.electionTimer) {
        window.clearTimeout(this.electionTimer);
        this.electionTimer=null;
        window.clearTimeout(this.victoryDebounce);
        this.victoryDebounce=null;
        this.events.trigger("endElection");
	}
};

/**
 * Receives a packet on the election control group or forwards it to the target implementation
 * that of this leadership group.
 * @param {ozpIwc.TransportPacket} packet
 * @returns {boolean}
 */
ozpIwc.LeaderGroupParticipant.prototype.routePacket=function(packetContext) {
	var packet=packetContext.packet;
	packetContext.leaderState=this.leaderState;
    if(packet.src === this.address) {
        // drop our own packets that found their way here
        return;
    }
    if(packet.dst === this.electionAddress) {
        if(packet.src === this.address) {
			// even if we see our own messages, we shouldn't act upon them
			return;
		} else if(packet.action === "election") {
			this.handleElectionMessage(packet);
		} else if(packet.action === "victory") {
			this.handleVictoryMessage(packet);
		}
    } else {
		this.forwardToTarget(packetContext);
	}		
};

ozpIwc.LeaderGroupParticipant.prototype.forwardToTarget=function(packetContext) {
	if(this.leaderState === "election" || this.leaderState === "connecting") {
		this.electionQueue.push(packetContext);
		return;
	}
	packetContext.leaderState=this.leaderState;
	this.events.trigger("receiveApiPacket",packetContext);
};
	
	
/**
 * Respond to someone else starting an election.
 * @private
 * @param {ozpIwc.TransportPacket} electionMessage
 * @returns {undefined}
 */
ozpIwc.LeaderGroupParticipant.prototype.handleElectionMessage=function(electionMessage) {
    //If a state was received, store it case participant becomes the leader
    if(Object.keys(electionMessage.entity.state).length > 0){
        this.stateStore = electionMessage.entity.state;
    }
	// is the new election lower priority than us?
	if(this.priorityLessThan(electionMessage.entity.priority,this.priority)) {
		// Quell the rebellion!
		this.startElection();
	} else {
		// Abandon dreams of leadership
		this.cancelElection();
	}
};

/**
 * Handle someone else declaring victory.
 * @fire ozpIwc.LeaderGroupParticipant#newLeader
 * @param {ozpIwc.TransportPacket} victoryMessage
 */
ozpIwc.LeaderGroupParticipant.prototype.handleVictoryMessage=function(victoryMessage) {
	if(this.priorityLessThan(victoryMessage.entity.priority,this.priority)) {
		// someone usurped our leadership! start an election!
		this.startElection();
	} else {
		// submit to the bully
		this.leader=victoryMessage.src;
		this.leaderPriority=victoryMessage.entity.priority;
		this.cancelElection();
		this.leaderState="member";
		this.events.trigger("newLeader");
        this.stateStore = {};
	}
};


ozpIwc.LeaderGroupParticipant.prototype.heartbeatStatus=function() {
	var status= ozpIwc.Participant.prototype.heartbeatStatus.apply(this,arguments);
	status.leaderState=this.leaderState;
	status.leaderPriority=this.priority;
	return status;
};