describe("Supplied ABAC policies",function() {
	beforeEach(function() {
		auth=new ozpIwc.BasicAuthorization();
	});
	
	afterEach(function() {
		auth=null;
	});
	describe("permit when object has no attributes",function() {
        it("permits with trivial request",function() {
            var request={
                'subject': {},
                'object': {}
            };
            expect(ozpIwc.abacPolicies.permitWhenObjectHasNoAttributes(request)).toEqual("permit");
        });
        it("permits when the subject has an attribute",function() {
            var request={
                'subject': {
                    'a':1
                },
                'object': {}
            };
            expect(ozpIwc.abacPolicies.permitWhenObjectHasNoAttributes(request)).toEqual("permit");
        });
        it("defers when the object has an attribute",function() {
            var request={
                'subject': {
                    'a':1
                },
                'object': {
                    'a':1
                }
            };
            expect(ozpIwc.abacPolicies.permitWhenObjectHasNoAttributes(request)).toEqual("undetermined");
        });
    });
    
    describe("subject has all object attributes",function() {
        it("permits with trivial request",function() {
            var request={
                'subject': {},
                'object': {}
            };
            expect(ozpIwc.abacPolicies.subjectHasAllObjectAttributes(request)).toEqual("permit");
        });
        it("permits when the object has no attributes",function() {
            var request={
                'subject': {
                    'a':1
                },
                'object': {}
            };
            expect(ozpIwc.abacPolicies.subjectHasAllObjectAttributes(request)).toEqual("permit");
        });
        it("permits when the attributes match",function() {
            var request={
                'subject': {
                    'a':1
                },
                'object': {
                    'a':1
                }
            };
            expect(ozpIwc.abacPolicies.subjectHasAllObjectAttributes(request)).toEqual("permit");
        });
        it("denies when the attributes don't match",function() {
            var request={
                'subject': {
                    'a':1
                },
                'object': {
                    'a':2
                }
            };
            expect(ozpIwc.abacPolicies.subjectHasAllObjectAttributes(request)).toEqual("deny");
        });
        it("permits when subject has all object attributes",function() {
            var request={
                'subject': {
                    'a':1,
                    'b':2
                },
                'object': {
                    'a':1
                }
            };
            expect(ozpIwc.abacPolicies.subjectHasAllObjectAttributes(request)).toEqual("permit");
        });
        it("denies when subject has a subset of object attributes",function() {
            var request={
                'subject': {
                    'a':1
                },
                'object': {
                    'a':1,
                    'b':2
                }
            };
            expect(ozpIwc.abacPolicies.subjectHasAllObjectAttributes(request)).toEqual("deny");
        });
    });
});