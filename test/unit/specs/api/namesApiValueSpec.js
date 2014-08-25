function namesApiValueContractTests(classUnderTest,baseConfig) {
    describe("Conforms to the CommonApiValue contract", function () {
        commonApiValueContractTests(classUnderTest,{allowedContentTypes:["test/testType+json"]});
    });
};

describe("Names API Value", function() {
    namesApiValueContractTests(ozpIwc.NamesApiValue);
    
    // NamesAPIValue doesn't have any other unique functionality at this point.
});