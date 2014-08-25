/**
 * The Intents API. Subclasses The Common Api Base.
 * @class
 * @params config {Object}
 * @params config.href {String} - URI of the server side Data storage to load the Intents Api with
 * @params config.loadServerData {Boolean} - Flag to load server side data.
 * @params config.loadServerDataEmbedded {Boolean} - Flag to load embedded version of server side data.
 *                                                  Takes precedence over config.loadServerData
 */
ozpIwc.IntentsApi = ozpIwc.util.extend(ozpIwc.CommonApiBase, function (config) {
    ozpIwc.CommonApiBase.apply(this, arguments);
    this.events.on("receive", ozpIwc.IntentsApi.prototype.parseResource, this);
    var self = this;
    if (config.href && config.loadServerDataEmbedded) {
        this.loadServerDataEmbedded({href: config.href})
            .success(function () {
                //Add on load code here
            });
    } else if (config.href && config.loadServerData) {
        this.loadServerData({href: config.href})
            .success(function () {
                //Add on load code here
            });
    }


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
    if(!packetContext.packet.resource) {
        return;
    }
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
    return packetContext;
};

/**
 * Takes the resource of the given packet and creates an empty value in the IntentsApi. Chaining of creation is
 * accounted for (A handler requires a definition, which requires a capability).
 * @param {object} packet
 * @returns {IntentsApiHandlerValue|IntentsAPiDefinitionValue|IntentsApiCapabilityValue}
 */
ozpIwc.IntentsApi.prototype.makeValue = function (packet) {
    if (!packet.packetResource) {
        packet = ozpIwc.IntentsApi.prototype.parseResource({packet: packet}).packet;
    }
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
            'response': 'badResource'
        });
        return null;
    }

    var handler = this.getHandler(packetContext.packet);
    handler.set(packetContext);

    packetContext.replyTo({
        'response': 'ok',
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
    packetContext.replyTo({'response': 'ok'});
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
                packetContext.replyTo({'response': 'badResource'});
            }
            break;

        default:
            packetContext.replyTo({'response': 'badResource'});
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
//            'response': 'badResource'
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
//            'response': 'badResource'
//        });
//    }
//    for (var i in node.handlers) {
//        this.data[node.handlers[i]].invoke(packetContext.packet);
//    }
};


/**
 * Expects a complete Intents data store tree returned from the specified href. Data must be of hal/json type and the
 * stored tree must be in the '_embedded' property.
 *
 * @param config {Object}
 * @param config.href {String}
 * @returns {ozpIwc.AsyncAction}
 */
ozpIwc.IntentsApi.prototype.loadServerDataEmbedded = function (config) {
    var self = this;
    var asyncResponse = new ozpIwc.AsyncAction();
    ozpIwc.util.ajax({
        href: config.href,
        method: "GET"
    })
        .success(function (data) {
            // Take the root path from where the intent data is stored so that we can remove it from each object that
            // becomes a intent value.
            var rootPath = data._links.self.href;
            for (var i in data._embedded['ozp:intentTypes']) {
                var type = data._embedded['ozp:intentTypes'][i];
                for (var j in type._embedded['ozp:intentSubTypes']) {
                    var subType = type._embedded['ozp:intentSubTypes'][j];
                    for (var k in subType._embedded['ozp:intentActions']) {
                        var action = subType._embedded['ozp:intentActions'][k];
                        var loadPacket = {
                            packet: {
                                resource: action._links.self.href.replace(rootPath, ''),
                                entity: action
                            }
                        };

                        self.parseResource(loadPacket);
                        var def = self.getDefinition(loadPacket.packet);
                        def.set(loadPacket.packet);
                    }
                }
            }
            asyncResponse.resolve("success");
        });

    return asyncResponse;
};

/**
 * Expects the root of an intents data store to be returned from the specified href. Data must be of hal/json
 * type and the stored tree is gathered through the '_links' property.
 *
 * @param config {Object}
 * @param config.href {String}
 * @returns {ozpIwc.AsyncAction}
 */
ozpIwc.IntentsApi.prototype.loadServerData = function (config) {
    var self = this;
    var asyncResponse = new ozpIwc.AsyncAction();
    var counter = {
        types: {
            total: 0,
            received: 0
        },
        subTypes: {
            total: 0,
            received: 0
        },
        actions: {
            total: 0,
            received: 0
        }
    };
    // Get API root
    ozpIwc.util.ajax({
        href: config.href,
        method: "GET"
    })
        .success(function (data) {
            // Take the root path from where the intent data is stored so that we can remove it from each object that
            // becomes a intent value.
            var rootPath = data._links.self.href;

            counter.types.total += data._links['ozp:intentTypes'].length;
            for (var i in data._links['ozp:intentTypes']) {
                ozpIwc.util.ajax({
                    href: data._links['ozp:intentTypes'][i].href,
                    method: "GET"
                })
                    .success(function (data) {
                        counter.types.received++;
                        // Get subTypes
                        counter.subTypes.total += data._links['ozp:intentSubTypes'].length;
                        for (var j in data._links['ozp:intentSubTypes']) {
                            ozpIwc.util.ajax({
                                href: data._links['ozp:intentSubTypes'][j].href,
                                method: "GET"
                            })
                                .success(function (data) {
                                    counter.subTypes.received++;
                                    //Get Actions
                                    counter.actions.total += data._links['ozp:intentActions'].length;
                                    for (var k in data._links['ozp:intentActions']) {
                                        ozpIwc.util.ajax({
                                            href: data._links['ozp:intentActions'][k].href,
                                            method: "GET"
                                        })
                                            .success(function (data) {

                                                counter.actions.received++;
                                                //Build out the API with the retrieved values
                                                var loadPacket = {
                                                    packet: {
                                                        resource: data._links.self.href.replace(rootPath, ''),
                                                        entity: data
                                                    }
                                                };
                                                self.parseResource(loadPacket);
                                                var def = self.getDefinition(loadPacket.packet);
                                                def.set(loadPacket.packet);
                                                if (counter.actions.received === counter.actions.total &&
                                                    counter.subTypes.received === counter.subTypes.total &&
                                                    counter.types.received == counter.types.total) {
                                                    asyncResponse.resolve("success");
                                                }
                                            });
                                    }
                                });
                        }
                    });
            }
        });
    return asyncResponse;
};
