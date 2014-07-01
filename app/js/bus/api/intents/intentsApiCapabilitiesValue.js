ozpIwc.IntentsApiCapabilitiesValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
    config = config || {};
    this.definitions = config.definitions || [];
});
