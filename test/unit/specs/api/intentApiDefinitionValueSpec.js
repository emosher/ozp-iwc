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
        config.resource = "/text/plain/view/1234";
        config.contentType = "application/ozp-intents-definition-v1+json";
        config.permissions = ['perms'];
        config.version = 1;

        //IntentApiHandlerValue
        config.entity = {
            type: "text/plain",
            action: "view",
            icon: "http://example.com/view-text-plain.png",
            label: "View Plain Text",
            handlers: [
                "/text/plain/view/1234",
                "/text/plain/view/4321"
            ]
        };

        value = new classUnderTest(config);
    });

    describe("Basic Actions", function () {

        var setPacket = {
            'contentType': "testContentType",
            'entity': {
                'type': "text/rich",
                'action': "reverse",
                'icon': "www.example.com/changed_icon.png",
                'label': "Reverse Rich Text"
            }
        };

        xit("defaults to an empty intent value", function () {
            value = new classUnderTest();
            expect(value.type).toEqual(undefined);
            expect(value.response).toEqual(undefined);
            expect(value.icon).toEqual(undefined);
            expect(value.label).toEqual(undefined);
            expect(value.handlers).toEqual([]);
        });

        it("updates intent properties on set", function () {
            value.set(setPacket);
            expect(value.entity).toEqual(setPacket.entity);
        });

        xit("resets intent properties on deleteData", function () {
            value.deleteData();
            expect(value.entity.type).toBeUndefined();
            expect(value.entity.action).toBeUndefined();
            expect(value.entity.label).toBeUndefined();
            expect(value.entity.icon).toBeUndefined();
            expect(value.entity.handlers).toEqual(undefined);
        });

        it("converts intent properties to a packet", function () {
            var packet = value.toPacket();
            expect(packet.entity).toEqual(value.entity);
        });
    });

    describe("Collection-like Actions", function () {

        it('pushes and pops handlers', function () {
            value.pushHandler("/text/plain/view/1");
            value.pushHandler("/text/plain/view/2");
            expect(value.entity.handlers.length).toEqual(4);
            expect(value.popHandler()).toEqual("/text/plain/view/2");
            expect(value.entity.handlers.length).toEqual(3);
            expect(value.popHandler()).toEqual("/text/plain/view/1");
            expect(value.entity.handlers.length).toEqual(2);
            expect(value.popHandler()).toEqual("/text/plain/view/4321");
            expect(value.entity.handlers.length).toEqual(1);
            expect(value.popHandler()).toEqual("/text/plain/view/1234");
            expect(value.entity.handlers.length).toEqual(0);
            expect(value.popHandler()).toEqual(undefined);
        });
        it('unshifts and shifts handlers', function () {
            value.unshiftHandler("/text/plain/view/1");
            value.unshiftHandler("/text/plain/view/2");
            expect(value.entity.handlers.length).toEqual(4);
            expect(value.shiftHandler()).toEqual("/text/plain/view/2");
            expect(value.entity.handlers.length).toEqual(3);
            expect(value.shiftHandler()).toEqual("/text/plain/view/1");
            expect(value.entity.handlers.length).toEqual(2);
            expect(value.shiftHandler()).toEqual("/text/plain/view/1234");
            expect(value.entity.handlers.length).toEqual(1);
            expect(value.shiftHandler()).toEqual("/text/plain/view/4321");
            expect(value.entity.handlers.length).toEqual(0);
            expect(value.shiftHandler()).toEqual(undefined);

        });
        it('lists handlers', function () {
            var list = value.listHandlers();
            expect(list.length).toEqual(2);
            expect(list[0]).toEqual(value.entity.handlers[0]);
            expect(list[1]).toEqual(value.entity.handlers[1]);
        });
    });
}

describe("Intent API Definition Value", function () {
    intentsApiDefinitionValueContractTests(ozpIwc.IntentsApiDefinitionValue);
});