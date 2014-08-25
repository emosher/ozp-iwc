var ozpIwc=ozpIwc || {};
ozpIwc.metricTypes=ozpIwc.metricTypes || {};

/**
 * @typedef {object} ozpIwc.MetricType 
 * @property {function} get - returns the current value of the metric
 */

ozpIwc.metricTypes.BaseMetric=function() {
	this.value=0;
    this.name="";
    this.unitName="";
};

ozpIwc.metricTypes.BaseMetric.prototype.get=function() { 
	return this.value; 
};

ozpIwc.metricTypes.BaseMetric.prototype.unit=function(val) { 
	if(val) {
		this.unitName=val;
		return this;
	}
	return this.unitName; 
};



