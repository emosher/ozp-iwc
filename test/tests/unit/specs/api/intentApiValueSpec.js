function intentsApiValueContractTests(classUnderTest, baseConfig) {
    describe("Conforms to the DataApiValue contract", function () {
        dataApiValueContractTests(classUnderTest);
    });

    var value;
    var config;

    beforeEach(function () {
        config = {
            'type': "text/plain",
            'action': "view",
            'icon': "http://example.com/view-text-plain.png",
            'label': "View Plain Text",
            'handlers': [
                "intents.api/text/plain/view/1234",
                "intents.api/text/plain/view/4321"
            ]
        };
        value = new classUnderTest(config);
    });

    describe("Basic Actions", function () {

        describe("Content Type", function () {
            it("sets", function () {
                value.set({
                    'type': "text/rich"
                });
                expect(value.type).toEqual("text/rich");
            });


            xit("deletes", function () {
            });
        });

        describe("Intent", function () {

            xit("sets", function () {
                value.set("");
            });

            xit("deletes", function () {
                value.delete("");
            });

            xit("invokes", function () {
                value.invoke("");
            });
            xit("listens", function () {
                value.listen("");
            });
            xit("broadcasts", function () {
                value.broadcast("");
            });
        });

        describe("Intent Handler Registration", function () {

            xit("sets", function () {
                value.set("");
            });

            xit("deletes", function () {
                value.delete("");
            });
        });
    });
}

describe("Intent API Value", function () {
    intentsApiValueContractTests(ozpIwc.IntentsApiValue);
});