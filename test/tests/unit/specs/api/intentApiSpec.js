describe("Intent API Class", function () {

    var apiBase;

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
            var capability = apiBase.getCapability(apiBase.parseResource('/a/b'));
            expect(capability).not.toEqual(undefined);
            expect(capability.resource).toEqual('/a/b');
            expect(capability.definitions).toEqual([]);
        });

        it('gets a definition from a resource', function () {
            var definition = apiBase.getDefinition(apiBase.parseResource('/a/b/c'));
            expect(definition).not.toEqual(undefined);
            expect(definition.resource).toEqual('/a/b/c');
            expect(definition.handlers).toEqual([]);
        });

        it('gets a handler from a resource', function () {
            var definition = apiBase.getHandler(apiBase.parseResource('/a/b/c/d'));
            expect(definition).not.toEqual(undefined);
            expect(definition.resource).toEqual('/a/b/c/d');
            expect(definition.invokeIntent).toEqual(undefined);
        });

        it('creates a capability when it does not exist', function () {
            expect(apiBase.data['/a/b']).toEqual(undefined);

            apiBase.makeValue({ resource: '/a/b'});

            var capability = apiBase.data['/a/b'];

            expect(capability).not.toEqual(undefined);
            expect(capability).not.toEqual(undefined);
        });

        it('creates a definition and capability when the definition/capability do not exist', function () {
            expect(apiBase.data['/a/b']).toEqual(undefined);
            expect(apiBase.data['/a/b/c']).toEqual(undefined);

            apiBase.makeValue({resource: '/a/b/c'});

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

            apiBase.makeValue({resource: '/a/b/c/d'});

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
            apiBase.makeValue({resource: '/a/b/c'});

            var capability = apiBase.data['/a/b'];

            expect(capability.definitions).toEqual(['/a/b/c']);
        });

        it('registers a handler to its corresponding definition when constructed', function () {
            apiBase.makeValue({resource: '/a/b/c/d'});

            var capability = apiBase.data['/a/b'];
            var definition = apiBase.data['/a/b/c'];

            expect(capability.definitions).toEqual(['/a/b/c']);
            expect(definition.handlers).toEqual(['/a/b/c/d']);
        });

        it('can have multiple definitions per capability', function () {
            apiBase.makeValue({resource: '/a/b/c'});
            apiBase.makeValue({resource: '/a/b/d'});

            var capability = apiBase.data['/a/b'];

            expect(capability.definitions).toEqual(['/a/b/c', '/a/b/d']);

        });

        it('can have multiple handlers per definition', function () {
            apiBase.makeValue({resource: '/a/b/c/d'});
            apiBase.makeValue({resource: '/a/b/c/e'});

            var definition = apiBase.data['/a/b/c'];

            expect(definition.handlers).toEqual(['/a/b/c/d', '/a/b/c/e']);
        });
    });

    describe("Actions", function () {
        var handlerNode, definitionNode, capabilityNode;
        beforeEach(function () {
            handlerNode = new ozpIwc.IntentsApiHandlerValue({
                resource: '/a/b/c/d',
                type: '/a/b',
                action: 'c',
                icon: 'handlerIcon.png',
                label: 'this is a handler label',
                invokeIntent: 'system.api/application/notepad/1234'
            });

            definitionNode = new ozpIwc.IntentsApiDefinitionValue({
                resource: '/a/b/c',
                type: '/a/b',
                action: 'c',
                icon: 'definitionIcon.png',
                label: 'this is a definition label',
                handlers: ['/a/b/c/d']
            });

            capabilityNode = new ozpIwc.IntentsApiCapabilityValue({
                resource: '/a/b',
                definitions: ['/a/b/c']
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
            expect(handlerNode.type).toEqual(packetContext.packet.entity.type);
            expect(handlerNode.action).toEqual(packetContext.packet.entity.action);
            expect(handlerNode.icon).toEqual(packetContext.packet.entity.icon);
            expect(handlerNode.label).toEqual(packetContext.packet.entity.label);
            expect(handlerNode.invokeIntent).toEqual(packetContext.packet.entity.invokeIntent);
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
            expect(packetContext.responses[0].type).toEqual(handlerNode.type);
            expect(packetContext.responses[0].action).toEqual(handlerNode.action);
            expect(packetContext.responses[0].icon).toEqual(handlerNode.icon);
            expect(packetContext.responses[0].label).toEqual(handlerNode.label);
            expect(packetContext.responses[0].invokeIntent).toEqual(handlerNode.invokeIntent);

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
            var packetContext = new TestPacketContext({
                packet: {
                    resource: "/a/b/c/d",
                    action: "register",
                    entity: {
                        type: '/b/c',
                        action: 'd',
                        icon: 'differentIcon.png',
                        label: 'this is a different handler label',
                        invokeIntent: '/system.api/application/padnote/1234'
                    }
                }
            });

            apiBase.handleRegister(handlerNode, packetContext);

            expect(handlerNode.type).toEqual(packetContext.packet.entity.type);
            expect(handlerNode.action).toEqual(packetContext.packet.entity.action);
            expect(handlerNode.icon).toEqual(packetContext.packet.entity.icon);
            expect(handlerNode.label).toEqual(packetContext.packet.entity.label);
            expect(handlerNode.invokeIntent).toEqual(packetContext.packet.entity.invokeIntent);

            expect(definitionNode.handlers).toEqual([handlerNode.resource]);
            expect(capabilityNode.definitions).toEqual([definitionNode.resource]);
        });

        it('can handle unregister actions', function () {
            var packetContext = new TestPacketContext({
                packet: {
                    resource: "/a/b/c/d",
                    action: "register",
                    entity: {
                        type: '/b/c',
                        action: 'd',
                        icon: 'differentIcon.png',
                        label: 'this is a different handler label',
                        invokeIntent: '/system.api/application/padnote/1234'
                    }
                }
            });

            apiBase.handleRegister(handlerNode, packetContext);

            var packetContext = new TestPacketContext({
                packet: {
                    resource: '/a/b/c/d',
                    action: 'unregister'
                }
            });

            apiBase.handleUnregister(handlerNode, packetContext);
            expect(definitionNode.handlers).toEqual([]);

        });

        it('can generate handler keys if not specified when registering', function() {
            var packetContext = new TestPacketContext({
                packet: {
                    resource: "/a/b/c",
                    action: "register",
                    entity: {
                        type: '/b/c',
                        action: 'd',
                        icon: 'differentIcon.png',
                        label: 'this is a different handler label',
                        invokeIntent: '/system.api/application/padnote/1234'
                    }
                }
            });

            definitionNode.deleteData();
            apiBase.handleRegister(definitionNode, packetContext);
            expect(packetContext.responses[0])
                .toEqual(jasmine.objectContaining({
                    'action': "ok"
                }));

            var handlerResource = packetContext.responses[0].entity;
            handlerNode = apiBase.data[handlerResource];
            expect(handlerNode.resource).toEqual(definitionNode.handlers[0]);

        });
        it('can invoke specified intent handlers', function () {
            var packetContext = new TestPacketContext({
                packet: {
                    resource: "/a/b/c/d",
                    action: "register",
                    entity: {
                        type: '/b/c',
                        action: 'd',
                        icon: 'differentIcon.png',
                        label: 'this is a different handler label',
                        invokeIntent: '/system.api/application/padnote/1234'
                    }
                }
            });

            apiBase.handleRegister(handlerNode, packetContext);

            var packetContext = new TestPacketContext({
                packet: {
                    resource: '/a/b/c/d',
                    action: 'unregister'
                }
            });

            apiBase.handleInvoke(handlerNode, packetContext);
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