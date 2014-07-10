describe("Intent API Class", function () {

    var apiBase;

    var generatePacketContext = function (config) {
        var packetContext = new TestPacketContext({
            'packet': {
                'resource': config.resource,
                'action': config.action,
                'entity': {},
                'contentType': "application/fake+json"
            }
        });

        ozpIwc.IntentsApi.prototype.parseResource(packetContext);

        return packetContext;
    };

    beforeEach(function () {
        jasmine.addMatchers(customMatchers);
        jasmine.clock().install();

        apiBase = new ozpIwc.IntentsApi({
            'participant': new TestParticipant()
        });
    });

    afterEach(function () {
        apiBase = null;
    });
    describe("Data Structure", function () {
        it('gets a capability from a resource', function () {
            var capability = apiBase.getCapability(generatePacketContext({resource: '/a/b'}).packet);
            expect(capability).not.toEqual(undefined);
            expect(capability.resource).toEqual('/a/b');
            expect(capability.entity).toEqual(undefined);
        });

        it('gets a definition from a resource', function () {
            var definition = apiBase.getDefinition(generatePacketContext({resource: '/a/b/c'}).packet);
            expect(definition).not.toEqual(undefined);
            expect(definition.resource).toEqual('/a/b/c');
            expect(definition.entity).toEqual(undefined);
        });

        it('gets a handler from a resource', function () {
            var definition = apiBase.getHandler(generatePacketContext({resource: '/a/b/c/d'}).packet);
            expect(definition).not.toEqual(undefined);
            expect(definition.resource).toEqual('/a/b/c/d');
            expect(definition.entity).toEqual(undefined);
        });

        it('creates a capability when it does not exist', function () {
            expect(apiBase.data['/a/b']).toEqual(undefined);

            apiBase.makeValue(generatePacketContext({resource: '/a/b'}).packet);

            var capability = apiBase.data['/a/b'];

            expect(capability).not.toEqual(undefined);
        });

        it('creates a definition and capability when the definition/capability do not exist', function () {
            expect(apiBase.data['/a/b']).toEqual(undefined);
            expect(apiBase.data['/a/b/c']).toEqual(undefined);

            apiBase.makeValue(generatePacketContext({resource: '/a/b/c'}).packet);

            var capability = apiBase.data['/a/b'];
            var definition = apiBase.data['/a/b/c'];

            expect(capability).not.toEqual(undefined);
            expect(capability.resource).toEqual('/a/b');

            expect(definition).not.toEqual(undefined);
            expect(definition.resource).toEqual('/a/b/c');
        });

        it('creates a handler, definition, and capability when the handler/definition/capability does not exist', function () {
            expect(apiBase.data['/a/b']).toEqual(undefined);
            expect(apiBase.data['/a/b/c']).toEqual(undefined);
            expect(apiBase.data['/a/b/c/d']).toEqual(undefined);

            apiBase.makeValue(generatePacketContext({resource: '/a/b/c/d'}).packet);

            var capability = apiBase.data['/a/b'];
            var definition = apiBase.data['/a/b/c'];
            var handler = apiBase.data['/a/b/c/d'];

            expect(capability).not.toEqual(undefined);
            expect(capability.resource).toEqual('/a/b');

            expect(definition).not.toEqual(undefined);
            expect(definition.resource).toEqual('/a/b/c');

            expect(handler).not.toEqual(undefined);
            expect(handler.resource).toEqual('/a/b/c/d');
        });

        it('registers a definition to its corresponding capability when constructed', function () {
            apiBase.makeValue(generatePacketContext({resource: '/a/b/c'}).packet);

            var capability = apiBase.data['/a/b'];

            expect(capability.entity.definitions).toEqual(['/a/b/c']);
        });

        it('registers a handler to its corresponding definition when constructed', function () {
            apiBase.makeValue(generatePacketContext({resource: '/a/b/c/d'}).packet);

            var capability = apiBase.data['/a/b'];
            var definition = apiBase.data['/a/b/c'];

            expect(capability.entity.definitions).toEqual(['/a/b/c']);
            expect(definition.entity.handlers).toEqual(['/a/b/c/d']);
        });

        it('can have multiple definitions per capability', function () {
            apiBase.makeValue(generatePacketContext({resource: '/a/b/c'}).packet);
            apiBase.makeValue(generatePacketContext({resource: '/a/b/d'}).packet);

            var capability = apiBase.data['/a/b'];

            expect(capability.entity.definitions).toEqual(['/a/b/c', '/a/b/d']);

        });

        it('can have multiple handlers per definition', function () {
            apiBase.makeValue(generatePacketContext({resource: '/a/b/c/d'}).packet);
            apiBase.makeValue(generatePacketContext({resource: '/a/b/c/e'}).packet);

            var definition = apiBase.data['/a/b/c'];

            expect(definition.entity.handlers).toEqual(['/a/b/c/d', '/a/b/c/e']);
        });
    });

    describe("Actions", function () {
        var handlerNode, definitionNode, capabilityNode;
        beforeEach(function () {
            handlerNode = new ozpIwc.IntentsApiHandlerValue({
                resource: '/a/b/c/d',
                entity: {
                    type: '/a/b',
                    action: 'c',
                    icon: 'handlerIcon.png',
                    label: 'this is a handler label',
                    invokeIntent: 'system.api/application/notepad/1234'
                }
            });

            definitionNode = new ozpIwc.IntentsApiDefinitionValue({
                resource: '/a/b/c',
                entity: {
                    type: '/a/b',
                    action: 'c',
                    icon: 'definitionIcon.png',
                    label: 'this is a definition label',
                    handlers: ['/a/b/c/d']
                }
            });

            capabilityNode = new ozpIwc.IntentsApiCapabilityValue({
                resource: '/a/b',
                entity: {
                    definitions: ['/a/b/c']
                }
            });

            apiBase.data['/a/b'] = capabilityNode;
            apiBase.data['/a/b/c'] = definitionNode;
            apiBase.data['/a/b/c/d'] = handlerNode;

        });

        it('can handle set actions', function () {
            var packetContext = new TestPacketContext({
                packet: {
                    resource: "/a/b/c/d",
                    action: "set",
                    entity: {
                        type: '/b/c',
                        action: 'd',
                        icon: 'differentIcon.png',
                        label: 'this is a different handler label',
                        invokeIntent: '/system.api/application/padnote/1234'
                    }
                }
            });

            apiBase.handleSet(handlerNode, packetContext);
            expect(packetContext.responses[0])
                .toEqual(jasmine.objectContaining({
                    'action': "ok"
                }));
            expect(handlerNode.entity.type).toEqual(packetContext.packet.entity.type);
            expect(handlerNode.entity.action).toEqual(packetContext.packet.entity.action);
            expect(handlerNode.entity.icon).toEqual(packetContext.packet.entity.icon);
            expect(handlerNode.entity.label).toEqual(packetContext.packet.entity.label);
            expect(handlerNode.entity.invokeIntent).toEqual(packetContext.packet.entity.invokeIntent);
        });

        it('can handle get actions', function () {
            var packetContext = new TestPacketContext({
                packet: {
                    resource: "/a/b/c/d",
                    action: "get"
                }
            });

            apiBase.handleGet(handlerNode, packetContext);
            console.log(packetContext.responses[0]);
            expect(packetContext.responses[0].entity.type).toEqual(handlerNode.entity.type);
            expect(packetContext.responses[0].entity.action).toEqual(handlerNode.entity.action);
            expect(packetContext.responses[0].entity.icon).toEqual(handlerNode.entity.icon);
            expect(packetContext.responses[0].entity.label).toEqual(handlerNode.entity.label);
            expect(packetContext.responses[0].entity.invokeIntent).toEqual(handlerNode.entity.invokeIntent);

        });

        it('can handle delete actions', function () {
            var packetContext = new TestPacketContext({
                packet: {
                    resource: "/a/b/c/d",
                    action: "set",
                    entity: {
                        type: '/b/c',
                        action: 'd',
                        icon: 'differentIcon.png',
                        label: 'this is a different handler label',
                        invokeIntent: '/system.api/application/padnote/1234'
                    }
                }
            });

            apiBase.handleSet(handlerNode, packetContext);

            var packetContext = new TestPacketContext({
                packet: {
                    resource: '/a/b/c/d',
                    action: 'delete'
                }
            });

            apiBase.handleDelete(handlerNode, packetContext);
            expect(packetContext.responses[0])
                .toEqual(jasmine.objectContaining({
                    'action': "ok"
                }));
            expect(handlerNode.type).toBeUndefined();
            expect(handlerNode.action).toBeUndefined();
            expect(handlerNode.label).toBeUndefined();
            expect(handlerNode.icon).toBeUndefined();
            expect(handlerNode.invokeIntent).toBeUndefined();
        });

        it('can handle register actions', function () {
            var packetContext = generatePacketContext({
                resource: "/a/b/c/d",
                action: "register"
            });
            apiBase.handleRegister(handlerNode, packetContext);

            expect(handlerNode.type).toEqual(packetContext.packet.entity.type);
            expect(handlerNode.action).toEqual(packetContext.packet.entity.action);
            expect(handlerNode.icon).toEqual(packetContext.packet.entity.icon);
            expect(handlerNode.label).toEqual(packetContext.packet.entity.label);
            expect(handlerNode.invokeIntent).toEqual(packetContext.packet.entity.invokeIntent);

            expect(definitionNode.entity.handlers).toEqual([handlerNode.resource]);
            expect(capabilityNode.entity.definitions).toEqual([definitionNode.resource]);
        });

        it('can handle unregister actions', function () {
            var packetContext = generatePacketContext({
                resource: "/a/b/c/d",
                action: 'register'
            });
            apiBase.handleRegister(handlerNode, packetContext);

            var unregPacketContext = generatePacketContext({
                resource: "/a/b/c/d",
                action: 'unregister'
            });

            apiBase.handleUnregister(handlerNode, unregPacketContext);
            expect(definitionNode.entity.handlers).toEqual([]);

        });

        it('can generate handler keys if not specified when registering', function () {
            var packetContext = generatePacketContext({
                resource: "/a/b/c",
                action: 'register'
            });

            definitionNode.deleteData();
            apiBase.handleRegister(definitionNode, packetContext);
            expect(packetContext.responses[0])
                .toEqual(jasmine.objectContaining({
                    'action': "ok"
                }));

            var handlerResource = packetContext.responses[0].entity;
            handlerNode = apiBase.data[handlerResource];
            expect(handlerNode.resource).toEqual(definitionNode.entity.handlers[0]);

        });

        it('can invoke specified intent handlers', function () {
            var packetContext = generatePacketContext({
                resource: "/a/b/c/d",
                action: "register"
            });

            apiBase.handleRegister(handlerNode, packetContext);

            var invokePacketContext = generatePacketContext({
                resource: '/a/b/c/d',
                action: 'invoke'
            });

            apiBase.handleInvoke(handlerNode, invokePacketContext);
        });

        xit('can invoke an intent and get handler specification from the user', function () {

        });

        xit('can invoke an intent and get handler specification from a stored preference', function () {

        });

        xit('can handle broadcast actions', function () {

        });

        xit('can handle invoke actions', function () {

        });
    });
});