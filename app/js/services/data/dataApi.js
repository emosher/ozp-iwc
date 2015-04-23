/**
 * @submodule bus.api.Type
 */

/**
 * The Names Api. Collects information about current IWC state, Manages names, aliases, and permissions through the IWC.
 * Subclasses the {{#crossLink "ozpIwc.ApiBase"}}{{/crossLink}}.
 *
 * @class NamesApi
 * @namespace ozpIwc
 * @extends ozpIwc.ApiBase
 * @constructor
 *
 * @type {Function}
 */
ozpIwc.DataApi = ozpIwc.createApi(function(config) {
    this.persistenceQueue=config.persistenceQueue || new ozpIwc.AjaxPersistenceQueue();
    this.on("changed",function(node) {
        console.log("Persisting " + node.resource);
        this.persistenceQueue.queueNode(this.name+"/"+node.resource,node);
    },this);
});

ozpIwc.DataApi.prototype.deserializeNode=function(item) {
    var key="/"+item.key;
    console.log(this.logPrefix+"deserializing node " + key);
    var node=this.data[key];
    if(!node) {
        node=this.data[key]=new ozpIwc.ApiNode({resource: key});
    }
    this.markForChange(node);
    node.deserialize(item);
    console.log("       --",node);
};

ozpIwc.DataApi.prototype.initializeData=function() {
    var endpoint=ozpIwc.endpoint(ozpIwc.linkRelPrefix+":user-data");
    var self=this;
    return ozpIwc.ApiBase.prototype.initializeData.apply(this,arguments).then(function() {
        return endpoint.get("/");
    }).then(function(data) {
        // load all the embedded items
        console.log(self.logPrefix+"received data, parsing _embedded",data.response);
        if (data.response._embedded && data.response._embedded.item) {
            var items = ozpIwc.util.ensureArray(data.response._embedded.item);
            items.forEach(function(i) {
                self.deserializeNode(i);
            });
        }
        var unknownLinks=[];
        console.log(self.logPrefix+"    parsing _links");
        if (data.response._links && data.response._links.item) {
            // prune out any links we already know about
            var knownLinks=ozpIwc.object.eachEntry(self.data,function(k,n) { 
                return n.self;
            });
            console.log(self.logPrefix+"   knownLinks:",knownLinks);
            unknownLinks=ozpIwc.util.ensureArray(data.response._links.item).filter(function(l) {
                return knownLinks.indexOf(l.href) >= 0;
            });
            console.log(self.logPrefix+"   unknownLinks:",unknownLinks);

        }
        console.log(self.logPrefix+"    fetching _links");
        // empty array resolves immediately, so no check needed
        return Promise.all(unknownLinks.map(function(l) {
            console.log(self.logPrefix+" fetching unresolved data " + l.href);
            return endpoint.get(l.href).then(function(data) {
                self.deserializeNode(data.response);
            }).catch(function(error) {
                console.log(self.logPrefix+"failed to load " + l.href + " because ",error);
            });
        }));

    });
    
};



// Default handlers are fine for list, bulkGet, watch, and unwatch with any properly formed resource
ozpIwc.DataApi.useDefaultRoute(ozpIwc.ApiBase.allActions);
