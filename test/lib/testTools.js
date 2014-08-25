var customMatchers={
	toBeInstanceOf: function(util, customEqualityTesters) { return {
		compare: function(actual,expected) {
			var result={ pass: actual instanceof expected };
			if(result.pass) {
				result.message="Expected " + actual + " to NOT be an instance of " + expected;
			} else {
				result.message="Expected " + actual + " to be an instance of " + expected;
			}
			return result;
		}
	};},
	toBeApproximately: function(util, customEqualityTesters) { return {
		compare: function(actual,expected,epsilon) {
			if(typeof(epsilon) !== "number") {
				epsilon=1e-5;
			}
			return {pass: Math.abs(actual-expected) <= epsilon * Math.abs(expected)};
		}
	};},
	toContainAll: function(util, customEqualityTesters) { return {
		compare: function(actual,expected) {
			var missing=[];
			
			for(var i=0; i < expected.length;++i) {
				if(!util.contains(actual,expected[i],customEqualityTesters)) {
					missing.push(expected[i]);
				}
			}
			
			if(missing.length === 0) {
				return {
					pass: true,
					message: "Expected " + actual + " to not contain [" + expected.join(",") + "]"
				};
			} else {
				return {
					pass: false,
					message: "Expected " + actual + " to contain [" + missing.join(",") + "]"
				};
			}
		}
	};}
};

beforeEach(function() {
    jasmine.addMatchers(customMatchers);
    jasmine.clock().install();
});


function done_semaphore(count,done) {
    return function() { 
        if(--count <= 0) {
            done();
        }
    };
}

//================================================
// Time-advancement for IWC objects that use time
//================================================

var clockOffset=0;

var tick=function(t) { 
	clockOffset+=t;
	try {
		jasmine.clock().tick(t);
	} catch (e) {
		// do nothing
	}
};

// mock out the now function to let us fast forward time
ozpIwc.util.now=function() {
	return new Date().getTime() + clockOffset;
};

