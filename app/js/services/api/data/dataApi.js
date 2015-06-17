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
 * @override
 * @method createNodeObject
 * @param {type} config
 * @returns {ozpIwc.DataNode}
 */
ozpIwc.DataApi.prototype.createNodeObject=function(config) {
    return new ozpIwc.DataNode(config);
};

// Default handlers are fine anything
ozpIwc.DataApi.useDefaultRoute(["get","set","list","delete","bulkGet"]);

//============================================
// Watch/Unwatch: varies from apiBase with the concept that:
//                - all who watch also are collectors.
//                - Default pattern = <resource> + "/"
//                - watching a resource creates it (for ability to collect)
//                - unwatching follows getFilters
//============================================
ozpIwc.DataApi.declareRoute({
    action: ["watch"],
    resource: "{resource:.*}",
    filters: ozpIwc.standardApiFilters.createAndCollectFilters(ozpIwc.DataNode)
}, function(packet, context, pathParams) {
    this.addWatcher(packet.resource,{
        src: packet.src,
        replyTo: packet.msgId
    });
    this.addCollector(context.node);

    if(context.node.entity || context.node.collection.length > 0) {
        return context.node.toPacket();
    } else {
        return { response: "ok"};
    }
});

ozpIwc.DataApi.declareRoute({
    action: ["unwatch"],
    resource: "{resource:.*}",
    filters: ozpIwc.standardApiFilters.getFilters()
}, function(packet, context, pathParams) {
    this.removeWatcher(packet.resource,packet);
    this.removeCollector(context.node);
    return { response: "ok" };
});


//============================================
// Add/Remove Child:
//============================================
var addChildFilters = function(){
    var childsPattern;
    var filters = ozpIwc.standardApiFilters.createAndCollectFilters(ozpIwc.DataNode);

    //Stash the child's pattern for now and create the parent.
    filters.unshift(function(packet,context,pathParams,next) {
        childsPattern = packet.pattern;
        packet.pattern = null;

        if(context.node && context.node.pattern) {
            packet.pattern = context.node.pattern;
        }
        return next();
    });

    //Replace the childs pattern at the end of the filter chain
    filters.push(function(packet,context,pathParams,next) {
        packet.pattern = childsPattern;
        return next();
    });
};

ozpIwc.DataApi.declareRoute({
    action: ["addChild"],
    resource: "{resource:.*}",
    filters: addChildFilters()
}, function(packet, context, pathParams) {
    var key = this.createKey(context.node.pattern);
    packet.resource = key;
    packet.pattern =  packet.pattern || key + "/";
    var childNode = this.createNode({resource: key}, ozpIwc.DataNode);
    this.markForChange(childNode);
    childNode.set(packet);

    return {
        response: "ok",
        entity: {
            resource: childNode.resource
        }
    };
});

/**
 * A filter for the removeChild action.
 * @method removeChildFilter
 * @static
 * @returns {Function[]}
 */
//ozpIwc.DataApi.removeChildFilter= function() {
//    var filters = ozpIwc.standardApiFilters.deleteFilters();
//    var removeChild = function(packet,context,pathParams,next) {
//        if (packet.entity && packet.entity.resource) {
//            packet.resource = packet.entity.resource;
//            context.node = this.data[packet.resource];
//            if(context.node) {
//                this.markForChange(context.node);
//                context.node.markAsDeleted(packet);
//            }
//            return next();
//        } else {
//            throw new ozpIwc.NoResourceError(" 'resource' property not found in message entity.");
//        }
//    };
//
//    filters.unshift(removeChild);
//
//    return filters;
//};

ozpIwc.DataApi.declareRoute({
    action: ["removeChild"],
    resource: "{resource:.*}",
    filters: ozpIwc.standardApiFilters.deleteFilters()
}, function(packet, context, pathParams) {
    if (packet.entity && packet.entity.resource) {
        packet.resource = packet.entity.resource;
        context.node = this.data[packet.resource];
        if (context.node) {
            this.markForChange(context.node);
            context.node.markAsDeleted(packet);
        }
    }
    return {response: "ok"};
});