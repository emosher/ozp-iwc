var ozpIwc=ozpIwc || {};

ozpIwc.SystemApi = ozpIwc.util.extend(ozpIwc.CommonApiBase,function() {
    ozpIwc.metrics.counter('iwc.systemApi.' + this.participant.address + '.systemRegistered').inc();
	ozpIwc.CommonApiBase.apply(this,arguments);
});
