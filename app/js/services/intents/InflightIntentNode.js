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

/**
 * Valid states for an IntentsInFlightNode.
 *
 * @property acceptedStates
 * @type {String[]}
 */
ozpIwc.IntentsInFlightNode.prototype.acceptedStates = ["choosing", "delivering", "running", "error", "complete"];

/**
 * Set action for an IntentsInflightNode.
 *
 * @method set
 * @param {ozpIwc.TransportPacket} packet
 */
ozpIwc.IntentsInFlightNode.prototype.set = function(packet) {
    if(packet.entity && packet.entity.error) {
        this.entity.reply=packet.entity.error;
        this.entity.state = "error";
        this.version++;
        return;
    }
    // Allowed transitions of state here.  Should probably test for the current
    // state and throw exception back if an illegal change is attempted.
    switch (this.entity.state) {
        case "choosing":
            if(!packet.entity || !packet.entity.resource || !packet.entity.reason) {
                throw new ozpIwc.BadStateError("Choosing state requires a resource and reason");
            }
            this.entity.handlerChosen = {
                'resource': packet.entity.resource,
                'reason': packet.entity.reason
            };
            this.entity.state = "delivering";
            break;

        case "delivering":
            if(!packet.entity || !packet.entity.address || !packet.entity.resource) {
                throw new ozpIwc.BadStateError("Delivering state requires a resource and address");
            }
            this.entity.handler.address = packet.entity.address;
            this.entity.handler.resource = packet.entity.resource;
            this.entity.state = "running";
            break;

        case "running":
            this.entity.reply=packet.entity && packet.entity.reply;
            this.entity.state = "complete";
            break;
        case "complete":
            throw new ozpIwc.BadStateError("In-flight intent is complete");
        case "error":
            throw new ozpIwc.BadStateError("In-flight intent is in an error state");
        default:
            // We would only get here if we added a state and forgot to manage
            // it with one of the cases.  In which case we deserve the resulting
            // exception.
            throw new ozpIwc.BadStateError("In-flight intent in an unknown state:"+this.entity.state);
    }
    this.version++;
};
