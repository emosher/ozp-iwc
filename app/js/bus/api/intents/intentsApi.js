var ozpIwc = ozpIwc || {};

ozpIwc.IntentsApi = ozpIwc.util.extend(ozpIwc.CommonApiBase, function () {
    ozpIwc.CommonApiBase.apply(this, arguments);
});

ozpIwc.IntentsApi.prototype.makeValue = function (packet) {
    return new ozpIwc.IntentsApiValue({
        resource: packet.resource
    });
};

ozpIwc.IntentsApi.prototype.invoke = function () {
};

ozpIwc.IntentsApi.prototype.listen = function () {
};

ozpIwc.IntentsApi.prototype.broadcast = function () {
};