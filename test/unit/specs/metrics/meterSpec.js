describe("Metrics: Meter",function() {
	var meter;
	
	
	beforeEach(function() {
		meter=new ozpIwc.metricTypes.Meter();
	});
	
	
	it("starts at zero",function() {
		expect(meter.get().count).toEqual(0);
	});
	it("counts up",function() {
		meter.mark(5);
		meter.mark(1);
		var v=meter.get();
		expect(v['count']).toBe(6);
	});
	
	it("calculates a reasonable one minute rate",function() {
		var step=0.1;
		for(var i=0;i<60;i+=step) {
			tick(1000 * step);
			meter.mark(1000 * step);
		}
		// 60000/60 seconds = 1000/sec 
		// use fairly loose tolerances because this test is 
		
		var v=meter.get();
		expect(v['rate_1m']).toBeApproximately(1000,0.1);
		expect(v['rate_5m']).toBeApproximately(1000,0.1);
		expect(v['rate_15m']).toBeApproximately(1000,0.1);
		expect(v['rate_mean']).toBeApproximately(1000,0.1);
	});
});