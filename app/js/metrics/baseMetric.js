var ozpIwc=ozpIwc || {};
ozpIwc.metricTypes=ozpIwc.metricTypes || {};

/**
 * @typedef {object} ozpIwc.MetricType 
 * @property {function} get - returns the current value of the metric
 */

ozpIwc.metricTypes.BaseMetric=function() {
	this.value=0;
};

ozpIwc.metricTypes.BaseMetric.prototype.get=function() { 
	return this.value; 
};

ozpIwc.metricTypes.BaseMetric.prototype.unit=function(val) { 
	if(val) {
		this.unit=val;
		return this;
	}
	return this.unit; 
};



