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
            'invokeIntent': "system.api/application/123-412"
        };
        value = new classUnderTest(config);
    });
}

describe("Intent API Value", function () {
    intentsApiValueContractTests(ozpIwc.IntentsApiHandlerValue);
});