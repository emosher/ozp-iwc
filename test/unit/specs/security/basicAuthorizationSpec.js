describe("Basic authorization",function() {
	var auth;
	
	beforeEach(function() {
		auth=new ozpIwc.BasicAuthorization({
            policies: []
        });
	});
	
	afterEach(function() {
		auth=null;
	});

});