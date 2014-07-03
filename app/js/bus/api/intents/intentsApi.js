var ozpIwc = ozpIwc || {};

ozpIwc.IntentsApi = ozpIwc.util.extend(ozpIwc.CommonApiBase, function () {
    ozpIwc.CommonApiBase.apply(this, arguments);
});

/**
 * Internal method, not intended API. Used for handling resource path parsing.
 * @param resource
 * @returns {*}
 */
ozpIwc.IntentsApi.prototype.parseResource = function (resource) {
    var resourceSplit = resource.split('/');
    var result = {
        type: resourceSplit[1],
        subtype: resourceSplit[2],
        verb: resourceSplit[3],
        handler: resourceSplit[4],
        capabilityRes: '/' + resourceSplit[1] + '/' + resourceSplit[2],
        definitionRes: '/' + resourceSplit[1] + '/' + resourceSplit[2] + '/' + resourceSplit[3],
        handlerRes: '/' + resourceSplit[1] + '/' + resourceSplit[2] + '/' + resourceSplit[3] + '/' + resourceSplit[4],
        intentValueType: undefined
    };

    if (result.type && result.subtype) {
        if (result.verb) {
            if (result.handler) {
                result.intentValueType = 'handler';
            } else {
                result.intentValueType = 'definition';
            }
        } else {
            result.intentValueType = 'capabilities'
        }
    } else {
        return null;
    }

    return result;
};
//
///**
// *
// * @param prefix
// */
//ozpIwc.IntentsApi.prototype.createKey = function (prefix) {
//    //TODO createKey()
//};

/**
 * Takes the resource of the given packet and creates an empty value in the IntentsApi. Chaining of creation is
 * accounted for (A handler requires a definition, which requires a capability).
 * @param packet
 * @returns {IntentsApiHandlerValue|IntentsAPiDefinitionValue|IntentsApiCapabilityValue}
 */
ozpIwc.IntentsApi.prototype.makeValue = function (packet) {
    var resource = this.parseResource(packet.resource);
    switch (resource.intentValueType) {
        case 'handler':
            return this.getHandler(resource);
        case 'definition':
            return this.getDefinition(resource);
        case 'capabilities':
            return this.getCapability(resource);
        default:
            return null;
    }
};

/**
 * Generic version of findOrMakeValue that uses the constructor parameter to determine what is constructed if the
 * resource does not exist.
 * @param resource
 * @param packet
 * @param constructor
 * @returns {IntentsApiHandlerValue|IntentsAPiDefinitionValue|IntentsApiCapabilityValue}
 */
ozpIwc.IntentsApi.prototype.getGeneric = function (resource, constructor) {
    var node = this.data[resource];
    if (!node) {
        node = this.data[resource] = new constructor({resource: resource});
    }
    return node;
};

/**
 * Returns the given capability in the IntentsApi. Constructs a new one if it does not exist.
 * @param packet
 * @param resource
 * @returns {IntentsApiCapabilityValue}
 */
ozpIwc.IntentsApi.prototype.getCapability = function (resource) {
    return this.getGeneric(resource.capabilityRes, ozpIwc.IntentsApiCapabilityValue);
};

/**
 * Returns the given definition in the IntentsApi. Constructs a new one if it does not exist. Constructs a capability
 * if necessary.
 * @param packet
 * @param resource
 * @returns {IntentsAPiDefinitionValue}
 */
ozpIwc.IntentsApi.prototype.getDefinition = function (resource) {
    var capability = this.getCapability(resource);
    var definitionIndex = capability.definitions.indexOf(resource.definitionRes);
    if (definitionIndex === -1) {
        capability.definitions.push(resource.definitionRes);
    }

    return this.getGeneric(resource.definitionRes, ozpIwc.IntentsApiDefinitionValue);
};

/**
 * Returns the given handler in the IntentsApi. Constructs a new one if it does not exist. Constructs a definition
 * if necessary.
 * @param packet
 * @param resource
 * @returns {IntentsApiHandlerValue}
 */
ozpIwc.IntentsApi.prototype.getHandler = function (resource) {
    var definition = this.getDefinition(resource);
    var handlerIndex = definition.handlers.indexOf(resource);
    if (handlerIndex === -1) {
        definition.handlers.push(resource.handlerRes);
    }

    return this.getGeneric(resource.handlerRes, ozpIwc.IntentsApiHandlerValue);
};

/**
 * Creates and registers a handler to the given definition resource path.
 * @param packet
 * @returns {IntentsApiHandlerValue}
 */
ozpIwc.IntentsApi.prototype.handleRegister = function (node, packetContext) {
    var resource = this.parseResource(packetContext.packet.resource);
    if (resource.intentValueType === 'definition') {
        resource.handlerRes = this.createKey(packetContext.packet.resource + '/');
    } else if (resource.intentValueType !== 'handler') {
        return packetContext.replyTo({
            'action': 'badResource'
        });
    }

    var handler = this.getHandler(resource);
    handler.set(packetContext.packet.entity);

    packetContext.replyTo({
        'action': 'ok',
        'entity': handler.resource
    });
};

/**
 * Unregisters and destroys the handler assigned to the given handler resource path.
 * @param packet
 * @returns {?}
 */
ozpIwc.IntentsApi.prototype.handleUnregister = function (node, packetContext) {
    var parse = this.parseResource(packetContext.packet.resource);
    var index = this.data[parse.definitionRes].handlers.indexOf(parse.handlerRes);

    if (index > -1) {
        this.data[parse.definitionRes].handlers.splice(index, 1);
    }
    delete this.data[parse.handlerRes];
    packetContext.replyTo({'action': 'ok'});
};

/**
 * Invokes the appropriate handler for the intent from either user preference or by prompting the user.
 * @param packet
 */
ozpIwc.IntentsApi.prototype.handleInvoke = function (node, packetContext) {
    var parse = this.parseResource(packetContext.packet.resource);

    switch (parse.intentValueType) {
        case 'handler':
            node.invoke(packetContext.packet);
            break;

        case 'definition':
            //TODO get user preference of which handler to use?
            var handlerPreference = 0;
            if (node.handlers.length > 0) {
                var handler = node.handlers[handlerPreference];
                this.data[handler].invoke(packet);
            } else {
                packetContext.replyTo({'action': 'badResource'});
            }
            break;

        default:
            packetContext.replyTo({'action': 'badResource'});
            break;
    }
};

/**
 * Listen for broadcast intents.
 * @param packet
 */
ozpIwc.IntentsApi.prototype.handleListen = function (node, packetContext) {
    //TODO handleListen()
//    var parse = this.parseResource(packetContext.packet.resource);
//    if (parse.intentValueType !== 'definition') {
//        return packetContext.replyTo({
//            'action': 'badResource'
//        });
//    }

};

/**
 * Handle a broadcast intent
 * @param packet
 */
ozpIwc.IntentsApi.prototype.handleBroadcast = function (node, packetContext) {
    //TODO handleBroadcast()
//    var parse = this.parseResource(packetContext.packet.resource);
//    if (parse.intentValueType !== 'definition') {
//        return packetContext.replyTo({
//            'action': 'badResource'
//        });
//    }
//    for (var i in node.handlers) {
//        this.data[node.handlers[i]].invoke(packetContext.packet);
//    }
};

/**
 * @override
 * @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.CommonApiBase.prototype.handleSet = function (node, packetContext) {
    node.set(packetContext.packet.entity);
    packetContext.replyTo({'action': 'ok'});
};

///**
// * @override
// * @param node
// * @param packetContext
// */
//ozpIwc.IntentsApi.prototype.isPermitted = function (node, packetContext) {
//    //TODO isPermitted()
//};
//
///**
//* @override
//* @param node
//* @param packetContext
//* @returns {*}
//*/
//ozpIwc.IntentsApi.prototype.validateResource = function (node, packetContext) {
//    var resource = this.parseResource(packetContext.packet.resource);
//    if(!resource) {
//        return null;
//    }
//    return packetContext.resource;
//
//};
//
///**
// *
// * @param node
// * @param packetContext
// */
//ozpIwc.IntentsApi.prototype.validatePreconditions = function (node, packetContext) {
//    //TODO validatePreconditions()
//};

ozpIwc.IntentsApi.prototype.handleDebug = function (node, packetContext) {
    packetContext.replyTo({
        action: 'ok',
        entity: ozpIwc.intentsApi.data
    });
};