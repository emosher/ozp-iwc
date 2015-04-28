describe("DataNode",function() {
	var dataNode;
    beforeEach(function() {
       dataNode=new ozpIwc.DataNode({
            resource: "/foo",
            version: 50,        
            self: "https://example.com/iwc/foo",
            contentType: "text/plain",
            entity: "hello world"
       });
	});
    it("fails if constructed without a resource",function() {
        expect(function() {
            new ozpIwc.DataNode();
        }).toThrow();
    });
    it("deserializes and serializes live data with the same outcome",function() {
        var serialized=dataNode.serializeLive();
        var node2=new ozpIwc.DataNode({resource:"/foo"});
        node2.deserializeLive(serialized);
        expect(node2).toEqual(dataNode);     
    });
    
    it("a set with etag properly updates the version",function() {
        dataNode.set({
           entity: "goodbye world",
           eTag: 100
        });
        expect(dataNode.entity).toEqual("goodbye world");
        expect(dataNode.version).toEqual(100);
    });
    
    it("deserializes and serializes persisted data with the same outcome",function() {
        var node2=new ozpIwc.DataNode({resource:"/foo"});
        node2.deserializedEntity(dataNode.serializedEntity(),dataNode.serializedContentType());
        expect(node2).toEqual(dataNode);
    });
    
    it("deserializes and serializes persisted data with the same outcome using the constructor",function() {
        var node2=new ozpIwc.DataNode({
            serializedEntity: dataNode.serializedEntity(),
            serializedContentType: dataNode.serializedContentType()
        });
        expect(node2).toEqual(dataNode);
    });
    
    it("deserializes and serializes persisted data with the same outcome using the constructor without content type",function() {
        var node2=new ozpIwc.DataNode({
            serializedEntity: dataNode.serializedEntity()
        });
        expect(node2).toEqual(dataNode);
    });
    
});