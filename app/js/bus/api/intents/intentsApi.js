/**
 * The Intents API. Subclasses The Common Api Base.
 * @class
 */
ozpIwc.IntentsApi = ozpIwc.util.extend(ozpIwc.CommonApiBase, function () {
    ozpIwc.CommonApiBase.apply(this, arguments);
    this.events.on("receive", ozpIwc.IntentsApi.prototype.parseResource, this);
});

/**
 * Internal method, not intended for API use. Used for handling resource path parsing.
 * @param  {string} resource - the resource path to be evaluated.
 * @returns {object} parsedResource
 * @returns {string} parsedResource.type - the type of the resource
 * @returns {string} parsedResource.subtype - the subtype of the resource
 * @returns {string} parsedResource.verb - the verb (action) of the resource
 * @returns {string} parsedResource.handler - the handler of the resource
 * @returns {string} parsedResource.capabilityRes - the resource path of this resource's capability
 * @returns {string} parsedResource.definitionRes - the resource path of this resource's definition
 * @returns {string} parsedResource.handlerRes - the resource path of this resource's handler
 * @returns {string} parsedResource.intentValueType - returns the value type given the resource path (capability, definition, handler)
 */
ozpIwc.IntentsApi.prototype.parseResource = function (packetContext) {
    var resourceSplit = packetContext.packet.resource.split('/');
    var result = {
        type: resourceSplit[1],
        subtype: resourceSplit[2],
        verb: resourceSplit[3],
        handler: resourceSplit[4]
    };
    if (result.type && result.subtype) {
        if (result.verb) {
            if (result.handler) {
                result.intentValueType = 'handler';
                result.handlerRes = '/' + resourceSplit[1] + '/' + resourceSplit[2] + '/' + resourceSplit[3] + '/' + resourceSplit[4];
                result.definitionRes = '/' + resourceSplit[1] + '/' + resourceSplit[2] + '/' + resourceSplit[3];
                result.capabilityRes = '/' + resourceSplit[1] + '/' + resourceSplit[2];
            } else {
                result.intentValueType = 'definition';
                result.definitionRes = '/' + resourceSplit[1] + '/' + resourceSplit[2] + '/' + resourceSplit[3];
                result.capabilityRes = '/' + resourceSplit[1] + '/' + resourceSplit[2];
            }
        } else {
            result.intentValueType = 'capabilities';
            result.capabilityRes = '/' + resourceSplit[1] + '/' + resourceSplit[2];
        }
        packetContext.packet.parsedResource = result;
    }
};

/**
 * Takes the resource of the given packet and creates an empty value in the IntentsApi. Chaining of creation is
 * accounted for (A handler requires a definition, which requires a capability).
 * @param {object} packet
 * @returns {IntentsApiHandlerValue|IntentsAPiDefinitionValue|IntentsApiCapabilityValue}
 */
ozpIwc.IntentsApi.prototype.makeValue = function (packet) {
    switch (packet.parsedResource.intentValueType) {
        case 'handler':
            return this.getHandler(packet);
        case 'definition':
            return this.getDefinition(packet);
        case 'capabilities':
            return this.getCapability(packet);
        default:
            return null;
    }
};

/**
 * Internal method, not intended for API use. Uses constructor parameter to determine what is constructed if the
 * resource does not exist.
 * @param {string} resource - the resource path of the desired value.
 * @param {Function} constructor - constructor function to be used if value does not exist.
 * @returns {IntentsApiHandlerValue|IntentsAPiDefinitionValue|IntentsApiCapabilityValue} node - node has only the resource parameter initialized.
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
 * @param {object} parsedResource - the  parsed resource of the desired value. Created from parsedResource().
 * @returns {IntentsApiCapabilityValue} value - the capability value requested.
 */
ozpIwc.IntentsApi.prototype.getCapability = function (packet) {
    return this.getGeneric(packet.parsedResource.capabilityRes, ozpIwc.IntentsApiCapabilityValue);
};

/**
 * Returns the given definition in the IntentsApi. Constructs a new one if it does not exist. Constructs a capability
 * if necessary.
 * @param {object} parsedResource - the  parsed resource of the desired value. Created from parsedResource().
 * @returns {IntentsAPiDefinitionValue} value - the definition value requested.
 */
ozpIwc.IntentsApi.prototype.getDefinition = function (packet) {
    var capability = this.getCapability(packet);
    capability.entity = capability.entity || {};
    capability.entity.definitions = capability.entity.definitions || [];

    var definitionIndex = capability.entity.definitions.indexOf(packet.parsedResource.definitionRes);
    if (definitionIndex === -1) {
        capability.pushDefinition(packet.parsedResource.definitionRes);
    }

    return this.getGeneric(packet.parsedResource.definitionRes, ozpIwc.IntentsApiDefinitionValue);
};

/**
 * Returns the given handler in the IntentsApi. Constructs a new one if it does not exist. Constructs a definition
 * and capability if necessary.
 * @param {object} parsedResource - the  parsed resource of the desired value. Created from parsedResource().
 * @returns {IntentsApiHandlerValue} value - the handler value requested.
 */
ozpIwc.IntentsApi.prototype.getHandler = function (packet) {
    var definition = this.getDefinition(packet);
    definition.entity = definition.entity || {};
    definition.entity.handlers = definition.entity.handlers || [];

    var handlerIndex = definition.entity.handlers.indexOf(packet.parsedResource.handlerRes);
    if (handlerIndex === -1) {
        definition.pushHandler(packet.parsedResource.handlerRes);
    }

    return this.getGeneric(packet.parsedResource.handlerRes, ozpIwc.IntentsApiHandlerValue);
};

/**
 * Creates and registers a handler to the given definition resource path.
 * @param {object} node - the handler value to register, or the definition value the handler will register to
 * (handler will receive a generated key if definition value is provided).
 * @param {ozpIwc.TransportPacketContext} packetContext - the packet received by the router.
 */
ozpIwc.IntentsApi.prototype.handleRegister = function (node, packetContext) {
    if (packetContext.packet.parsedResource.intentValueType === 'definition') {
        packetContext.packet.parsedResource.handlerRes = this.createKey(packetContext.packet.resource + '/');
    } else if (packetContext.packet.parsedResource.intentValueType !== 'handler') {
        packetContext.replyTo({
            'action': 'badResource'
        });
        return null;
    }

    var handler = this.getHandler(packetContext.packet);
    handler.set(packetContext);

    packetContext.replyTo({
        'action': 'ok',
        'entity': handler.resource
    });
};

/**
 * Unregisters and destroys the handler assigned to the given handler resource path.
 * @param {object} node - the handler value to unregister from its definition.
 * @param {ozpIwc.TransportPacketContext} packetContext - the packet received by the router.
 */
ozpIwc.IntentsApi.prototype.handleUnregister = function (node, packetContext) {
    var definitionPath = packetContext.packet.parsedResource.definitionRes;
    var handlerPath = packetContext.packet.parsedResource.handlerRes;

    var index = this.data[definitionPath].entity.handlers.indexOf(handlerPath);

    if (index > -1) {
        this.data[definitionPath].entity.handlers.splice(index, 1);
    }
    delete this.data[handlerPath];
    packetContext.replyTo({'action': 'ok'});
};

/**
 * Invokes the appropriate handler for the intent from one of the following methods:
 *  <li> user preference specifies which handler to use. </li>
 *  <li> by prompting the user to select which handler to use. </li>
 *  <li> by receiving a handler resource instead of a definition resource </li>
 *  @todo <li> user preference specifies which handler to use. </li>
 *  @todo <li> by prompting the user to select which handler to use. </li>
 * @param {object} node - the definition or handler value used to invoke the intent.
 * @param {ozpIwc.TransportPacketContext} packetContext - the packet received by the router.
 */
ozpIwc.IntentsApi.prototype.handleInvoke = function (node, packetContext) {
    switch (packetContext.packet.parsedResource.intentValueType) {
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
 * @todo unimplemented
 * @param {object} node - ?
 * @param {ozpIwc.TransportPacketContext} packetContext - the packet received by the router.
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
 * Handle a broadcast intent.
 * @todo unimplemented
 * @param {object} node - ?
 * @param {ozpIwc.TransportPacketContext} packetContext - the packet received by the router.
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
