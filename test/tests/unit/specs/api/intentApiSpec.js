describe("Intent API Base Class", function () {

    var apiBase;

    beforeEach(function () {
        jasmine.addMatchers(customMatchers);
        jasmine.clock().install();

        apiBase = new ozpIwc.DataApi();
        apiBase.makeValue = function (packet) {
            return new ozpIwc.DataApiValue();
        };
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

});