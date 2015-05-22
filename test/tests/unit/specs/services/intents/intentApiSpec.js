describe("Intent API Class", function () {

    var apiBase;
    var oldEndpoints;
    beforeEach(function () {
        oldEndpoints=ozpIwc.endpoint;
        ozpIwc.endpoint=function() {
            return {
                get: function() { return Promise.resolve(); }
            };
        };
        apiBase = new ozpIwc.IntentsApi({
            'participant': new TestParticipant({
                'staticAddress': 'test.address'
            })
        });
    });

    afterEach(function () {
        ozpIwc.endpoint=oldEndpoints;
        apiBase = null;
    });

    it("Sets data types",function() {
        var testPacket=new TestPacketContext({
            'packet': {
                'resource': "/text/plain",
                'action': "set",
                'contentType' : "application/vnd.ozp-iwc-intent-type-v1+json",
                'entity': {
                    'bar':2
                }
            },
            'leaderState': "leader"
        });
        apiBase.routePacket(testPacket);
        expect(testPacket.responses[0].response).toEqual("ok");
    });

    it("Sets intent definitions",function() {
        var testPacket=new TestPacketContext({
            'packet': {
                'resource': "/text/plain/view",
                'action': "set",
                'contentType' : "application/vnd.ozp-iwc-intent-definition-v1+json",
                'entity': {
                    'bar':2
                }
            },
            'leaderState': "leader"
        });
        apiBase.routePacket(testPacket);
        expect(testPacket.responses[0].response).toEqual("ok");
    });

    it("Creating an intent definitions shows up in the content type",function() {
        apiBase.routePacket(new TestPacketContext({
            'packet': {
                'resource': "/text/plain/view",
                'action': "set",
                'contentType' : "application/vnd.ozp-iwc-intent-definition-v1+json",
                'entity': {
                    'bar':2
                }
            },
            'leaderState': "leader"
        }));
        var testPacket=new TestPacketContext({
            'packet': {
                'resource': "/text/plain",
                'action': "get"
            },
            'leaderState': "leader"
        });
        apiBase.routePacket(testPacket);
        expect(testPacket.responses[0].response).toEqual("ok");
        expect(testPacket.responses[0].entity.actions).toContain("/text/plain/view");
    });

    it("Registers handlers",function() {
        var testPacket=new TestPacketContext({
            'packet': {
                'resource': "/text/plain/view",
                'action': "register",
                'contentType' : "application/vnd.ozp-iwc-intent-handler-v1+json",
                'entity': {
                    'bar':2
                }
            },
            'leaderState': "leader"
        });
        apiBase.routePacket(testPacket);
        expect(testPacket.responses[0].response).toEqual("ok");
        expect(testPacket.responses[0].entity.resource).toMatch(/text\/plain\/view\/.*/);
    });

    describe("Invoking handlers",function() {
        var handlerResource;
        var registerPacket;
        beforeEach(function() {
            registerPacket=new TestPacketContext({
                'packet': {
                    'resource': "/text/plain/view",
                    'action': "register",
                    'contentType' : "application/vnd.ozp-iwc-intent-handler-v1+json",
                    'entity': {
                        'type': "text/plain",
                        'action' : "view",
                        'invokeIntent': {
                            dst: "system.api",
                            resource: "/intentHandler",
                            action: "view"
                        }
                    },
                    'msgId': "a:20"
                },
                'leaderState': "leader"
            });

            apiBase.routePacket(registerPacket);
            handlerResource=registerPacket.responses[0].entity.resource;
            expect(handlerResource).toBeDefined();
        });
        it("Invokes handlers directly",function() {
            var testPacket=new TestPacketContext({
                'packet': {
                    'resource': handlerResource,
                    'action': "invoke",
                    'contentType' : "text/plain",
                    'entity': "Some Text"
                },
                'leaderState': "leader"
            });
            apiBase.routePacket(testPacket);

            var invocations = apiBase.data['/ozpIntents/invocations'];
            var invocationResource = invocations.entity[0];
            var invocation = apiBase.data[invocationResource];
            expect(apiBase.participant.sentPackets[0].dst).toEqual(registerPacket.packet.entity.invokeIntent.dst);
            expect(apiBase.participant.sentPackets[0].entity.inFlightIntent).toEqual(invocationResource);
            expect(invocation.entity.intent.type).toEqual(registerPacket.packet.entity.type);
            expect(invocation.entity.intent.action).toEqual(registerPacket.packet.entity.action);
            expect(invocation.entity.entity).toEqual(testPacket.packet.entity);
        });

        it("Handler's return value is forwarded to the invoker",function() {

            var testPacket=new TestPacketContext({
                'packet': {
                    'resource': handlerResource,
                    'action': "invoke",
                    'contentType' : "text/plain",
                    'entity': "Some Text"
                },
                'leaderState': "leader"
            });
            apiBase.routePacket(testPacket);

            var invokePacket=apiBase.participant.sentPackets[0];

            apiBase.participant.receiveFromRouter(new TestPacketContext({
                'packet': {
                    'src': "fakeHandler",
                    'dst': 'test.address',
                    'response': "ok",
                    'replyTo': invokePacket.msgId,
                    'contentType' : "text/winnar",
                    'entity': "You won!"
                },
                'leaderState': "leader"
            }));

            var fowardedPacket=testPacket.responses[0];
            expect(fowardedPacket.contentType).toEqual("text/winnar");
            expect(fowardedPacket.entity).toEqual("You won!");

        });

        describe("In-Flight-Intents",function(){
            // Prevent the pop-up for the intent chooser.
            ozpIwc.util.openWindow = function(){};

            var testPacket=new TestPacketContext({
                'packet': {
                    'resource': "/text/plain/view",
                    'action': "invoke",
                    'contentType' : "text/plain",
                    'entity': "Some Text"
                },
                'leaderState': "leader"
            });


            var getChoosingPacket=function(invocation){
                return new TestPacketContext({
                    'packet': {
                        'resource':invocation.resource,
                        'action': "set",
                        'dst': 'intents.api',
                        'contentType' : invocation.contentType,
                        entity: {
                            resource: handlerResource,
                            reason: "user",
                            state: "choosing"
                        }
                    },
                    'leaderState': "leader"
                });
            };

            var getRunningPacket =function(invocation){
                return new TestPacketContext({
                    'packet': {
                        'resource':invocation.resource,
                        'action': "set",
                        'dst': 'intents.api',
                        'contentType' : invocation.contentType,
                        entity: {
                            resource: handlerResource,
                            address: "randomAddress",
                            state: "running"
                        }
                    },
                    'leaderState': "leader"
                });
            };
            var getCompletePacket =function(invocation){
                return new TestPacketContext({
                    'packet': {
                        'resource':invocation.resource,
                        'action': "set",
                        'dst': 'intents.api',
                        'contentType' : invocation.contentType,
                        entity: {
                            reply:{
                                'contentType':registerPacket.packet.entity.type,
                                'entity': "SOME RESPONSE"
                            },
                            state: "complete"
                        }
                    },
                    'leaderState': "leader"
                });
            };
            var getFailPacket =function(invocation){
                return new TestPacketContext({
                    'packet': {
                        'resource':invocation.resource,
                        'action': "set",
                        'dst': 'intents.api',
                        'contentType' : invocation.contentType,
                        entity: {
                            reply:{
                                'contentType':registerPacket.packet.entity.type,
                                'entity': "SOME FAILED RESPONSE"
                            },
                            state: "fail"
                        }
                    },
                    'leaderState': "leader"
                });
            };

            it("creates an /ozpIntents/invocations resource for in flight intents",function(){
                var invocations = apiBase.data['/ozpIntents/invocations'];
                expect(invocations.entity.length).toEqual(0);
                apiBase.routePacket(testPacket);
                expect(invocations.entity.length).toEqual(1);
            });

            it("directly invokes a handler if there is only 1 to choose from",function (){
                var invocations = apiBase.data['/ozpIntents/invocations'];
                apiBase.routePacket(testPacket);
                var invocation = apiBase.data[invocations.entity[0]];

                expect(invocation.entity.handlerChoices.length).toEqual(1);

                expect(invocation.entity.handlerChosen.resource).toEqual(handlerResource);
                expect(invocation.entity.handlerChosen.reason).toEqual("onlyOne");

                expect(invocation.entity.state).toEqual("delivering");
            });

            it("prompts the user to choose when multiple handlers available",function (){
                var invocations = apiBase.data['/ozpIntents/invocations'];

                apiBase.routePacket(registerPacket);

                apiBase.routePacket(testPacket);
                var invocation = apiBase.data[invocations.entity[0]];
                expect(invocation.entity.handlerChoices.length).toEqual(2);
                expect(invocation.entity.state).toEqual("choosing");
            });

            it("invokes a chosen handler",function (){
                apiBase.routePacket(registerPacket);
                apiBase.routePacket(testPacket);
                var invocations = apiBase.data['/ozpIntents/invocations'];
                var invocation = apiBase.data[invocations.entity[0]];
                var choosingPacket = getChoosingPacket(invocation);

                apiBase.routePacket(choosingPacket);
                expect(invocation.entity.handlerChosen.resource).toEqual(choosingPacket.packet.entity.resource);
                expect(invocation.entity.handlerChosen.reason).toEqual(choosingPacket.packet.entity.reason);

                expect(invocation.entity.state).toEqual("delivering");
            });

            it("receives confirmation that the desired handler has received the invocation",function (){
                apiBase.routePacket(registerPacket);
                apiBase.routePacket(testPacket);
                var invocations = apiBase.data['/ozpIntents/invocations'];
                var invocation = apiBase.data[invocations.entity[0]];
                apiBase.routePacket( getChoosingPacket(invocation));
                var runningPacket = getRunningPacket(invocation);

                apiBase.routePacket(runningPacket);
                console.log(testPacket);
                expect(invocation.entity.handler.address).toEqual(runningPacket.packet.entity.address);
                expect(invocation.entity.handler.resource).toEqual(runningPacket.packet.entity.resource);
                expect(invocation.entity.state).toEqual("running");
            });

            it("receives notification that the desired handler has received the completed handling the invocation",function (){
                apiBase.handleDelete = function(){};

                apiBase.routePacket(registerPacket);
                apiBase.routePacket(testPacket);

                var invocations = apiBase.data['/ozpIntents/invocations'];
                var invocation = apiBase.data[invocations.entity[0]];
                var invocationResource = invocation.resource;

                apiBase.routePacket( getChoosingPacket(invocation));
                apiBase.routePacket(getRunningPacket(invocation));

                var completePacket = getCompletePacket(invocation);
                apiBase.routePacket(completePacket);

                expect(apiBase.data[invocationResource].entity.reply.contentType).toEqual(completePacket.packet.entity.reply.contentType);
                expect(apiBase.data[invocationResource].entity.reply.entity).toEqual(completePacket.packet.entity.reply.entity);
                expect(apiBase.data[invocationResource].entity.state).toEqual(completePacket.packet.entity.state);

            });

            it("notifies the invoker of failure",function (){
                apiBase.handleDelete = function(){};

                apiBase.routePacket(registerPacket);
                apiBase.routePacket(testPacket);

                var invocations = apiBase.data['/ozpIntents/invocations'];
                var invocation = apiBase.data[invocations.entity[0]];
                var invocationResource = invocation.resource;

                apiBase.routePacket( getChoosingPacket(invocation));
                apiBase.routePacket(getRunningPacket(invocation));

                var failPacket = getFailPacket(invocation);
                apiBase.routePacket(failPacket);

                expect(apiBase.data[invocationResource].entity.reply.contentType).toEqual(failPacket.packet.entity.reply.contentType);
                expect(apiBase.data[invocationResource].entity.reply.entity).toEqual(failPacket.packet.entity.reply.entity);
                expect(apiBase.data[invocationResource].entity.state).toEqual(failPacket.packet.entity.state);

            });
        });
    });
});