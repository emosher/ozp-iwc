var ozpIwc = ozpIwc || {};

ozpIwc.IntentsApi = ozpIwc.util.extend(ozpIwc.CommonApiBase, function () {
    ozpIwc.CommonApiBase.apply(this, arguments);
});

/**
 *
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

/**
 *
 * @param prefix
 */
ozpIwc.IntentsApi.prototype.createKey = function (prefix) {
    //TODO createKey()
};

/**
 *
 * @param packet
 * @returns {*}
 */
ozpIwc.IntentsApi.prototype.makeValue = function (packet) {
    var resource = this.parseResource(packet.resource);
    switch (resource.intentValueType) {
        case 'handler':
            return this.findOrMakeHandler(packet, resource);
        case 'definition':
            return this.findOrMakeDefinition(packet, resource);
        case 'capabilities':
            return this.findOrMakeCapabilities(packet, resource);
        default:
            return null;
    }
};

/**
 *
 * @param resource
 * @param packet
 * @param constructor
 * @returns {*}
 */
ozpIwc.IntentsApi.prototype.findOrMakeGeneric = function (resource, packet, constructor) {
    var node = this.data[resource];
    if (!node) {
        node = this.data[resource] = new constructor(packet);
    }

    return node;
};

/**
 *
 * @param packet
 * @param resource
 * @returns {*}
 */
ozpIwc.IntentsApi.prototype.findOrMakeCapabilities = function (packet, resource) {
    packet.resource = resource.capabilityRes;
    return this.findOrMakeGeneric(resource.capabilityRes, packet, ozpIwc.IntentsApiCapabilitiesValue);
};

/**
 *
 * @param packet
 * @param resource
 * @returns {*}
 */
ozpIwc.IntentsApi.prototype.findOrMakeDefinition = function (packet, resource) {
    var capability = this.findOrMakeCapabilities(packet, resource);

    var definitionIndex = capability.definitions.indexOf(resource.definitionRes);
    if (definitionIndex === -1) {
        capability.definitions.push(resource.definitionRes);
    }

    packet.resource = resource.definitionRes;
    return this.findOrMakeGeneric(resource.definitionRes, packet, ozpIwc.IntentsApiDefinitionValue);
};

/**
 *
 * @param packet
 * @param resource
 * @returns {*}
 */
ozpIwc.IntentsApi.prototype.findOrMakeHandler = function (packet, resource) {
    var definition = this.findOrMakeDefinition(packet, resource);

    var handlerIndex = definition.handlers.indexOf(resource.handlerRes);
    if (handlerIndex === -1) {
        definition.handlers.push(resource.handlerRes);
    }

    packet.resource = resource.handlerRes;
    return this.findOrMakeGeneric(resource.handlerRes, packet, ozpIwc.IntentsApiHandlerValue);
};

/**
 *
 * @param packet
 */
ozpIwc.IntentsApi.prototype.handleInvoke = function (packet) {
    //TODO handleInvoke()
};

/**
 *
 */
ozpIwc.IntentsApi.prototype.handleListen = function () {
    //TODO handleListen()
};

/**
 *
 */
ozpIwc.IntentsApi.prototype.handleBroadcast = function () {
    //TODO handleBroadcast()
};

/**
 * @override
 * @param node
 * @param packetContext
 */
ozpIwc.IntentsApi.prototype.isPermitted = function (node, packetContext) {
    //TODO isPermitted()
};

/**
 * @override
 * @param node
 * @param packetContext
 * @returns {*}
 */
ozpIwc.IntentsApi.prototype.validateResource = function (node, packetContext) {
    //TODO validateResource()
    return packetContext.resource;

};

/**
 *
 * @param node
 * @param packetContext
 */
ozpIwc.IntentsApi.prototype.validatePreconditions = function (node, packetContext) {
    //TODO validatePreconditions()
};