ozpIwc.IntentsApiInFlightIntent = ozpIwc.util.extend(ozpIwc.ApiNode, function(config) {
    // Whatever we'd do for "super" is fine here.

    // Used when handling the failure case in the state machine.  Probably have
    // to add this into a setter function in order to have it be anything other
    // than null.
    this.invokePacket = config.invokePacket;
});
ozpIwc.IntentsApiInFlightIntent.prototype.acceptedStates = ["new", "choosing", "delivering", "running", "error", "complete"];

ozpIwc.IntentsApi = ozpIwc.createApi();

ozpIwc.IntentsApi.declareRoute({
    action: ["set"],
    resource: "/inFlightIntent/{id}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.IntentsApiInFlightIntent, "application/vnd.ozp-iwc-intent-invocation-v1+json")
}, function(packet, context, pathParams) {
    if (ozpIwc.IntentsApiInFlightIntent.acceptedStates.indexOf(packet.entity.state) > -1 &&
            (packet.entity.state !== "new" && packet.entity.state !== "delivering")) {
        // Notes on implementation:
        // packet.entity.state is the desired "new" state of the context node.
        // In all that follows, the serialize call turns the node into a packet
        // which can then be manipulated and passed to the set function in
        // order to update state.
        switch (packet.entity.state) {
            case "choosing":
                // We'll take the current node and update it immediately to the
                // delivering state and then invoke whatever intent was selected
                // by the user.
                //
                // Question: Can't we just do a 'set' on the node based on the
                // packet and achieve the same result, for "free?"
                // Something like:
                //      packet.entity.state = "delivering";
                //      context.node.set(packet);
                var updateNodeEntity = context.node.serialize();
                updateNodeEntity.entity.handlerChosen = {
                    'resource': packet.entity.resource,
                    'reason': packet.entity.reason
                };
                updateNodeEntity.entity.state = "delivering";
                context.node.set(updateNodeEntity);

                // Seems that we might have to port this over from the old API. It
                // also seems that we could simplify the call to have just the
                // packet.resource and the context.node as parameters.
                //
                // this.invokeIntentHandler(updateNodeEntity.resource, context, updateNodeEntity);
                break;

            case "running":
                // Same question arises here as in the choosing branch.  What's
                // so special about serializing the current node, setting some
                // stuff from the packet and then deserializing back?  Could not
                // the set work directly?  Should not?
                var updateNodeEntity = context.node.serialize();
                updateNodeEntity.entity.state = "running";
                updateNodeEntity.entity.handler.address = packet.entity.address;
                updateNodeEntity.entity.handler.resource = packet.entity.resource;
                context.node.set(updateNodeEntity);
                break;

            case "fail":
                // Does this apply?
                var invokePacket = context.node.invokePacket;
                // Ditto earlier remarks here.
                var updateNodeEntity = context.node.serialize();
                updateNodeEntity.entity.state = packet.entity.state;
                updateNodeEntity.entity.reply.contentType = packet.entity.reply.contentType;
                updateNodeEntity.entity.reply.entity = packet.entity.reply.entity;
                context.node.set(updateNodeEntity);

                // This seems interesting:  re-serialize it so that we have the
                // current state of the packet in order to mark the packet as
                // deleted.
                var snapshot = context.node.snapshot();
                context.node.markAsDeleted(snapshot);

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
                var updateNodeEntity = context.node.serialize();
                updateNodeEntity.entity.state = packet.entity.state;
                updateNodeEntity.entity.reply.contentType = packet.entity.reply.contentType;
                updateNodeEntity.entity.reply.entity = packet.entity.reply.entity;
                context.node.set(updateNodeEntity);

                var snapshot = context.node.snapshot();
                context.node.markAsDeleted(snapshot);
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

            default:
                // We would only get here if we added a state and forgot to manage
                // it with one of the cases.  In which case you deserve the
                // exception you get.
                throw new ozpIwc.BadActionError;
        }
        return {response: "ok"};

    }
    else {
        throw new ozpIwc.BadActionError;
    }
});

ozpIwc.IntentsApi.declareRoute({
    action: ["register"],
    resource: ["/{major}/{minor}/{action}/{handlerId}"],
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
    resource: ["/{major}/{minor}/{action}", "/{major}/{minor}/{action}/{handler}"],
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
