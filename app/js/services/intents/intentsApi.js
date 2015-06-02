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
        {
            link: ozpIwc.linkRelPrefix+":intent",
            headers: []
        }
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
    return this.handleInflightIntentState(inflightNode).then(function() {
        return {
            entity: {
                inFlightIntent: inflightNode.resource
            }
        };
    });
};

ozpIwc.IntentsApi.prototype.handleInflightIntentState=function(inflightNode) {
    var self=this;
    switch(inflightNode.entity.state){
        case "choosing":
            var showChooser=function(err) {
                console.log("Picking chooser because",err);
                ozpIwc.util.openWindow(ozpIwc.intentsChooserUri, {
                    "ozpIwc.peer": ozpIwc.BUS_ROOT,
                    "ozpIwc.intentSelection": "intents.api" + inflightNode.resource
                },ozpIwc.INTENT_CHOOSER_FEATURES);
            };
            return this.getPreference(inflightNode.entity.intent.type+"/"+inflightNode.entity.intent.action).then(function(handlerResource) {
                if(handlerResource in self.data) {
                    inflightNode.setHandlerResource({
                        'state': "delivering",
                        'handlerChosen' : {
                            'resource': handlerResource,
                            'reason': "remembered"
                        }
                    });
                } else {
                    showChooser();
                }
            }).catch(showChooser);
        case "delivering":
            var handlerNode=this.data[inflightNode.entity.handlerChosen.resource];

            var packet = ozpIwc.util.clone(handlerNode.entity.invokeIntent);
            packet.entity = packet.entity || {};
            packet.replyTo = handlerNode.replyTo;
            packet.entity.inFlightIntent = inflightNode.resource;
            packet.entity.inFlightIntentEntity= inflightNode.entity;
            console.log(this.logPrefix+"delivering intent:",packet);
            // TODO: packet permissions
            this.send(packet);
            break;
        default:
            break;
    }
    return Promise.resolve();
};

ozpIwc.IntentsApi.declareRoute({
    action: "set",
    resource: "/inFlightIntent/{id}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.IntentsInFlightNode)
}, function(packet, context, pathParams) {
    context.node.set(packet);
    return this.handleInflightIntentState(context.node).then(function() {
        return {response: "ok"};
    });
});

//====================================================================
// Handler endpoints
//====================================================================
ozpIwc.IntentsApi.useDefaultRoute(["get","delete", "watch", "unwatch"], "/{major}/{minor}/{action}/{handlerId}");

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
        packet, 
        pathParams.major+"/"+pathParams.minor,
        pathParams.action,
        [context.node]
    );
});
ozpIwc.IntentsApi.declareRoute({
    action: "set",
    resource: "/{major}/{minor}/{action}/{handlerId}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.IntentHandlerNode, "application/vnd.ozp-iwc-intent-handler-v1+json")
}, function(packet, context, pathParams) {
    context.node.set(packet);
    return {"response": "ok"};
});

//====================================================================
// Action endpoints
//====================================================================
ozpIwc.IntentsApi.declareRoute({
    action: "register",
    resource: "/{major}/{minor}/{action}",
    filters: ozpIwc.standardApiFilters.setFilters(null, "application/vnd.ozp-iwc-intent-handler-v1+json")
}, function(packet, context, pathParams) {
    var key = this.createKey(context.node.resource + "/");
    var childNode = new ozpIwc.IntentHandlerNode({'resource': key});
    this.data[childNode.resource]=childNode;
    childNode.set(packet);
    ozpIwc.log.debug(this.logPrefix+" registered ",childNode);
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
        packet, 
        pathParams.major+"/"+pathParams.minor,
        pathParams.action,
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


