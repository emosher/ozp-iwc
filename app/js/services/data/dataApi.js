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
    this.endpoints=[
        ozpIwc.linkRelPrefix+":user-data"
    ];
    
    this.on("changed",function(node) {
        console.log("Persisting " + node.resource);
        this.persistenceQueue.queueNode(this.name+"/"+node.resource,node);
    },this);
});

/**
 * Override the default node type to be a DataNode.
 * @param {type} config
 * @returns {ozpIwc.DataNode}
 */
ozpIwc.DataApi.prototype.createNode=function(config) {
    return new ozpIwc.DataNode(config);
};

// Default handlers are fine for list, bulkGet, watch, and unwatch with any properly formed resource
ozpIwc.DataApi.useDefaultRoute(ozpIwc.ApiBase.allActions);
