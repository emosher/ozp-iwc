
ozpIwc.CommonApiCollectionValue = ozpIwc.util.extend(ozpIwc.CommonApiValue,function(config) {
	ozpIwc.CommonApiValue.apply(this,arguments);
    this.persist=false;    
    this.pattern=config.pattern;
    this.entity=[];
});

ozpIwc.CommonApiCollectionValue.prototype.isUpdateNeeded=function(node) {
    return node.resource.match(this.pattern);
};

ozpIwc.CommonApiCollectionValue.prototype.updateContent=function(changedNodes) {
    this.version++;
    this.entity=changedNodes.map(function(changedNode) { return changedNode.resource; });
};

ozpIwc.CommonApiCollectionValue.prototype.set=function() {
    throw new ozpIwc.ApiError("noPermission","This resource cannot be modified.");
};
