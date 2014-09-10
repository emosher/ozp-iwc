ozpIwc.SystemApiApplicationValue = ozpIwc.util.extend(ozpIwc.CommonApiValue,function(config) {
    ozpIwc.CommonApiValue.apply(this,arguments);
    this.systemApi=config.systemApi;
    this.entity={};
});

ozpIwc.SystemApiApplicationValue.prototype.getIntentsRegistrations=function() {
    return this.entity.intents;
};