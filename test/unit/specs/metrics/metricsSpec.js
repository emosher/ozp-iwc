describe("Metrics Registry",function() {
	var metrics;
	
	beforeEach(function() {
		metrics=new ozpIwc.MetricsRegistry();
	});
	
	afterEach(function() {
		metrics=null;
	});
	
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