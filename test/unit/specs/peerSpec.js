
describe("Peer",function() {
	
	var sendCount;
	var receiveCount;
	var peer;
	
	beforeEach(function() {	
		sendCount=receiveCount=0;
		peer=new ozpIwc.Peer();
		peer.on("send",function(event) {sendCount++;});
		peer.on("receive",function(event) {receiveCount++;});
		
	});
	
	afterEach(function() {
		peer=null;
	});
	
	it("sends a packet to handlers",function() {
		peer.on("send",function(event) {
			expect(event.packet.data).toEqual("foo");
		});
		
		peer.send("foo");
		expect(sendCount).toEqual(1);
	});
	
	it("notifies handlers on receive",function() {
		peer.on("receive",function(event) {
			expect(event.packet.data).toEqual("foo");
		});
		
		peer.receive("testLinkId",{src_peer:"me",sequence:1,data: "foo"});
		expect(receiveCount).toEqual(1);
	});
	
    //@TODO write shutdown handler notification test
    it("notifies handlers on shutdown",function(){});

	describe("deduplicates packets", function() {
		it("receive ignores duplicate src_peer & sequence pairs",function() {
			peer.receive("testLinkId",{src_peer:"me",sequence:1,data: "foo"});
			peer.receive("testLinkId",{src_peer:"me",sequence:1,data: "foo"});
			expect(receiveCount).toEqual(1);
		});
		it("receive ignores duplicate src_peer & sequence pairs from different links",function() {
			peer.receive("testLinkId",{src_peer:"me",sequence:1,data: "foo"});
			peer.receive("aDifferentLink",{src_peer:"me",sequence:1,data: "foo"});
			expect(receiveCount).toEqual(1);
		});
		
		it("does not ignore packets with the same sequence but different source",function() {
			peer.receive("testLinkId",{src_peer:"me",sequence:1,data: "foo"});
			peer.receive("testLinkId",{src_peer:"you",sequence:1,data: "foo"});
			expect(receiveCount).toEqual(2);
		});
		
		it("does not ignore packets with the same source but different sequence",function() {
			peer.receive("testLinkId",{src_peer:"me",sequence:1,data: "foo"});
			peer.receive("testLinkId",{src_peer:"me",sequence:2,data: "foo"});
			expect(receiveCount).toEqual(2);
		});
	});
	
	describe("filtering",function() {
		it("allows presend filtering",function() {
			peer.on("preSend",function(event) {
				// only allow odd numbers for value
				if(event.packet.data.value % 2 === 1) {
					event.cancel();
				}
			});
			for(var i=0;i<10;++i) {
				peer.send({value:i});
			}
			expect(sendCount).toEqual(5);
		});
	});

});