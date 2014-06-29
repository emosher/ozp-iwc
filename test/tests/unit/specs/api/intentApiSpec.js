describe("Intent API Base Class", function () {

    var apiBase;

    beforeEach(function () {
        jasmine.addMatchers(customMatchers);
        jasmine.clock().install();

        apiBase = new ozpIwc.IntentsApi({
            'participant': new TestParticipant()
        });
    });

    afterEach(function () {
        apiBase = null;
    });

    var nodePacket = function (resource, entity) {
        return {
            packet: {
                'resource': resource,
                'entity': entity
            }
        };
    };

    var watchPacket = function (node, src, msgId) {
        return {
            packet: {
                'src': src,
                'resource': node,
                'msgId': msgId
            }
        }
    };
    var sampleHandler = {
        'contentType': 'application/ozp-intents-handler-v1+json',
        'resource': "intents.api/text/plain/view/1234",
        'type': "text/plain",
        'action': "view",
        'icon': "http://example.com/view-text-plain.png",
        'label': "View Plain Text",
        'invokeIntent': "system.api/application/123-412"
    };

    var sampleDefinition = {
        'contentType': "application/ozp-intents-definition-v1+json",
        'resource': "intents.api/text/plain/view",
        'type': "text/plain",
        'action': "view",
        'icon': "http://example.com/view-text-plain.png",
        'label': "View Plain Text",
        'handlers': [
            "intents.api/text/plain/view/1234",
            "intents.api/text/plain/view/4321"
        ]
    };
    it("invokes definition packet", function () {

    });

    it("invokes handler packet", function () {

    });

});