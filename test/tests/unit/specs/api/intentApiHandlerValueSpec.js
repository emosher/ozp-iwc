function intentsApiValueContractTests(classUnderTest, baseConfig) {
    describe("Conforms to the CommonApiValue contract", function () {
        commonApiValueContractTests(classUnderTest);
    });

    var value;
    var config;

    beforeEach(function () {
        config = {
            'contentType': 'application/ozp-intents-handler-v1+json',
            'type': "text/plain",
            'action': "view",
            'icon': "http://example.com/view-text-plain.png",
            'label': "View Plain Text",
            'invokeIntent': "system.api/application/123-412"
        };
        value = new classUnderTest(config);
    });

    describe("Basic Actions", function () {

        var setPacket = {
            'contentType': "application/ozp-intents-handler-v1+json",
            'type': "text/rich",
            'label': "Reverse Rich Text",
            'action': "reverse",
            'icon': "www.example.com/changed_icon.png",
            'invokeIntent': "system.api/application/214-321"
        };

        it("defaults to an empty intent value", function () {
            value = new classUnderTest();
            expect(value.type).toEqual(undefined);
            expect(value.action).toEqual(undefined);
            expect(value.icon).toEqual(undefined);
            expect(value.label).toEqual(undefined);
            expect(value.invokeIntent).toBeUndefined();
        });

        it("updates intent properties on set", function () {
            value.set(setPacket);
            expect(value.type).toEqual(setPacket.type);
            expect(value.action).toEqual(setPacket.action);
            expect(value.icon).toEqual(setPacket.icon);
            expect(value.label).toEqual(setPacket.label);
        });

        it("resets intent properties on deleteData", function () {
            value.deleteData();
            expect(value.type).toBeUndefined();
            expect(value.action).toBeUndefined();
            expect(value.label).toBeUndefined();
            expect(value.icon).toBeUndefined();
            expect(value.invokeIntent).toBeUndefined();
        });

        it("converts intent properties to a packet", function () {
            var packet = value.toPacket();
            expect(packet.type).toEqual(value.type);
            expect(packet.action).toEqual(value.action);
            expect(packet.label).toEqual(value.label);
            expect(packet.icon).toEqual(value.icon);
            expect(packet.handlers).toEqual(value.children);
        });
    });
}

describe("Intent API Handler Value", function () {
    intentsApiValueContractTests(ozpIwc.IntentsApiHandlerValue);
});