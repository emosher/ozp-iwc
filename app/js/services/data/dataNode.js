

ozpIwc.DataNode=ozpIwc.util.extend(ozpIwc.ApiNode,function(config) {
   this.children=[];
   ozpIwc.ApiNode.apply(this, arguments);
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
        entity: {
            entity: this.entity,
            children: this.children
        },
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

ozpIwc.DataNode.prototype.deserializedEntity=function(serializedForm,contentType) {
    console.log("SerializedForm is ",serializedForm);
    if(typeof(serializedForm) === "string") {
        serializedForm=JSON.parse(serializedForm);
    }
    if(!this.resource && serializedForm.key) {
        this.resource=((serializedForm.key.charAt(0)==="/")?"":"/")+serializedForm.key;
    }
    this.entity=serializedForm.entity.entity;
    this.children=serializedForm.entity.children;
    this.contentType=serializedForm.contentType;
    this.permissions=serializedForm.permissions;
    this.version=serializedForm.version;
    if(serializedForm._links && serializedForm._links.self) {
        this.self=serializedForm._links.self.href;
    }
};