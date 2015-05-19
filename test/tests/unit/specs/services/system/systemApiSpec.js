describe("System API", function() {

    var systemApi;

    beforeEach(function() {
        systemApi = new ozpIwc.SystemApi({
            'name': "system.test.api",
            'participant': new TestClientParticipant(),
            'router': new FakeRouter()
        });
        systemApi.isRequestQueueing = false;
    });

    afterEach(function() {
        systemApi = null;
    });

    pit("does not allow set on /application/{id}", function() {
        var context = new TestPacketContext({
            'leaderState': "leader",
            'packet': {
                'resource': "/application/1234",
                'action': "set",
                'msgId': "1234",
                'src': "srcParticipant",
                entity: {
                    launchUrls: {
                        default: "http://bogus.com"
                    }
                }
            }
        });
        return systemApi.receivePacketContext(context).then(function() {
            expect(context.responses[0].response).toEqual("badAction");
        });
    });
});