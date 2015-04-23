ozpIwc.ClientParticipant=ozpIwc.util.extend(ozpIwc.Participant,function(config) {
    config=config || {};
	ozpIwc.Participant.apply(this,arguments);
    /**
     * The type of the participant.
     * @property participantType
     * @type {String}
     * @default "internal"
     */
	this.participantType="internalClient";

    /**
     * The name of the participant.
     * @property name
     * @type {String}
     * @default ""
     */
	this.name=config.name;

    var self = this;
    this.connectPromise=new Promise(function(resolve,reject) {
        self.on("connectedToRouter",function() {
            resolve();
            self.permissions.pushIfNotExist('ozp:iwc:address', self.address);
            self.permissions.pushIfNotExist('ozp:iwc:sendAs',self.address);
            self.permissions.pushIfNotExist('ozp:iwc:receiveAs', self.address);

            ozpIwc.metrics.gauge(self.metricRoot,"registeredCallbacks").set(function() {
                if (!self.replyCallbacks || !Object.keys(self.replyCallbacks)) {
                    return 0;
                }
                return Object.keys(self.replyCallbacks).length;
            });
        });
    });
    
    ozpIwc.ClientMixin(this);
});

ozpIwc.ClientParticipant.prototype.sendImpl=ozpIwc.Participant.prototype.send;

ozpIwc.ClientParticipant.prototype.receiveFromRouterImpl=function(packetContext) {
    var packet=packetContext.packet;
    if(!this.routeToReplies(packet)) {
        this.events.trigger("receive",packetContext);
    }    
};

