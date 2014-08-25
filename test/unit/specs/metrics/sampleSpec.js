describe("Sample Interface",function() {
	var sampleClasses=[
		["Sample",ozpIwc.metricsStats.Sample],
		["Uniform Sample",ozpIwc.metricsStats.UniformSample],
		["Exponentially Decaying Sample",ozpIwc.metricsStats.ExponentiallyDecayingSample]
	];

	for(var sampleClassI=0;sampleClassI < sampleClasses.length;sampleClassI++) {
		var Sample=sampleClasses[sampleClassI][1];
		var sampleClassName=sampleClasses[sampleClassI][0];
		describe(sampleClassName,function() {
			var sample;
	
			beforeEach(function() {
				sample=new Sample();
			});

			afterEach(function() {
				sample=null;
			});
			
			it("is empty when created",function() {
				expect(sample.size()).toEqual(0);
				expect(sample.getValues()).toEqual([]);
			});
			
			it("adds values on update",function() {
				sample.update(3);
				sample.update(1);
				sample.update(4);
				expect(sample.size()).toEqual(3);
				expect(sample.getValues()).toContainAll([3,1,4]);
			});
			
			it("rests on a call to clear",function() {
				sample.update(3);
				sample.update(1);
				sample.update(4);
				expect(sample.size()).toEqual(3);
				expect(sample.getValues()).toContainAll([3,1,4]);

				sample.clear();
				expect(sample.size()).toEqual(0);
				expect(sample.getValues()).toEqual([]);
			});			
			
			
		});
	}// loop over all sample classes

});


describe("Uniform Sample Specific Functions",function() {
	var sample;
	beforeEach(function() {
		sample=new ozpIwc.metricsStats.UniformSample(10);
	});

	it("gets no bigger than the max size",function() {
		for(var i=0; i<100;++i) {
			sample.update(i);
		}
		expect(sample.size()).toEqual(10);
	});

	it("randomly replaces values once the buffer is full (extremely small chance that this test will occasionally fail)",function() {
		for(var i=0; i<10000;++i) {
			sample.update(i);
		}

		var v=sample.getValues();
		var success=false;
		// Should be at least one value larger than 10 in here.
		// not going for statistical soundness, just that it does
		// put some values in
		for(var i=0;i<v.length;++i) {
			if(v[i]>10) {
				success=true;
			}
		}

		expect(success).toBe(true);
	});		

});
	
describe("Exponentially Decaying Sample functionality",function() {
	var sample;
	beforeEach(function() {
		sample=new ozpIwc.metricsStats.ExponentiallyDecayingSample(10);
	});

	it("gets no bigger than the max size",function() {
		for(var i=0; i<100;++i) {
			sample.update(i);
		}
		expect(sample.size()).toEqual(10);
	});

	it("randomly replaces values once the buffer is full (extremely small chance that this test will occasionally fail)",function() {
		for(var i=0; i<10000;++i) {
			sample.update(i);
		}

		var v=sample.getValues();
		var success=false;
		// Should be at least one value larger than 10 in here.
		// not going for statistical soundness, just that it does
		// put some values in
		for(var i=0;i<v.length;++i) {
			if(v[i]>10) {
				success=true;
			}
		}

		expect(success).toBe(true);
	});		
	
	
});