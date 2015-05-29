/**
 * @class IntentsInFlightNode
 * @namespace ozpIwc
 * @extends ozpIwc.ApiNode
 * @constructor
 */
ozpIwc.IntentsInFlightNode = ozpIwc.util.extend(ozpIwc.ApiNode, function(config) {
    // Take the supplied data for anything that matches in the super class,
    // such as resource.
    ozpIwc.ApiNode.apply(this, arguments);

    config=config || {};
    if(!config.invokePacket) {
        throw new ozpIwc.BadContentError("In flight intent requires an invocation packet");
    }
    if(!Array.isArray(config.handlerChoices) || config.handlerChoices <1) {
        throw new ozpIwc.BadContentError("No handlers available");
    }
    // Extra gravy that isn't captured already by the base class, or that isn't
    // captured adequately.
    this.entity = {
        'intent': {
            'type': config.type,
            'action': config.action
        },
        'invokePacket': config.invokePacket,
        'contentType': config.invokePacket.contentType,
        'entity': config.invokePacket.entity,
        'state': "choosing",
        'status': "ok",
        'handlerChoices': config.handlerChoices,
        'handlerChosen': {
            'resource': null,
            'reason': null
        },
        'handler': {
            'resource': null,
            'address': null
        },
        'reply': null
    };
    if(config.handlerChoices.length===1) {
        this.entity.handlerChosen.resource=config.handlerChoices[0].resource;
        this.entity.handlerChosen.reason="onlyOne";
        this.entity.state="delivering";
    }
});

ozpIwc.IntentsInFlightNode.prototype.setError=function(entity) {
    this.entity.reply=entity.error;
    this.entity.state = "error";
    this.version++;
};

ozpIwc.IntentsInFlightNode.prototype.setHandlerResource=function(entity) {
    if(!entity.handlerChosen || !entity.handlerChosen.resource || !entity.handlerChosen.reason) {
       throw new ozpIwc.BadStateError("Choosing state requires a resource and reason");
    }
    this.entity.handlerChosen = entity.handlerChosen;
    this.entity.state = "delivering";
    this.version++;
};
ozpIwc.IntentsInFlightNode.prototype.setHandlerParticipant=function(entity) {
    if(!entity.handler || !entity.handler.address) {
        throw new ozpIwc.BadContentError("Entity lacks a 'handler.address' field");
    }
    this.entity.handler=entity.handler;
    this.entity.state = "running";
    this.version++;
};

ozpIwc.IntentsInFlightNode.prototype.setComplete=function(entity) {
    this.entity.reply=entity.reply;
    this.entity.state = "complete";
    this.version++;
};

ozpIwc.IntentsInFlightNode.stateTransitions={
    "choosing": {
        "error": ozpIwc.IntentsInFlightNode.prototype.setError,
        "delivering" : ozpIwc.IntentsInFlightNode.prototype.setHandlerResource
    },
    "delivering": {
        "error": ozpIwc.IntentsInFlightNode.prototype.setError,
        "running": ozpIwc.IntentsInFlightNode.prototype.setHandlerParticipant,
        "complete": ozpIwc.IntentsInFlightNode.prototype.setComplete
    },
    "running": {
        "error": ozpIwc.IntentsInFlightNode.prototype.setError,
        "complete": ozpIwc.IntentsInFlightNode.prototype.setComplete
    },
    "complete": {},
    "error": {}
};

/**
 * Set action for an IntentsInflightNode.
 *
 * @method set
 * @param {ozpIwc.TransportPacket} packet
 */
ozpIwc.IntentsInFlightNode.prototype.set = function(packet) {
    if(!packet.entity || !packet.entity.state) {
        throw new ozpIwc.BadContentError("Entity lacks a 'state' field");
    }
    
    var transition=ozpIwc.IntentsInFlightNode.stateTransitions[this.entity.state];
    if(!transition) {
        // we're in a bad state.  pretty much unrecoverable
        this.setError("Inflight intent is in an invalid state.  Cannot proceed.");
        return;
    }

    transition=transition[packet.entity.state];
    if(!transition) {
        throw new ozpIwc.BadStateError("In-flight intent cannot transition from "+
                this.entity.state+" to"+packet.entity.state);
    }
    
    transition.call(this,packet.entity);
};
