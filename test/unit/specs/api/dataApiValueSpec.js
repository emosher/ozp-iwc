function dataApiValueContractTests(classUnderTest,baseConfig) {
    describe("Conforms to the CommonApiValue contract", function() {
        commonApiValueContractTests(classUnderTest);
    });
    
    var value;
    var config;

    beforeEach(function() {
        config = {
            'resource': "testResource",
            'entity': {'foo': 1},
            'contentType': "testContentType",
            'permissions': ['perms'],
            'version': 1
        };
        value = new classUnderTest(config);
    });
    
    it("adds a child",function() {
        value.addChild("child1");
        value.addChild("child2");
        value.addChild("child3");
        
        expect(value.listChildren()).toEqual(["child1","child2","child3"]);
    });

    it("updates the version when adding a child",function() {
        value.addChild("child1");
        value.addChild("child2");
        value.addChild("child3");

        var originalVersion=value.version;
        value.addChild("child4");
        expect(value.version).toEqual(originalVersion+1);
    });
    
    it("will only add a child once",function() {
        value.addChild("child1");
        value.addChild("child1");

        value.addChild("child2");
        value.addChild("child3");
        
        value.addChild("child1");
        value.addChild("child1");
        
        expect(value.listChildren()).toEqual(["child1","child2","child3"]);
    });

    it("does not update version upon adding a duplicate child",function() {
        value.addChild("child1");
        value.addChild("child2");
        value.addChild("child3");

        var originalVersion=value.version;
        value.addChild("child1");
        value.addChild("child1");
        
        expect(value.version).toEqual(originalVersion);
        
    });
    
    it("removes a child",function() {
        value.addChild("child1");
        value.addChild("child2");
        value.addChild("child3");
        
        value.removeChild("child2");
        
        expect(value.listChildren()).toEqual(["child1","child3"]);
    });

    it("updates the version when removing a child",function() {
        value.addChild("child1");
        value.addChild("child2");
        value.addChild("child3");

        var originalVersion=value.version;
        value.removeChild("child2");
        expect(value.version).toEqual(originalVersion+1);
    });
    
    it("does not update version or throw error on removing a non-existant child",function() {
        value.addChild("child1");
        value.addChild("child2");
        value.addChild("child3");
        
        var version=value.version;
        value.removeChild("child5");
        
        expect(value.version).toEqual(version);
        
    });

    it("generates changes for added children",function() {
        var snapshot=value.snapshot();
        
        value.addChild("child1");
        value.addChild("child2");
        value.addChild("child3");
        value.addChild("child4");
        
        var diff=value.changesSince(snapshot);
        expect(diff.addedChildren).toEqual(["child1","child2","child3","child4"]);
        expect(diff.removedChildren).toEqual([]);
    });
    it("generates changes for removed children",function() {
        
        value.addChild("child1");
        value.addChild("child2");
        value.addChild("child3");
        value.addChild("child4");        
        
        var snapshot=value.snapshot();
        value.removeChild("child3");
        var diff=value.changesSince(snapshot);

        expect(diff.addedChildren).toEqual([]);
        expect(diff.removedChildren).toEqual(["child3"]);
    });

    it("generates changes for combined added and removed children",function() {
        
        value.addChild("child1");
        value.addChild("child2");
        value.addChild("child3");
        value.addChild("child4");   
        
        var snapshot=value.snapshot();
        
        value.addChild("child5");
        value.removeChild("child2");
        
        var diff=value.changesSince(snapshot);

        expect(diff.addedChildren).toEqual(["child5"]);
        expect(diff.removedChildren).toEqual(["child2"]);        
    });
};

describe("Data API Value", function() {
    dataApiValueContractTests(ozpIwc.DataApiValue);
});