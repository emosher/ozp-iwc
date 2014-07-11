ozpIwc.metricTypes=ozpIwc.metricTypes || {};
/**
 * @callback ozpIwc.metricTypes.Gauge~gaugeCallback
 * @returns {ozpIwc.metricTypes.MetricsTree} 
 */

/**
 * @class
 * @extends ozpIwc.MetricType
 * A gauge is an externally defined set of metrics returned by a callback function
 * @param {ozpIwc.metricTypes.Gauge~gaugeCallback} metricsCallback
 */
ozpIwc.metricTypes.Gauge=function(metricsCallback) {
	this.callback=metricsCallback;
};
/**
 * Set the metrics callback for this gauge.
 * @param {ozpIwc.metricTypes.Gauge~gaugeCallback} metricsCallback
 * @returns {ozpIwc.metricTypes.Gauge} this
 */
ozpIwc.metricTypes.Gauge.prototype.set=function(metricsCallback) { 
	this.callback=metricsCallback;
	return this;
};
/**
 * Executes the callback and returns a metrics tree.
 * @returns {ozpIwc.metricTypes.MetricsTree}
 */
ozpIwc.metricTypes.Gauge.prototype.get=function() {
    if (this.callback) {
        return this.callback();
    }
    return undefined;
};
