describe("Metrics: Histogram",function() {
	var histogram;
	// @todo: 25% error bars is huge, but tests are unreliable.  Fix it fix it fix it
	var tolerance=0.25;
	beforeEach(function() {
		histogram=new ozpIwc.metricTypes.Histogram();
	});
	
	it("starts at zero",function() {
		expect(histogram.get().count).toEqual(0);
	});
	
	it("does proper percentiles on small sets",function() {
		for(var i=1; i <= 100; ++i) {
			histogram.mark(i);
		}
		var v=histogram.get();
		expect(v.percentile_10).toBe(10);
		expect(v.percentile_25).toBe(25);
		expect(v.median).toBe(50);
		expect(v.percentile_75).toBe(75);
		expect(v.percentile_90).toBe(90);
		expect(v.percentile_95).toBe(95);
		expect(v.percentile_99).toBe(99);
		expect(v.percentile_999).toBe(99.9);
	});
	it("does proper percentiles on large sets",function() {
		for(var i=1; i <= 10000; ++i) {
			histogram.mark(i);
		}
		var v=histogram.get();
		expect(v.percentile_10).toBeApproximately(1000,tolerance);
		expect(v.percentile_25).toBeApproximately(2500,tolerance);
		expect(v.median).toBeApproximately(5000,tolerance);
		expect(v.percentile_75).toBeApproximately(7500,tolerance);
		expect(v.percentile_90).toBeApproximately(9000,tolerance);
		expect(v.percentile_95).toBeApproximately(9500,tolerance);
		expect(v.percentile_99).toBeApproximately(9900,tolerance);
		expect(v.percentile_999).toBeApproximately(9990,tolerance);
	});
});