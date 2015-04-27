ozpIwc.IntentsApi = ozpIwc.createApi(function(config) {

});

ozpIwc.IntentsApi.declareRoute({
    action: ["set"],
    resource: "/inFlightIntent/{id}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.ApiNode, "application/vnd.ozp-iwc-intent-invocation-v1+json")
}, function(packet, context, pathParams) {
    // SO:  Seems like what we want to say in a lot of this code is more along
    // the lines of context.node.set(packet); or context.node.delete(packet);,
    // followed by a return of an OK response or a throw of the
    // ozpIwc.BadActionError.
    switch (packet.entity.state) {
        case "new":
            throw new ozpIwc.BadActionError();
        case "choosing":
            this.handleInFlightChoose(context.node, context);
            return {response: "ok"};
        case "delivering":
            // shouldn't be set externally
            context.replyTo({'response': 'badAction'});
            break;
        case "running":
            this.handleInFlightRunning(context.node, context);
            return {response: "ok"};
        case "fail":
            this.handleInFlightFail(context.node, context);
            return {response: "ok"};
        case "complete":
            this.handleInFlightComplete(context.node, context);
            return {response: "ok"};
        default:
            if (context.node.acceptedStates.indexOf(packet.entity.state) < 0) {
                throw new ozpIwc.BadActionError();
            }
            return {response: "ok"};
    }
});

ozpIwc.IntentsApi.declareRoute({
    action: ["register"],
    resource: "/{major}/{minor}/{action}/{handlerId}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.ApiNode, "application/vnd.ozp-iwc-intent-invocation-list-v1+json")
}, function(packet, context, pathParams) {
    var key = this.createKey(context.node.resource + "/");

    // This needs some work.  We shouldn't be porting over the findOrMakeValue.
    // var childNode = this.findOrMakeValue({'resource': key});
    var childNode=this.createNode({resource:key});
    var clone = ozpIwc.util.clone(childNode);
    clone.permissions = childNode.permissions.getAll();
    packet.entity.invokeIntent = packet.entity.invokeIntent || {};
    packet.entity.invokeIntent.dst = packet.src;
    packet.entity.invokeIntent.replyTo = packet.msgId;

    for (var i in packet.entity) {
        clone.entity[i] = packet.entity[i];
    }
    childNode.set(clone);

    context.replyTo({
        'response': 'ok',
        'entity': {
            'resource': childNode.resource
        }
    });
});

ozpIwc.IntentsApi.declareRoute({
    action: ["invoke"],
    resource: "/{major}/{minor}/{action}", // Does not support array of resources "/{major}/{minor}/{action}/{handler}"],
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.ApiNode, "application/vnd.ozp-iwc-intent-invocation-list-v1+json")
}, function(packet, context, pathParams) {
    var resource = this.createKey("/ozpIntents/invocations/");
    var inflightPacket = new ozpIwc.IntentsApiInFlightIntent({
        resource: resource,
        invokePacket: packet,
        contentType: context.node.contentType,
        type: context.node.entity.type,
        action: context.node.entity.action,
        entity: packet.entity,
        handlerChoices: context.node.getHandlers(context)
    });

    this.data[inflightPacket.resource] = inflightPacket;
    return inflightPacket;
});

// The handleXYZ from old API should be mapped onto actions at.
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
    // List of actions
});

// Defaults are fine except for the routes registered above.
ozpIwc.IntentsApi.useDefaultRoute(["bulkGet", "list", "delete", "watch", "unwatch"]);
ozpIwc.IntentsApi.useDefaultRoute(["get", "set", "bulkGet", "list", "delete", "watch", "unwatch"], "/{major}/{minor}/{action}/{handlerId}");




// Might there be a better way to deal with this, rather than making these
// functions available to every instance of the API?  Seems more private to
// route for invocation than something we want on the API itself.
ozpIwc.IntentsApi.prototype.handleDelete = function(node, packetContext) {
    delete this.data[node.resource];
    packetContext.replyTo({'response': 'ok'});
};

ozpIwc.IntentsApi.prototype.handleInFlightChoose = function(node, packetContext) {
    if (node.entity.state !== "choosing") {
        return null;
    }

    var handlerNode = this.data[packetContext.packet.entity.resource];
    if (!handlerNode) {
        return null;
    }

    if (node.acceptedReasons.indexOf(packetContext.packet.entity.reason) < 0) {
        return null;
    }

    var updateNodeEntity = node.serialize();

    updateNodeEntity.entity.handlerChosen = {
        'resource': packetContext.packet.entity.resource,
        'reason': packetContext.packet.entity.reason
    };
    updateNodeEntity.entity.state = "delivering";
    node.set(updateNodeEntity);

    this.invokeIntentHandler(handlerNode, packetContext, node);
};

ozpIwc.IntentsApi.prototype.handleInFlightRunning = function(node, packetContext) {
    var updateNodeEntity = node.serialize();
    updateNodeEntity.entity.state = "running";
    updateNodeEntity.entity.handler.address = packetContext.packet.entity.address;
    updateNodeEntity.entity.handler.resource = packetContext.packet.entity.resource;
    node.set(updateNodeEntity);
};

ozpIwc.IntentsApi.prototype.handleInFlightFail = function(node, packetContext) {
    var invokePacket = node.invokePacket;
    var updateNodeEntity = node.serialize();

    updateNodeEntity.entity.state = packetContext.packet.entity.state;
    updateNodeEntity.entity.reply.contentType = packetContext.packet.entity.reply.contentType;
    updateNodeEntity.entity.reply.entity = packetContext.packet.entity.reply.entity;

    node.set(updateNodeEntity);
    var snapshot = node.snapshot();
    this.handleDelete(node, packetContext);
    this.notifyWatchers(node, node.changesSince(snapshot));
    this.participant.send({
        replyTo: invokePacket.msgId,
        dst: invokePacket.src,
        response: 'ok',
        entity: {
            response: node.entity.reply,
            invoked: false
        }
    });
};

ozpIwc.IntentsApi.prototype.handleInFlightComplete = function(node, packetContext) {
    var invokePacket = node.invokePacket;
    var updateNodeEntity = node.serialize();

    updateNodeEntity.entity.state = packetContext.packet.entity.state;
    updateNodeEntity.entity.reply.contentType = packetContext.packet.entity.reply.contentType;
    updateNodeEntity.entity.reply.entity = packetContext.packet.entity.reply.entity;

    node.set(updateNodeEntity);
    var snapshot = node.snapshot();
    this.handleDelete(node, packetContext);
    this.notifyWatchers(node, node.changesSince(snapshot));
    this.participant.send({
        replyTo: invokePacket.msgId,
        dst: invokePacket.src,
        response: 'ok',
        entity: {
            response: node.entity.reply,
            invoked: true
        }
    });
};