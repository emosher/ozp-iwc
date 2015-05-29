/* global ozpIwc */

/**
 * @submodule bus.service.Type
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
        {link: ozpIwc.linkRelPrefix+":user-data"}
    ];

    this.on("changed",function(node) {
        this.persistenceQueue.queueNode(this.name+"/"+node.resource,node);
    },this);
});


/**
 * Override the default node type to be a DataNode.
 * @param {type} config
 * @returns {ozpIwc.DataNode}
 */
ozpIwc.DataApi.prototype.createNodeObject=function(config) {
    return new ozpIwc.DataNode(config);
};

// Default handlers are fine anything
ozpIwc.DataApi.useDefaultRoute(ozpIwc.ApiBase.allActions);

//
// temporary filters/routes
//
ozpIwc.DataApi.addChildFilter= function() {
    var createKey=function(prefix) {
        prefix=prefix || "";
        var key;
        do {
            key=prefix + ozpIwc.util.generateId();
        } while(key in this.data);
        return key;
    };
    var filters = ozpIwc.standardApiFilters.setFilters();

    filters.unshift(function(packet,context,pathParams,next) {
        var resource = createKey.call(this,packet.resource + "/");
        packet.resource = resource;
        return next();
    });

    return filters;
};

ozpIwc.DataApi.declareRoute({
    action: ["addChild"],
    resource: "{resource:.*}",
    filters: ozpIwc.DataApi.addChildFilter()
}, function(packet, context, pathParams) {
    context.node.set(packet);
    return {
        response: "ok",
        entity: {
            resource: context.node.resource
        }
    };
});

ozpIwc.DataApi.removeChildFilter= function() {
    var filters = ozpIwc.standardApiFilters.deleteFilters();

    filters.unshift(function(packet,context,pathParams,next) {
        if (packet.entity && packet.entity.resource) {
            packet.resource = packet.entity.resource;
        }
        return next();
    });

    return filters;
};
ozpIwc.DataApi.declareRoute({
    action: ["removeChild"],
    resource: "{resource:.*}",
    filters: ozpIwc.DataApi.removeChildFilter()
}, function(packet, context, pathParams) {
    context.node.set(packet);
    return {
        response: "ok"
    };
});
