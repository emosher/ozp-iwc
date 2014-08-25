function systemApiValueContractTests(classUnderTest,baseConfig) {
    describe("Conforms to the CommonApiValue contract", function () {
        commonApiValueContractTests(classUnderTest);
    });

    var applicationValue;

    beforeEach(function () {
        var applicationConfig = {
            'resource': "/application/abcApplication",
            'contentType': "testContentType",
            'permissions': ['perms'],
            'version': 1
        };
        applicationValue = new classUnderTest(applicationConfig);
    });

    it("updates the version when adding an application", function () {
        var originalVersion = applicationValue.version;
        applicationValue.set({
                'entity' : {
                    screenShots: {
                        overview: {
                            url: "https://mail.example.com/screenshot1.png",
                            title: "This shows the basic user interface"
                        }
                    },
                    links: {
                        self: "names.api/application/12341-123-abba-123",
                        launch: {
                            default: "https://mail.example.com",
                            development: "https://dev.mail.example.com",
                            test: "https://test.mail.example.com"
                        },
                        userDocs: "https://mail.example.com/help.html",
                        integrationDocs:  "https://mail.example.com/integration.html",
                        onlineHelp:  "https://mail.example.com/liveChat.html",
                    },
                    intents: {
                    }
                }
            }
        );
        expect(applicationValue.version).toEqual(originalVersion + 1);
    });

    it("resets the version when deleting an application",function() {
        applicationValue.deleteData();
        expect(applicationValue.version).toEqual(0);
    });

    it("deletes an application idempotently",function() {
        applicationValue.deleteData();
        applicationValue.deleteData();
        expect(applicationValue.version).toEqual(0);
    });
};

describe("System API Value", function() {
    systemApiValueContractTests(ozpIwc.SystemApiValue);
});