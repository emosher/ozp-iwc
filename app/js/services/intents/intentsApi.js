/**
 * @submodule bus.service.Type
 */

/**
 * The Intents Api.
 * Subclasses the {{#crossLink "ozpIwc.ApiBase"}}{{/crossLink}}.
 *
 * @class IntentsApi
 * @namespace ozpIwc
 * @extends ozpIwc.ApiBase
 * @constructor
 */
ozpIwc.IntentsApi = ozpIwc.createApi(function(config) {
    this.persistenceQueue = config.persistenceQueue || new ozpIwc.AjaxPersistenceQueue();
    this.endpoints=[
        ozpIwc.linkRelPrefix+":intent"
    ];
    this.on("changed", function(node) {
        this.persistenceQueue.queueNode(this.name + "/" + node.resource, node);
    }, this);
});

/**
 * Generates a unique key with the given prefix.
 * @TODO should this be in the apiBase?
 * @param prefix
 * @returns {*}
 */
ozpIwc.IntentsApi.prototype.createKey = function(prefix) {
    prefix = prefix || "";
    var key;
    do {
        key = prefix + ozpIwc.util.generateId();
    } while (key in this.data);
    return key;
};

// turn on bulkGet and list for everything
ozpIwc.IntentsApi.useDefaultRoute(["bulkGet", "list"]);

//====================================================================
// Intent Invocation Endpoints
//====================================================================
ozpIwc.IntentsApi.prototype.getHandlerPreference=function(inflightNode) {
    return Promise.reject("TO BE IMPLEMENTED: Fetch the value from the data.api");
};

ozpIwc.IntentsApi.prototype.invokeIntentHandler=function(packet,type,action,handlers) {
    var inflightNode = new ozpIwc.IntentsInFlightNode({
        resource: this.createKey("/inFlightIntent/"),
        invokePacket: packet,
        type: type,
        action: action,
        handlerChoices: handlers
    });
    
    this.data[inflightNode.resource] = inflightNode;
    this.addWatcher(inflightNode.resource,{src:packet.src,replyTo:packet.msgId});
    this.handleInflightIntentState(inflightNode);
    return {
        entity: {
            inFlightIntent: inflightNode.resource
        }
    };
};

ozpIwc.IntentsApi.prototype.handleInflightIntentState=function(inflightNode) {
    switch(inflightNode.entity.state){
        case "choosing":
            this.getHandlerPreference(inflightNode).then(function(handlerResource) {
                inflightNode.setHandlerResource(handlerResource,"remembered");
            }).catch(function(){
                ozpIwc.util.openWindow("intentsChooser.html", {
                    "ozpIwc.peer": ozpIwc.BUS_ROOT,
                    "ozpIwc.intentSelection": "intents.api" + inflightNode.resource
                });
            });
            break;
        case "delivering":
            var handlerNode=this.data[inflightNode.entity.handlerChosen.resource];

            var packet = ozpIwc.util.clone(handlerNode.entity.invokeIntent);
            packet.src=this.participant.name;
            packet.entity = packet.entity || {};
            packet.entity.inFlightIntent = inflightNode.resource;
            packet.entity.inFlightIntentEntity= inflightNode.entity;
            // TODO: packet permissions
            return this.participant.send(packet);
            break;
        default:
            break;
    }
};

ozpIwc.IntentsApi.declareRoute({
    action: "set",
    resource: "/inFlightIntent/{id}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.IntentsInFlightNode, "application/vnd.ozp-iwc-intent-invocation-v1+json")
}, function(packet, context, pathParams) {
    context.node.set(packet);
    this.handleInflightIntentState(context.node);
});

//====================================================================
// Handler endpoints
//====================================================================
ozpIwc.IntentsApi.useDefaultRoute(["get", "set","delete", "watch", "unwatch"], "/{major}/{minor}/{action}/{handlerId}");

/**
 * A route for intent handler invocations.
 * Invokes a specific handler directly
 */
ozpIwc.IntentsApi.declareRoute({
    action: "invoke",
    resource: "/{major}/{minor}/{action}/{handlerId}",
    filters: []
}, function(packet, context, pathParams) {
    return this.invokeIntentHandler(
        pathParams.major+"/"+pathParams.minor,
        pathParams.action,
        packet, 
        [context.node]
    );
});

//====================================================================
// Action endpoints
//====================================================================
ozpIwc.IntentsApi.declareRoute({
    action: "register",
    resource: "/{major}/{minor}/{action}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.IntentsNode, "application/vnd.ozp-iwc-intent-handler-v1+json")
}, function(packet, context, pathParams) {
    var key = this.createKey(context.node.resource + "/");
    var childNode = this.createNode({'resource': key});
    childNode.set(packet);
    return {
        'response': 'ok',
        'entity': {
            'resource': childNode.resource
        }
    };
});

/**
 * A route for intent action invocations.
 * Will launch direct for user input if multiple options.
 */
ozpIwc.IntentsApi.declareRoute({
    action: "invoke",
    resource: "/{major}/{minor}/{action}",
    filters: []
}, function(packet, context, pathParams) {
    return this.invokeIntentHandler(
        pathParams.major+"/"+pathParams.minor,
        pathParams.action,
        packet, 
        this.matchingNodes(packet.resource+"/")
    );
});

/**
 * A route for getting Intent Actions (/{major}/{minor})
 * @TODO Is the following truly required?
 */
ozpIwc.IntentsApi.declareRoute({
    action: "get",
    resource: "/{major}/{minor}/{action}",
    filters: []
}, function(packet, context, pathParams) {
    if (context.node) {
        return {
            response: "ok",
            entity: {
                "type": pathParams.major + "/" + pathParams.minor,
                "action": pathParams.action,
                "handlers": this.matchingNodes(packet.resource).map(function(n) {
                    return n.entity.id; // Needs work
                })
            }
        };
    }
});

/**
 * A route for the following actions not handled by other routes: bulkGet, list, delete, watch, and unwatch.
 * Default route used.
 */
ozpIwc.IntentsApi.useDefaultRoute(["delete", "watch", "unwatch"],"/{major}/{minor}/{action}");

//====================================================================
// Content Type endpoints
//====================================================================
ozpIwc.IntentsApi.declareRoute({
    action: ["set", "delete"],
    resource: "/{major}/{minor}",
    filters: []
}, function(packet, context, pathParams) {
    throw new ozpIwc.NoPermissionError(packet);
});

ozpIwc.IntentsApi.declareRoute({
    action: "get",
    resource: "/{major}/{minor}",
    filters: []
}, function(packet, context, pathParams) {
    if (context.node) {
        // the following needs to be included, possibly via override of toPacket();
        //'invokeIntent': childNode
        return context.node.toPacket();
    } else {
        return {
            response: "ok",
            entity: {
                "type": pathParams.major + "/" + pathParams.minor,
                "actions": this.matchingNodes(packet.resource).map(function(n) {
                    return n.entity.action;
                })
            }
        };
    }
});


