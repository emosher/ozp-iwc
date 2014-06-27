ozpIwc.IntentsApiHandlerValue = ozpIwc.util.extend(ozpIwc.DataApiValue, function (config) {
    ozpIwc.DataApiValue.apply(this, arguments);
    config = config || {};

    //TODO: do we want to encapsulate intent properties inside a property of the value?
    this.type = config.type;
    this.action = config.action;
    this.icon = config.icon;
    this.label = config.label;
    this.invokeIntent = config.invokeIntent;
});
