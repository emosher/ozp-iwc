

ozpIwc.DataNode=ozpIwc.util.extend(ozpIwc.ApiNode,function(config) {
   ozpIwc.ApiNode.apply(this, config);
   
});

ozpIwc.DataNode.prototype.serializeLive=function() {
    var s=ozpIwc.ApiNode.prototype.serializeLive.apply(this,arguments);
    s.children=this.children;
    return s;
};

ozpIwc.DataNode.prototype.deserializeLive=function(packet) {
    ozpIwc.ApiNode.prototype.deserializeLive.apply(this,arguments);
    this.children = packet.children || this.children;
};

ozpIwc.DataNode.prototype.serializedEntity=function() {
    return JSON.stringify({
        key: this.resource,
        entity: this.entity,
        children: this.children,
        contentType: this.contentType,
        permissions: this.permissions,
        version: this.version,
        _links: {
            self: {
                href: this.self
            }
        }
    });
};
ozpIwc.DataNode.prototype.serializedContentType=function() {
    return "application/vnd.ozp-iwc-data-object+json";
};