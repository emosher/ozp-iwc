function intentsApiDefinitionValueContractTests(classUnderTest, baseConfig) {
    describe("Conforms to the Common API contract", function () {
        commonApiValueContractTests(classUnderTest);
    });

    baseConfig = baseConfig || {};
    var value;
    var config;

    beforeEach(function () {
        config = ozpIwc.util.clone(baseConfig);

        //CommonApiValue
        config.resource= "/text/plain/view/1234";
        config.entity= {};
        config.contentType= "application/ozp-intents-definition-v1+json";
        config.permissions= ['perms'];
        config.version= 1;

        //IntentApiHandlerValue
        config.type = "text/plain";
        config.action = "view";
        config.icon = "http://example.com/view-text-plain.png";
        config.label = "View Plain Text";
        config.handlers =  [
            "/text/plain/view/1234",
            "/text/plain/view/4321"
        ];

        value = new classUnderTest(config);
    });

    describe("Basic Actions", function () {

        var setPacket = {
            'contentType': "testContentType",
            'type': "text/rich",
            'action': "reverse",
            'icon': "www.example.com/changed_icon.png",
            'label': "Reverse Rich Text"
        };

        it("defaults to an empty intent value", function () {
            value = new classUnderTest();
            expect(value.type).toEqual(undefined);
            expect(value.action).toEqual(undefined);
            expect(value.icon).toEqual(undefined);
            expect(value.label).toEqual(undefined);
            expect(value.handlers).toEqual([]);
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
            expect(value.handlers).toEqual([]);
        });

        it("converts intent properties to a packet", function () {
            var packet = value.toPacket();
            expect(packet.type).toEqual(value.type);
            expect(packet.action).toEqual(value.action);
            expect(packet.label).toEqual(value.label);
            expect(packet.icon).toEqual(value.icon);
            expect(packet.handlers).toEqual(value.handlers);
        });
    });

    describe("Collection-like Actions", function() {

        it('pushes and pops handlers', function() {
            value.pushHandler("/text/plain/view/1");
            value.pushHandler("/text/plain/view/2");
            expect(value.handlers.length).toEqual(4);
            expect(value.popHandler()).toEqual("/text/plain/view/2");
            expect(value.handlers.length).toEqual(3);
            expect(value.popHandler()).toEqual("/text/plain/view/1");
            expect(value.handlers.length).toEqual(2);
            expect(value.popHandler()).toEqual("/text/plain/view/4321");
            expect(value.handlers.length).toEqual(1);
            expect(value.popHandler()).toEqual("/text/plain/view/1234");
            expect(value.handlers.length).toEqual(0);
            expect(value.popHandler()).toEqual(undefined);
        });
        it('unshifts and shifts handlers', function() {
            value.unshiftHandler("/text/plain/view/1");
            value.unshiftHandler("/text/plain/view/2");
            expect(value.handlers.length).toEqual(4);
            expect(value.shiftHandler()).toEqual("/text/plain/view/2");
            expect(value.handlers.length).toEqual(3);
            expect(value.shiftHandler()).toEqual("/text/plain/view/1");
            expect(value.handlers.length).toEqual(2);
            expect(value.shiftHandler()).toEqual("/text/plain/view/1234");
            expect(value.handlers.length).toEqual(1);
            expect(value.shiftHandler()).toEqual("/text/plain/view/4321");
            expect(value.handlers.length).toEqual(0);
            expect(value.shiftHandler()).toEqual(undefined);

        });
        it('lists handlers', function() {
            var list = value.listHandlers();
            expect(list.length).toEqual(2);
            expect(list[0]).toEqual(value.handlers[0]);
            expect(list[1]).toEqual(value.handlers[1]);
        });
    });
}

describe("Intent API Definition Value", function () {
    intentsApiDefinitionValueContractTests(ozpIwc.IntentsApiDefinitionValue);
});