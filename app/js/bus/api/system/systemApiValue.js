ozpIwc.SystemApiValue = ozpIwc.util.extend(ozpIwc.CommonApiValue,function(config) {
    ozpIwc.CommonApiValue.apply(this,arguments);
    config=config || {};
    this.systemApi=config.systemApi || ozpIwc.systemApi;
});

ozpIwc.SystemApiValue.prototype.set=function(packet) {
    if(this.isValidContentType(packet.contentType)) {
        this.permissions=packet.permissions || this.permissions;
        this.contentType=packet.contentType;
        if (this.resource) {
            if (this.resource.indexOf('/application') === 0) {
                var id = this.applicationId();
                if (id) {
                    this.entity = packet.entity;
                    var node = this.systemApi.findOrMakeValue({resource: '/application'});
                    node.set({entity: id});
                } else {
                    this.entity = this.entity || [];
                    if (this.entity.indexOf(packet.entity) < 0) {
                        this.entity.push(packet.entity);
                    }
                }
            } else {
                this.entity = packet.entity;
            }
            this.version++;
        }
    }
}

ozpIwc.SystemApiValue.prototype.deleteData=function(packet) {
    if (this.resource) {
        if (this.resource.indexOf('/application') === 0) {
            var id = this.applicationId();
            if (id) {
                var originalEntity=this.entity;
                ozpIwc.CommonApiValue.prototype.deleteData.apply(this,arguments);
                if (originalEntity) {
                    var node = this.systemApi.findOrMakeValue({resource: '/application'});
                    node.deleteData({entity: id})
                }
            } else {
                if (!this.entity) {
                    return;
                }
                var elementRemoved=false;
                this.entity=this.entity.filter(function(element) {
                    var keep=element !== packet.entity;
                    if (!keep) {
                        elementRemoved=true;
                    }
                    this.version=0;
                    return keep;
                });
                if (elementRemoved){
                    var node = this.systemApi.findOrMakeValue({resource: '/application/'+packet.entity});
                    node.deleteData();
                }
            }
        } else {
            ozpIwc.CommonApiValue.prototype.deleteData.apply(this,arguments);
        }
        this.version=0;
    }
};

ozpIwc.SystemApiValue.prototype.applicationId=function() {
    var regexp=/\/application\/(.*)/;
    var res=regexp.exec(this.resource);
    if (res && res.length > 1) {
        return res[1];
    }
    return null;
};

