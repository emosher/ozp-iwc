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


ozpIwc.DataApi.declareRoute({
    action: ["addChild"],
    resource: "{resource:.*}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.DataNode)
}, function(packet, context, pathParams) {
    var key,childNode;
    do {
        key =packet.resource + "/" + ozpIwc.util.generateId();
    } while(key in this.data);

    childNode = this.createNode({resource: key}, ozpIwc.DataNode);
    childNode.set(packet);
    context.node.addChild(key);

    return {
        response: "ok",
        entity: {
            resource: childNode.resource
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

/**
 * From a given snapshot, create a change notifications.  This is not a delta, rather it's
 * change structure.
 * <p> API subclasses can override if there are additional change notifications (e.g. children in DataApi).
 *
 * @method changesSince
 * @param {object} snapshot The state of the value at some time in the past.
 * @returns {Object} A record of the current value and the value of the snapshot.
 */
ozpIwc.DataApi.prototype.changesSince=function(snapshot) {
    var changes = ozpIwc.ApiNode.prototype.changesSince.apply(this, arguments);
    if (changes) {
        changes.removedChildren = snapshot.links.children.filter(function (f) {
            return this.indexOf(f) < 0;
        }, this.children);
        changes.addedChildren = this.children.filter(function (f) {
            return this.indexOf(f) < 0;
        }, snapshot.links.children);
    }
    return changes;
};