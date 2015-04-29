ozpIwc.IntentsApi = ozpIwc.createApi(function(config) {
    this.persistenceQueue = config.persistenceQueue || new ozpIwc.AjaxPersistenceQueue();
    this.endpoints = [
        ozpIwc.linkRelPrefix + ":intent"
    ];

    this.on("changed", function(node) {
        console.log("Persisting " + node.resource);
        this.persistenceQueue.queueNode(this.name + "/" + node.resource, node);
    }, this);

    this.makeInvocationNode = function(packet, context) {
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
        return inflightPacket;
    };
});

ozpIwc.IntentsApi.prototype.createNode = function(config) {
    return new ozpIwc.IntentsNode(config);
};

ozpIwc.IntentsApi.declareRoute({
    action: "set",
    resource: "/inFlightIntent/{id}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.IntentsInFlightNode, "application/vnd.ozp-iwc-intent-invocation-v1+json")
}, function(packet, context, pathParams) {
    var invokePacket, snapshot;

    if (ozpIwc.IntentsInFlightNode.acceptedStates.indexOf(packet.entity.state) > -1 &&
            (packet.entity.state !== "new" && packet.entity.state !== "delivering")) {

        context.node.set(packet);
        switch (packet.entity.state) {
            case "choosing":
                var handlerNode = this.data[packet.entity.resource];
                if (handlerNode === null) {
                    return;
                }
                this.invokeIntentHandler(handlerNode, context, context.node);
                break;

            case "fail":
                invokePacket = context.node.invokePacket;
                snapshot = context.node.snapshot();

                // What to do regarding this next call?
                // this.notifyWatchers(node, node.changesSince(snapshot));

                this.participant.send({
                    replyTo: invokePacket.msgId,
                    dst: invokePacket.src,
                    response: 'ok',
                    entity: {
                        response: context.node.entity.reply,
                        invoked: false
                    }
                });

                break;

            case "complete":
                invokePacket = context.node.invokePacket;
                snapshot = context.node.snapshot();

                // What to do regarding this next call?
                // this.notifyWatchers(node, node.changesSince(snapshot));

                this.participant.send({
                    replyTo: invokePacket.msgId,
                    dst: invokePacket.src,
                    response: 'ok',
                    entity: {
                        response: context.node.entity.reply,
                        invoked: true
                    }
                });
                break;
        }
        return {response: "ok"};
    }
    else {
        throw new ozpIwc.BadActionError(packet);
    }
});

ozpIwc.IntentsApi.declareRoute({
    action: "register",
    resource: "/{major}/{minor}/{action}/{handlerId}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.ApiNode, "application/vnd.ozp-iwc-intent-invocation-list-v1+json")
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

ozpIwc.IntentsApi.declareRoute({
    action: "invoke",
    resource: "/{major}/{minor}/{action}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.ApiNode, "application/vnd.ozp-iwc-intent-invocation-list-v1+json")
}, function(packet, context, pathParams) {
    var flyingNode = this.makeInvocationNode(packet, context);
    var handlers = this.matchingNodes(packet.resource);
    var updateInFlightEntity = flyingNode.toPacket();
    if (handlers.length === 1) {
        // Only one option, fire it.
        updateInFlightEntity.entity.handlerChosen = {
            'resource': handlers[0].resource,
            'reason': "onlyOne"
        };
        updateInFlightEntity.entity.state = "delivering";
        flyingNode.set(updateInFlightEntity);

        this.invokeIntentHandler(handlers[0], context, flyingNode);
    }
    else {
        // Choose.
        var handler = this.chooseIntentHandler(context.node, context, flyingNode);
        updateInFlightEntity.entity.handlerChosen = {
            'resource': handler.resource,
            'reason': "user"
        };
        updateInFlightEntity.entity.state = "delivering";
        flyingNode.set(updateInFlightEntity);

        this.invokeIntentHandler(handler, context, flyingNode);
    }

    return flyingNode.toPacket();
});

ozpIwc.IntentsApi.declareRoute({
    action: ["set", "delete"],
    resource: "/{major}/{minor}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.ApiNode, "application/vnd.ozp-iwc-intent-invocation-list-v1+json")
}, function(packet, context, pathParams) {
    throw new ozpIwc.NoPermissionError(packet);
});
ozpIwc.IntentsApi.declareRoute({
    action: "get",
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

/**
 * Invokes an intent handler based on the given context.
 */
ozpIwc.IntentsApi.prototype.invokeIntentHandler = function(handlerNode, packetContext, inFlightIntent) {
    inFlightIntent = inFlightIntent || {};

    var packet = ozpIwc.util.clone(handlerNode.entity.invokeIntent);
    packet.entity = packet.entity || {};
    packet.entity.inFlightIntent = inFlightIntent.resource;
    packet.entity.inFlightIntentEntity = inFlightIntent.entity;
    packet.src = this.participant.name;
    var self = this;
    this.participant.send(packet, function(response, done) {
        var blacklist = ['src', 'dst', 'msgId', 'replyTo'];
        var packet = {};
        for (var k in response) {
            if (blacklist.indexOf(k) === -1) {
                packet[k] = response[k];
            }
        }
        self.participant.send({
            replyTo: packet.msgId,
            dst: packet.src,
            response: 'ok',
            entity: packet
        });
        packetContext.replyTo(packet);
        done();
    });
};

/**
 * Produces a modal for the user to select a handler from the given list of 
 * intent handlers.
 */
ozpIwc.IntentsApi.prototype.chooseIntentHandler = function(inflightPacket) {
    inflightPacket.entity.state = "choosing";
    ozpIwc.util.openWindow("intentsChooser.html", {
        "ozpIwc.peer": ozpIwc.BUS_ROOT,
        "ozpIwc.intentSelection": "intents.api" + inflightPacket.resource
    });
};
