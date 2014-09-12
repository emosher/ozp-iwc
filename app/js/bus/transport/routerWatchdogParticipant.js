/**
 * @submodule bus.transport
 */

/**
 * @class RouterWatchdog
 * @extends ozpIwc.InternalParticipant
 * @namespace ozpIwc
 */
ozpIwc.RouterWatchdog = ozpIwc.util.extend(ozpIwc.InternalParticipant, function(config) {
    ozpIwc.InternalParticipant.apply(this, arguments);

    /**
     * The type of the participant.
     * @property participantType
     * @type String
     */
    this.participantType = "routerWatchdog";
    var self = this;

    /**
     * Fired when connected.
     * @event #connected
     */
    this.on("connected", function() {
        this.name = this.router.self_id;
    }, this);

    /**
     * Frequency of heartbeats
     * @property heartbeatFrequency
     * @type Number
     * @defualt 10000
     */
    this.heartbeatFrequency = config.heartbeatFrequency || 10000;

    /**
     * Fired when connected to the router.
     * @event #connectedToRouter
     */
    this.on("connectedToRouter", this.setupWatches, this);
});

/**
 * Sets up the watchdog for all participants connected to the router. Reports heartbeats based on
 * {{#crossLink "ozpIwc.RouterWatchdogParticipant/heartbeatFrequency:property"}}{{/crossLink}}
 * @method setupWatches
 */
ozpIwc.RouterWatchdog.prototype.setupWatches = function() {
    this.name = this.router.self_id;
    var self=this;
    var heartbeat=function() {
        self.send({
            dst: "names.api",
            action: "set",
            resource: "/router/" + self.router.self_id,
            contentType: "application/ozpIwc-router-v1+json",
            entity: {
                'address': self.router.self_id,
                'participants': self.router.getParticipantCount()
            }
        });

        for (var k in self.router.participants) {
            var participant=self.router.participants[k];
            if(participant instanceof ozpIwc.MulticastParticipant) {
                self.send({
                    'dst': "names.api",
                    'resource': participant.namesResource,
                    'action' : "set",
                    'entity' : participant.heartBeatStatus,
                    'contentType' : participant.heartBeatContentType              
                });
            } else {
                participant.heartbeat();
            }            
        }

    };
//    heartbeat();
    
    this.timer = window.setInterval(heartbeat, this.heartbeatFrequency);
};

/**
 * Removes the watchdog.
 * @method shutdown
 */
ozpIwc.RouterWatchdog.prototype.shutdown = function() {
    window.clearInterval(this.timer);
};

