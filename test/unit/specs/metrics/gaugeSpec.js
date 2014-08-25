describe("Metrics: Gauge",function() {
	var metrics;
	var backingObject;
	
	beforeEach(function() {
		metrics=new ozpIwc.MetricsRegistry();
		backingObject={	x: 1, y:100	};
		metrics.gauge("foo").set(function() {
			return backingObject;
		});
	});
	
	afterEach(function() {
		metrics=null;
	});
	
			
	it("shows the backing object",function() {
		expect(metrics.gauge("foo").get()).toEqual({x:1,y:100});
	});

	it("reflects changes in the backing object",function() {
		backingObject.x=50;
		expect(metrics.gauge("foo").get()).toEqual({x:50,y:100});
	});
	
});
