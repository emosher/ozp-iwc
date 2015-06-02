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
        {
            link: ozpIwc.linkRelPrefix+":user-data",
            headers: []
        }
    ];

    this.on("changed",function(node) {
        if(node.persist) {
            this.persistenceQueue.queueNode(this.name + "/" + node.resource, node);
        }
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
        packet.resource = createKey.call(this,packet.resource + "/");
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
    var removeChild = function(packet,context,pathParams,next) {
        if (packet.entity && packet.entity.resource) {
            packet.resource = packet.entity.resource;
            context.node = this.data[packet.resource];
            if(context.node) {
                context.node.markAsDeleted(packet);
            }
        }
        return next();
    };

    filters.unshift(removeChild);

    return filters;
};
ozpIwc.DataApi.declareRoute({
    action: ["removeChild"],
    resource: "{resource:.*}",
    filters: ozpIwc.DataApi.removeChildFilter()
}, function(packet, context, pathParams) {
    return {response: "ok"};
});
