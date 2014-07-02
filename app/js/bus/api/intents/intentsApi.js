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
 * @returns {IntentsApiHandlerValue|IntentsAPiDefinitionValue|IntentsApiCapabilitiesValue}
 */
ozpIwc.IntentsApi.prototype.makeValue = function (packet) {
    var resource = this.parseResource(packet.resource);
    switch (resource.intentValueType) {
        case 'handler':
            return this.findOrMakeHandler(resource);
        case 'definition':
            return this.findOrMakeDefinition(resource);
        case 'capabilities':
            return this.findOrMakeCapabilities(resource);
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
 * @returns {IntentsApiHandlerValue|IntentsAPiDefinitionValue|IntentsApiCapabilitiesValue}
 */
ozpIwc.IntentsApi.prototype.findOrMakeGeneric = function (resource, constructor) {
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
 * @returns {IntentsApiCapabilitiesValue}
 */
ozpIwc.IntentsApi.prototype.findOrMakeCapabilities = function (resource) {
    return this.findOrMakeGeneric(resource.capabilityRes, ozpIwc.IntentsApiCapabilitiesValue);
};

/**
 * Returns the given definition in the IntentsApi. Constructs a new one if it does not exist. Constructs a capability
 * if necessary.
 * @param packet
 * @param resource
 * @returns {IntentsAPiDefinitionValue}
 */
ozpIwc.IntentsApi.prototype.findOrMakeDefinition = function (resource) {
    var capability = this.findOrMakeCapabilities(resource);
    var definitionIndex = capability.definitions.indexOf(resource.definitionRes);
    if (definitionIndex === -1) {
        capability.definitions.push(resource.definitionRes);
    }

    return this.findOrMakeGeneric(resource.definitionRes, ozpIwc.IntentsApiDefinitionValue);
};

/**
 * Returns the given handler in the IntentsApi. Constructs a new one if it does not exist. Constructs a definition
 * if necessary.
 * @param packet
 * @param resource
 * @returns {IntentsApiHandlerValue}
 */
ozpIwc.IntentsApi.prototype.findOrMakeHandler = function (resource) {
    var definition = this.findOrMakeDefinition(resource);
    var handlerIndex = definition.handlers.indexOf(resource.handlerRes);
    if (handlerIndex === -1) {
        definition.handlers.push(resource.handlerRes);
    }

    return this.findOrMakeGeneric(resource.handlerRes, ozpIwc.IntentsApiHandlerValue);
};

/**
 * Creates and registers a handler to the given definition resource path.
 * @param packet
 * @returns {IntentsApiHandlerValue}
 */
ozpIwc.IntentsApi.prototype.handleRegister = function (packet) {
    //
    var key = this.createKey(packet.resource + '/');
    var resource = this.parseResource(key);
    var node = this.findOrMakeHandler(resource);
    node.set(packet);

    return node;
};

/**
 * Unregisters and destroys the handler assigned to the given handler resource path.
 * @param packet
 * @returns {?}
 */
ozpIwc.IntentsApi.prototype.handleUnregister = function (packet) {
    var parse = this.parseResource(packet.resource);
    console.log(this.data[parse.definitionRes]);
    console.log(this.data[parse.capabilityRes]);
    var index = this.data[parse.definitionRes].definitions.indexOf(parse.handlerRes);
    if (index > -1) {
        this.data[parse.definitionRes].definitions.splice(index, 1);
    }
    console.log(this.data[parse.definitionRes]);
    console.log(this.data[parse.capabilityRes]);

    packet.reply({'action':'ok'});
};

/**
 * Invokes the appropriate handler for the intent from either user preference or by prompting the user.
 * @param packet
 */
ozpIwc.IntentsApi.prototype.handleInvoke = function (packet) {
    var parse = this.parseResource(packet.resource);
    switch (parse.intentValueType) {
        case 'handler':
            //TODO invoke the specific handler.
            break;
        case 'definition':
            //TODO give the user options from all handlers in definition.
            break;
        default:
            //TODO handle badResource (naming?)
            break;
    }
};

/**
 * Listen for broadcast intents.
 * @param packet
 */
ozpIwc.IntentsApi.prototype.handleListen = function (packet) {
    //TODO handleListen()
    var parse = this.parseResource(packet.resource);
    if (parse.intentValueType !== 'definition') {
        //TODO error handling
        return null;
    }
    this.handleWatch
    //TODO add listener
};

/**
 * Handle a broadcast intent
 * @param packet
 */
ozpIwc.IntentsApi.prototype.handleBroadcast = function (packet) {
    //TODO handleBroadcast()
    var parse = this.parseResource(packet.resource);
    if (parse.intentValueType !== 'definition') {
        //TODO error handling
        return null;
    }
    //TODO broadcast
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
// * @override
// * @param node
// * @param packetContext
// * @returns {*}
// */
//ozpIwc.IntentsApi.prototype.validateResource = function (node, packetContext) {
//    //TODO validateResource()
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