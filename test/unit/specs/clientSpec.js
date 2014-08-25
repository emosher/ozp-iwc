describe("Client",function() {

    var isStructuredClonesSupported;
    var client;
    var receiveData=function(event) {
        var data=event.message.data;
		if (isStructuredClonesSupported) {
			expect(typeof(data)=="object");
		} else {
			expect(typeof(data)=="string");
		}
    };

    beforeEach(function() {
        isStructuredClonesSupported=ozpIwc.util.structuredCloneSupport();
		isStructuredClonesSupported=false;
        client=new ozpIwc.Client({peerUrl:"http://" + window.location.hostname + ":13000"});
        client.on("message",receiveData);
    });

    afterEach(function() {
        client=null;
    });

    it("sends an object via postMessage and does not stringify unless necessary ",function() {
        client.send(new Object());
    });
});