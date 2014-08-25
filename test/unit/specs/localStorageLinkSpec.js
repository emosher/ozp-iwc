describe("LocalStorageLink",function() {
	var link;
	var event;


	var makeLink=function(conf) {
		conf.peer.receive=conf.peer.receive || function(linkId,packet) {};
		
		var link=new ozpIwc.LocalStorageLink(conf);
		
		return link;
	};
	
	beforeEach(function() {
		clockOffset=0;
		localStorage.clear();
		
		event=new ozpIwc.Event();
		link=makeLink({
			peer: event,
			selfId: "peer"
		});
	});
	
	afterEach(function() {
		jasmine.clock().uninstall();
		event=link=null;
		clockOffset=0;
	});
	
	it("writes to localStorage",function() {
		link.send("foo");
		expect(localStorage.length).toEqual(1);
	});

	it("cleans up own keys",function() {
		link.send("foo");
		expect(localStorage.length).toEqual(1);

		tick(link.myKeysTimeout+5);
		link.cleanKeys();
		expect(localStorage.length).toEqual(0);
	});
	
	
	it("cleans up own keys after set time",function() {
		link.send("foo");
		
		tick(link.myKeysTimeout-5);
		expect(localStorage.length).toEqual(1);
		
		tick(6);
		expect(localStorage.length).toEqual(0);
	});
	
	it("cleans other links' keys after otherKeysTimeout",function() {
		var link2=makeLink({
			peer: event,
			selfId: "peer2",
			myKeysTimeout: link.myKeysTimeout*100,
			otherKeysTimeout: link.otherKeysTimeout*100
		});

		link.send("foo");
		link2.send("foo");
		expect(localStorage.length).toEqual(2);

		tick(link.myKeysTimeout+5);
		link.cleanKeys();
		expect(localStorage.length).toEqual(1);
		
		tick(link.otherKeysTimeout);
		link.cleanKeys();
		expect(localStorage.length).toEqual(0);
		
	});
		
});