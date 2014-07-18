var ozpIwc=ozpIwc || {};

ozpIwc.NamesApi = ozpIwc.util.extend(ozpIwc.CommonApiBase,function() {
    ozpIwc.metrics.counter('iwc.namesApi.' + this.participant.address + '.namesRegistered').inc();
	ozpIwc.CommonApiBase.apply(this,arguments);
});
