describe("Metrics: Counter",function() {
	var counter;
	
	beforeEach(function() {
		counter=new ozpIwc.metricTypes.Counter();
	});
	
	afterEach(function() {
		counter=null;
	});
	
	
	it("starts at zero",function() {
		expect(counter.get()).toEqual(0);
	});

	it("increments by one",function() {
		counter.inc();
		expect(counter.get()).toEqual(1);
	});

	it("increments by a count",function() {
		counter.inc(5);
		expect(counter.get()).toEqual(5);
	});

	it("increments multiple times",function() {
		counter.inc(5);
		counter.inc();
		counter.inc(10);
		expect(counter.get()).toEqual(16);
	});

	it("decrements by one",function() {
		counter.dec();
		expect(counter.get()).toEqual(-1);
	});

	it("decrements by a count",function() {
		counter.dec(5);
		expect(counter.get()).toEqual(-5);
	});

	it("decrements multiple times",function() {
		counter.dec(5);
		counter.dec();
		counter.dec(10);
		expect(counter.get()).toEqual(-16);
	});		
	
});