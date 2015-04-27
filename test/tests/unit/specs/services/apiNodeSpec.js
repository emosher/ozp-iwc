describe("ApiNode",function() {
	var apiNode;
	beforeEach(function() {
       apiNode=new ozpIwc.ApiNode({
            resource: "/foo",
            version: 50,        
            self: "https://example.com/iwc/foo",
            contentType: "text/plain",
            entity: "hello world"
       });
	});
    
    it("deserializes and serializes with the same outcome",function() {
        var serialized=apiNode.serializeLive();
        var node2=new ozpIwc.ApiNode({resource:"/foo"});
        node2.deserializeLive(serialized);
        expect(node2).toEqual(apiNode);     
    });
    
    it("a set with etag properly updates the version",function() {
        apiNode.set({
           entity: "goodbye world",
           eTag: 100
        });
        expect(apiNode.entity).toEqual("goodbye world");
        expect(apiNode.version).toEqual(100);
    });
});