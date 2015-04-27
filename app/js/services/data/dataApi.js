/**
 * @submodule bus.api.Type
 */

/**
 * The Data Api. 
 * Subclasses the {{#crossLink "ozpIwc.ApiBase"}}{{/crossLink}}.
 *
 * @class DataApi
 * @namespace ozpIwc
 * @extends ozpIwc.ApiBase
 * @constructor
 */
ozpIwc.DataApi = ozpIwc.createApi(function(config) {
    this.persistenceQueue=config.persistenceQueue || new ozpIwc.AjaxPersistenceQueue();
    this.on("changed",function(node) {
        console.log("Persisting " + node.resource);
        this.persistenceQueue.queueNode(this.name+"/"+node.resource,node);
    },this);
});

ozpIwc.DataApi.prototype.createNode=function(config) {
    return new ozpIwc.DataNode(config);
};

ozpIwc.DataApi.prototype.deserializeNode=function(item) {
    var key="/"+item.key;
    var node=this.data[key];
    if(!node) {
        node=this.data[key]=this.createNode({resource: key});
    }
    node.deserializedEntity(item);
    return node;
};

ozpIwc.DataApi.prototype.initializeData=function() {
    var endpoint=ozpIwc.endpoint(ozpIwc.linkRelPrefix+":user-data");
    var self=this;
    return ozpIwc.ApiBase.prototype.initializeData.apply(this,arguments).then(function() {
        return endpoint.get("/");
    }).then(function(data) {
        // load all the embedded items
        if (data.response._embedded && data.response._embedded.item) {
            var items = ozpIwc.util.ensureArray(data.response._embedded.item);
            items.forEach(function(i) {
                self.deserializeNode(i);
            });
        }
        var unknownLinks=[];
        if (data.response._links && data.response._links.item) {
            // prune out any links we already know about
            var knownLinks=ozpIwc.object.eachEntry(self.data,function(k,n) { 
                return n.self;
            });
            unknownLinks=ozpIwc.util.ensureArray(data.response._links.item).filter(function(l) {
                return knownLinks.indexOf(l.href) >= 0;
            });
        }
        // empty array resolves immediately, so no check needed
        return Promise.all(unknownLinks.map(function(l) {
            return endpoint.get(l.href).then(function(data) {
                self.deserializeNode(data.response);
            });
        }));

    });
    
};



// Default handlers are fine for list, bulkGet, watch, and unwatch with any properly formed resource
ozpIwc.DataApi.useDefaultRoute(ozpIwc.ApiBase.allActions);
