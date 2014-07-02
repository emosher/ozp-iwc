function intentsApiCapabilitiesValueContractTests(classUnderTest, baseConfig) {
    describe("Conforms to the CommonApiValue contract", function () {
        commonApiValueContractTests(classUnderTest);
    });

    baseConfig = baseConfig || {};
    var value;
    var config;

    beforeEach(function () {
        config = ozpIwc.util.clone(baseConfig);

        //CommonApiValue
        config.resource = "/text/plain/view/1234";
        config.entity = {};
        config.contentType = "application/ozp-intents-definition-v1+json";
        config.permissions = ['perms'];
        config.version = 1;

        //IntentApiHandlerValue
        config.definitions = [
            "/text/plain/view",
            "/text/plain/reverse"
        ];
        value = new classUnderTest(config);
    });

    describe("Basic Actions", function () {
        var setPacket = {
            definitions: [
                "/text/plain/a",
                "/text/plain/b"
            ]
        };

        it("defaults to an empty intent value", function () {
            value = new classUnderTest();
            expect(value.definitions).toEqual([]);
        });

        it("updates intent properties on set", function () {
            value.set(setPacket);
            expect(value.definitions).toEqual(setPacket.definitions);
        });

        it("resets intent properties on deleteData", function () {
            value.deleteData();
            expect(value.definitions).toEqual([]);
        });

        it("converts intent properties to a packet", function () {
            var packet = value.toPacket();
            expect(packet.definitions).toEqual(value.definitions);
        });
    });

    describe("Collection-like Actions", function() {

        it('pushes and pops definitions', function() {
            value.pushDefinition("/text/plain/a");
            value.pushDefinition("/text/plain/b");
            expect(value.definitions.length).toEqual(4);
            expect(value.popDefinition()).toEqual("/text/plain/b");
            expect(value.definitions.length).toEqual(3);
            expect(value.popDefinition()).toEqual("/text/plain/a");
            expect(value.definitions.length).toEqual(2);
            expect(value.popDefinition()).toEqual("/text/plain/reverse");
            expect(value.definitions.length).toEqual(1);
            expect(value.popDefinition()).toEqual("/text/plain/view");
            expect(value.definitions.length).toEqual(0);
            expect(value.popDefinition()).toEqual(undefined);
        });
        it('unshifts and shifts handlers', function() {
            value.unshiftDefinition("/text/plain/a");
            value.unshiftDefinition("/text/plain/b");
            expect(value.definitions.length).toEqual(4);
            expect(value.shiftDefinition()).toEqual("/text/plain/b");
            expect(value.definitions.length).toEqual(3);
            expect(value.shiftDefinition()).toEqual("/text/plain/a");
            expect(value.definitions.length).toEqual(2);
            expect(value.shiftDefinition()).toEqual("/text/plain/view");
            expect(value.definitions.length).toEqual(1);
            expect(value.shiftDefinition()).toEqual("/text/plain/reverse");
            expect(value.definitions.length).toEqual(0);
            expect(value.shiftDefinition()).toEqual(undefined);

        });
        it('lists handlers', function() {
            var list = value.listDefinitions();
            expect(list.length).toEqual(2);
            expect(list[0]).toEqual(value.definitions[0]);
            expect(list[1]).toEqual(value.definitions[1]);
        });
    });

}

describe("Intent API Capabilities Value", function () {
    intentsApiCapabilitiesValueContractTests(ozpIwc.IntentsApiCapabilitiesValue);
});
