/**
 * Network Integration
 */


describe("System API", function() {
    var client;
    var participant;
    beforeEach(function(done) {
        client = new ozpIwc.Client({
            peerUrl: "http://" + window.location.hostname + ":14002"
        });
        participant = new ozpIwc.test.MockParticipant({
            clientUrl: "http://localhost:14001",
            'client': client
        });

        var gate = ozpIwc.testUtil.doneSemaphore(2, done);

        participant.on("connected", gate);
        client.connect().then(gate, gate);
    });

    afterEach(function() {
        client.disconnect();
        participant.close();
    });

    it("has pretty name and email in /user", function(done) {
        client.api("system.api").get("/user")
            .then(function(reply) {
                expect(reply.response).toEqual("ok");
                expect(reply.entity).toBeDefined();
                done();
            })['catch'](function(error) {
                expect(error).toEqual("Should not happen");
                done();
            });
    });
    it("has system version in /system", function(done) {
        client.api("system.api").get("/system")
            .then(function(reply) {
                expect(reply.response).toEqual("ok");
                expect(reply.entity).toBeDefined();
                done();
            })['catch'](function(error) {
                expect(error).toEqual("Should not happen");
                done();
            });

    });
    it("lists the sampleData applications at /application", function(done) {
        client.api("system.api").get("/application")
            .then(function(reply) {
                expect(reply.response).toEqual("ok");
                expect(reply.entity).toContain("/application/94c734b0-cbbb-4caf-9cb8-29a3d45afc84");
                expect(reply.entity).toContain("/application/25a3d034-31f1-4dbe-b9b4-03c8dad7b5f8");
                expect(reply.entity).toContain("/application/bf9b3b6a-b7cb-4f65-8923-e371e9165e23");
                expect(reply.entity).toContain("/application/aa026e7e-ca5c-4d4f-919d-721f249e6e09");
                expect(reply.entity).toContain("/application/8e8265bb-fef8-49ab-8b13-2356a1647b6b");
                expect(reply.entity).toContain("/application/f084e827-ce8d-4f2c-97f8-13eba94ae889");
                done();
            })['catch'](function(error) {
                expect(error).toEqual("Should not happen");
                done();
            });

    });

    ["/application/1234", "/user", "/system"].forEach(function(resource) {
        it("denies set on " + resource, function(done) {
            client.api("system.api").set(resource, {entity: "blah"})
                .then(function(reply) {
                    expect(reply).toEqual("Should not happen");
                    done();
                })['catch'](function(error) {
                    expect(error.response).toEqual("badAction");
                    done();
                });
        });

        it("denies delete on " + resource, function(done) {
            client.api("system.api").delete(resource, {entity: "blah"})
                .then(function(reply) {
                    expect(reply).toEqual("Should not happen");
                    done();
                })['catch'](function(error) {
                    expect(error.response).toEqual("badAction");
                    done();
                });
        });
    });
    
    pit("registers for the intent run /application/vnd.ozp-iwc-launch-data-v1+json/run/system.api",function() {
        return client.api("intents.api").get("/application/vnd.ozp-iwc-launch-data-v1+json/run/system.api")
            .then(function(reply) {
                expect(reply.response).toEqual("ok");
                expect(reply.entity.invokeIntent).toBeDefined();
                expect(reply.entity.invokeIntent.action).toEqual("invoke");
                expect(reply.entity.invokeIntent.dst).toEqual("system.api");
        });
    });
    pit("launch on system.api invokes the intent run /application/vnd.ozp-iwc-launch-data-v1+json/run/system.api",function() {
        // hijack the system.api's intent registration so that we get it
       return client.api("intents.api").set("/application/vnd.ozp-iwc-launch-data-v1+json/run/system.api",{
            contentType: "application/vnd.ozp-iwc-intent-handler-v1+json",
            resource: "/application/vnd.ozp-iwc-launch-data-v1+json/run/system.api",
            entity: {
                label: "Launch in New Window",
                invokeIntent: {
                    dst: client.address,
                    action: "invoke",
                    resource: ""
                }
            }
        }).then(function(reply) {
            expect(reply.response).toEqual("ok");
            return Promise.all([
                client.api("system.api").launch("/application/8e8265bb-fef8-49ab-8b13-2356a1647b6b",{
                    entity: { "foo": 123 }
                }),
                new Promise(function(resolve,reject) {
                    client.on("receive",function(packet) {
                        if(packet.src==="intents.api" && packet.resource==="") {
                            resolve(packet);
                        }
                    });
                })
            ]);
        }).then(function(replies) {
            var intentsPacket=replies[1];
            expect(intentsPacket.entity.inFlightIntent).toBeDefined();
            return client.api("intents.api").get(intentsPacket.entity.inFlightIntent);
        }).then(function(reply) {
            expect(reply.entity).toEqual(jasmine.objectContaining({
                "entity": { 
                    "url": "http://localhost:15004/", 
                    "applicationId": "/application/8e8265bb-fef8-49ab-8b13-2356a1647b6b",
                    "id": "8e8265bb-fef8-49ab-8b13-2356a1647b6b",
                    "launchData": { "foo": 123 } 
                }
            }));
        });
    });
});
