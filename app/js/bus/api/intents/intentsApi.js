var ozpIwc = ozpIwc || {};

ozpIwc.IntentsApi = ozpIwc.util.extend(ozpIwc.CommonApiBase, function () {
    ozpIwc.CommonApiBase.apply(this, arguments);
});
ozpIwc.IntentsApi.prototype.TYPE_DEFINITION = "application/ozp-intents-definition-v1+json";
ozpIwc.IntentsApi.prototype.TYPE_HANDLER = "application/ozp-intents-handler-v1+json";

ozpIwc.IntentsApi.prototype.makeValue = function (packet) {
    if (packet.contentType === this.TYPE_DEFINITION) {
        return new ozpIwc.IntentsApiValue(packet);
    } else if (packet.contentType === this.TYPE_HANDLER) {
        return new ozpIwc.IntentsApiHandlerValue(packet);
    } else {
        return null;
    }
};

ozpIwc.IntentsApi.prototype.invoke = function (packet) {
    var node = this.findOrMakeValue(packet);
    if (node.contentType === this.TYPE_DEFINITION) {
        // get user's preference of handler.
    } else if (node.contentType === this.TYPE_HANDLER) {
        // this is a specific handler, invoke it.
    }
};

ozpIwc.IntentsApi.prototype.listen = function () {
};

ozpIwc.IntentsApi.prototype.broadcast = function () {
};
