/**
 * @class
 */
ozpIwc.RouterWatchdog = ozpIwc.util.extend(ozpIwc.InternalParticipant, function(config) {
    ozpIwc.InternalParticipant.apply(this, arguments);

    this.participantType = "routerWatchdog";
    var self = this;
    this.on("connected", function() {
        this.name = this.router.self_id;
    }, this);

    this.heartbeatFrequency = config.heartbeatFrequency || 10000;

    this.on("connectedToRouter", this.setupWatches, this);
});

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

ozpIwc.RouterWatchdog.prototype.shutdown = function() {
    window.clearInterval(this.timer);
};

