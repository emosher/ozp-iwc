describe("Metrics",function() {
	var metrics;
	
	beforeEach(function() {
		metrics=new ozpIwc.MetricsRegistry();
	});
	
	afterEach(function() {
		metrics=null;
	});
	
	describe("Registry",function() {
		it("creates a counter upon request",function() {
			expect(metrics.counter("foo.bar"))
							.toBeInstanceOf(ozpIwc.metricTypes.Counter);
		});

		it("creates a meter upon request",function() {
			expect(metrics.meter("foo.bar"))
							.toBeInstanceOf(ozpIwc.metricTypes.Meter);
		});

		it("returns the same counter at each invocation",function() {
			expect(metrics.counter("foo.bar"))
							.toBe(metrics.counter("foo.bar"));
		});

		it("returns the same meter at each invocation",function() {
			expect(metrics.meter("foo.bar"))
							.toBe(metrics.meter("foo.bar"));
		});
	
		it("creates distinct counters",function() {
			expect(metrics.counter("foo.bar"))
							.not.toBe(metrics.counter("bar.foo"));
		});

		it("creates distinct meters",function() {
			expect(metrics.meter("foo.bar"))
							.not.toBe(metrics.meter("bar.foo"));
		});

		it("returns null if the named metric is of a different type",function() {
			metrics.meter("foo.bar");
			expect(metrics.counter("foo.bar")).toBeNull();
		});
		
		it("merges arrays into a metric name",function() {
			expect(metrics.counter("foo","bar"))
					.toBe(metrics.counter("foo.bar"));
		});
		
		it("merges arrays into a metric name when components have '.' in them",function() {
			expect(metrics.counter("foo","bar.baz"))
					.toBe(metrics.counter("foo.bar.baz"));
		});
		
	});
	
	describe("Counter",function() {
		it("starts at zero",function() {
			expect(metrics.counter("foo").get()).toEqual(0);
		});
		
		it("increments by one",function() {
			metrics.counter("foo").inc();
			expect(metrics.counter("foo").get()).toEqual(1);
		});
		
		it("increments by a count",function() {
			metrics.counter("foo").inc(5);
			expect(metrics.counter("foo").get()).toEqual(5);
		});
		
		it("increments multiple times",function() {
			metrics.counter("foo").inc(5);
			metrics.counter("foo").inc();
			metrics.counter("foo").inc(10);
			expect(metrics.counter("foo").get()).toEqual(16);
		});
		
		it("decrements by one",function() {
			metrics.counter("foo").dec();
			expect(metrics.counter("foo").get()).toEqual(-1);
		});
		
		it("decrements by a count",function() {
			metrics.counter("foo").dec(5);
			expect(metrics.counter("foo").get()).toEqual(-5);
		});
		
		it("decrements multiple times",function() {
			metrics.counter("foo").dec(5);
			metrics.counter("foo").dec();
			metrics.counter("foo").dec(10);
			expect(metrics.counter("foo").get()).toEqual(-16);
		});		
		
	});
	
	describe("Meter",function() {
		it("starts at zero",function() {
			expect(metrics.meter("foo").get()).toEqual(0);
		});
		
		it("can be set",function() {
			metrics.meter("foo").set(50);
			expect(metrics.meter("foo").get()).toEqual(50);
		});
		
		it("changes over time",function() {
			metrics.meter("foo").set(50);
			expect(metrics.meter("foo").get()).toEqual(50);
			
			metrics.meter("foo").set(44);
			expect(metrics.meter("foo").get()).toEqual(44);
		});

	});
	
	describe("Gauge",function() {
		var backingObject;
		
		beforeEach(function() {
			backingObject={	x: 1, y:100	};
			metrics.gauge("foo").set(function() {
				return backingObject;
			});
		});
		
		it("shows the backing object",function() {
			expect(metrics.gauge("foo").get()).toEqual({x:1,y:100});
		});
		
		it("reflects changes in the backing object",function() {
			backingObject.x=50;
			expect(metrics.gauge("foo").get()).toEqual({x:50,y:100});
		});
	});
	
	describe("Conversion to JSON", function() {
		var backingObject;
		
		beforeEach(function() {
			backingObject={	x: 1, y:100	};
			metrics.gauge("foo.gauge").set(function() {
				return backingObject;
			});
			metrics.counter("foo.counter").inc(10);
			metrics.meter("foo.meter").set(20);
		});
		
		it("returns a hash of metric names and values",function(){
			expect(metrics.toJson()).toEqual({
				foo: {
					gauge: {
						x:1,
						y:100
					},
					counter : 10,
					meter : 20
				}
			});
		});
		
	});
	
});