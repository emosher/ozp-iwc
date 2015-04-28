ozpIwc.IntentsApi = ozpIwc.createApi(function(config) {
    this.persistenceQueue = config.persistenceQueue || new ozpIwc.AjaxPersistenceQueue();
    this.endpoints = [
        ozpIwc.linkRelPrefix + ":intent"
    ];

    this.on("changed", function(node) {
        console.log("Persisting " + node.resource);
        this.persistenceQueue.queueNode(this.name + "/" + node.resource, node);
    }, this);
});

ozpIwc.IntentsApi.prototype.createNode = function(config) {
    return new ozpIwc.IntentsNode(config);
};

ozpIwc.IntentsApi.declareRoute({
    action: ["set"],
    resource: "/inFlightIntent/{id}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.IntentsInFlightNode, "application/vnd.ozp-iwc-intent-invocation-v1+json")
}, function(packet, context, pathParams) {
    if (ozpIwc.IntentsInFlightNode.acceptedStates.indexOf(packet.entity.state) > -1 &&
            (packet.entity.state !== "new" && packet.entity.state !== "delivering")) {

        context.node.set(packet);
        switch (packet.entity.state) {
            case "choosing":
                // Seems that we might have to port this over from the old API. It
                // also seems that we could simplify the call to have just the
                // packet.resource and the context.node as parameters.
                //
                // this.invokeIntentHandler(updateNodeEntity.resource, context, updateNodeEntity);
                break;

            case "fail":
                var invokePacket = context.node.invokePacket;
                var snapshot = context.node.snapshot();
                // What to do regarding these next two calls?
                // this.notifyWatchers(node, node.changesSince(snapshot));

                /*this.participant.send({
                 replyTo: invokePacket.msgId,
                 dst: invokePacket.src,
                 response: 'ok',
                 entity: {
                 response: node.entity.reply,
                 invoked: false
                 }
                 });*/

                break;

            case "complete":
                var invokePacket = context.node.invokePacket;
                var snapshot = context.node.snapshot();

                // this.notifyWatchers(node, node.changesSince(snapshot));

                /*this.participant.send({
                 replyTo: invokePacket.msgId,
                 dst: invokePacket.src,
                 response: 'ok',
                 entity: {
                 response: node.entity.reply,
                 invoked: true
                 }
                 });*/
                break;
        }
        return {response: "ok"};
    }
    else {
        throw new ozpIwc.BadActionError;
    }
});

ozpIwc.IntentsApi.declareRoute({
    action: ["register"],
    resource: "/{major}/{minor}/{action}/{handlerId}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.ApiNode, "application/vnd.ozp-iwc-intent-invocation-list-v1+json")
}, function(packet, context, pathParams) {
    var childNode = this.createNode({'resource': key});
    childNode.set(packet);
    return {
        'response': 'ok',
        'entity': {
            'resource': childNode.resource
        }
    };
});

ozpIwc.IntentsApi.declareRoute({
    action: ["invoke"],
    resource: "/{major}/{minor}/{action}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.ApiNode, "application/vnd.ozp-iwc-intent-invocation-list-v1+json")
}, function(packet, context, pathParams) {
    var resource = this.createKey("/ozpIntents/invocations/");
    var inflightPacket = new ozpIwc.IntentsInFlightNode({
        resource: resource,
        invokePacket: packet,
        contentType: context.node.contentType,
        type: context.node.entity.type,
        action: context.node.entity.action,
        entity: packet.entity,
        handlerChoices: context.node.getHandlers(context)
    });

    this.data[inflightPacket.resource] = inflightPacket;
    return inflightPacket.toPacket();
});

ozpIwc.IntentsApi.declareRoute({
    action: ["set", "delete"],
    resource: "/{major}/{minor}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.ApiNode, "application/vnd.ozp-iwc-intent-invocation-list-v1+json")
}, function(packet, context, pathParams) {
    throw new ozpIwc.NoPermissionError(packet);
});
ozpIwc.IntentsApi.declareRoute({
    action: ["get"],
    resource: "/{major}/{minor}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.ApiNode, "application/vnd.ozp-iwc-intent-invocation-list-v1+json")
}, function(packet, context, pathParams) {
    if (context.node) {
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

// Defaults are fine except for the routes registered above.
ozpIwc.IntentsApi.useDefaultRoute(["bulkGet", "list", "delete", "watch", "unwatch"]);
ozpIwc.IntentsApi.useDefaultRoute(["get", "set", "bulkGet", "list", "delete", "watch", "unwatch"], "/{major}/{minor}/{action}/{handlerId}");
