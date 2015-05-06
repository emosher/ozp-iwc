/**
 * @submodule bus.service.Value
 */

/**
 * @class IntentsNode
 * @namespace ozpIwc
 * @extends ozpIwc.ApiNode
 * @constructor
 */
ozpIwc.IntentsNode = ozpIwc.util.extend(ozpIwc.ApiNode, function(config) {
    ozpIwc.ApiNode.apply(this, arguments);
});

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

    // Extra gravy that isn't captured already by the base class, or that isn't
    // captured adequately.
    this.entity = {
        'intent': {
            'type': config.type,
            'action': config.action
        },
        'contentType': config.contentType,
        'entity': config.entity,
        'state': "new",
        'status': "ok",
        'handlerChoices': config.handlerChoices || [],
        'handlerChosen': {
            'resource': null,
            'reason': null
        },
        'handler': {
            'resource': null,
            'address': null
        },
        'reply': {
            'contentType': null,
            'entity': null
        }
    };
    this.invokePacket = config.invokePacket;
});

/**
 * Valid states for an IntentsInFlightNode.
 *
 * @property acceptedStates
 * @type {String[]}
 */
ozpIwc.IntentsInFlightNode.prototype.acceptedStates = ["new", "choosing", "delivering", "running", "error", "complete"];

/**
 * Set action for an IntentsInflightNode.
 *
 * @method set
 * @param {ozpIwc.TransportPacket} packet
 */
ozpIwc.IntentsInFlightNode.prototype.set = function(packet) {
    // Invoke the default behaviors, but leave the entity intact as we'll
    // manipulate that further down, depending on the state.
    var e = this.entity;
    ozpIwc.ApiNode.prototype.set.apply(this, arguments);
    this.entity = e;

    // Allowed transitions of state here.  Should probably test for the current
    // state and throw exception back if an illegal change is attempted.
    switch (packet.entity.state) {
        case "choosing":
            this.entity.handlerChosen = {
                'resource': packet.entity.resource,
                'reason': packet.entity.reason
            };
            this.entity.state = "delivering";
            break;

        case "running":
            this.entity.state = "running";
            this.entity.handler.address = packet.entity.address;
            this.entity.handler.resource = packet.entity.resource;
            break;

        case "fail":
            this.entity.state = packet.entity.state;
            this.entity.reply.contentType = packet.entity.reply.contentType;
            this.entity.reply.entity = packet.entity.reply.entity;
            ozpIwc.ApiNode.markAsDeleted.apply(this, arguments);
            break;

        case "complete":
            this.entity.state = packet.entity.state;
            this.entity.reply.contentType = packet.entity.reply.contentType;
            this.entity.reply.entity = packet.entity.reply.entity;
            ozpIwc.ApiNode.markAsDeleted.apply(this, arguments);
            break;

        default:
            // We would only get here if we added a state and forgot to manage
            // it with one of the cases.  In which case we deserve the resulting
            // exception.
            throw new ozpIwc.BadActionError(packet);
    }
};
