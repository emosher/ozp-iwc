/**
 * @submodule bus.service.Type
 */

/**
 * The System Api. Provides reference data of registered applications, versions, and information about the current user
 * through the IWC. Subclasses the {{#crossLink "ozpIwc.ApiBase"}}{{/crossLink}}.
 *
 * @class NamesApi
 * @namespace ozpIwc
 * @extends ozpIwc.ApiBase
 * @constructor
 */
ozpIwc.SystemApi = ozpIwc.createApi(function(config) {
    // The stock initializeData should do fine for us here as we're not using
    // any special subclasses for these items.  Might have to revisit this at
    // some point.
    this.endpoints = [
			ozpIwc.linkRelPrefix + ":application",
        ozpIwc.linkRelPrefix + ":user",
        ozpIwc.linkRelPrefix + ":system"
    ];
    var self=this;
    this.on("createdNode",this.updateIntents,this);

    this.leaderPromise.then(function() {
        ozpIwc.log.debug("System.api registering for the launch intent");
        self.participant.send({
        'dst' : "intents.api",
        'src' : "system.api",
        'action': "set",
        'resource': "/application/vnd.ozp-iwc-launch-data-v1+json/run/system.api",
        'contentType': "application/vnd.ozp-iwc-intent-handler-v1+json",
        'entity': {
            'type': "application/vnd.ozp-iwc-launch-data-v1+json",
            'action': "run",
            'label': "Open in new tab",
            'invokeIntent': {
                'dst': "system.api",
                'action' : 'invoke',
                'resource' : "/launchNewWindow"
            }
        }}).catch(function(error) {
            ozpIwc.log.error("System.api failed to register for launch intent: ",error);
        });
    });
});

ozpIwc.SystemApi.prototype.updateIntents=function(node) {
    if(!node.entity || !node.entity.intents) {
        return;
    }
    node.entity.intents.forEach(function(i) {
        var icon = i.icon || (node.entity && node.entity.icons && node.entity.icons.small) ? node.entity.icons.small : '';
        var label = i.label || node.entity.name;
        this.participant.send({
            'dst' : "intents.api",
            'src' : "system.api",
            'action': "set",
            'resource': "/"+i.type+"/"+i.action+"/system.api"+node.resource.replace(/\//g,'.'),
            'contentType': "application/vnd.ozp-iwc-intent-handler-v1+json",
            'entity': {
                'type': i.type,
                'action': i.action,
                'icon': icon,
                'label': label,
                '_links': node.entity._links,
                'invokeIntent': {
                    'action' : 'launch',
                    'resource' : node.resource
                }
            }
        });
    },this);

};

//====================================================================
// Collection endpoints
//====================================================================
ozpIwc.SystemApi.useDefaultRoute(["bulkGet","list"]);
ozpIwc.SystemApi.declareRoute({
    action: "get",
    resource: "/{collection:user|application|system}",
    filters: []
}, function(packet,context,pathParams) {
    return {
        "contentType": "application/json",
        "entity": this.matchingNodes(packet.resource).map(function(node) {
            return node.resource;
         })
    };
});

//====================================================================
// User endpoints
//====================================================================
ozpIwc.SystemApi.useDefaultRoute(["get","watch","unwatch"],"/user");
ozpIwc.SystemApi.declareRoute({
    action: ["set", "delete"],
    resource: "/user",
    filters: []
}, function(packet, context, pathParams) {
    throw new ozpIwc.BadActionError(packet);
});

//====================================================================
// System endpoints
//====================================================================
ozpIwc.SystemApi.useDefaultRoute(["get","watch","unwatch"],"/system");

ozpIwc.SystemApi.declareRoute({
    action: ["set", "delete"],
    resource: "/system",
    filters: []
}, function(packet, context, pathParams) {
    throw new ozpIwc.BadActionError(packet);
});

//====================================================================
// Application Endpoints
//====================================================================
ozpIwc.SystemApi.useDefaultRoute(["get","watch","unwatch"],"/application/{id}");
ozpIwc.SystemApi.declareRoute({
    action: ["set", "delete"],
    resource: "/application/{id}",
    filters: []
}, function(packet, context, pathParams) {
    throw new ozpIwc.BadActionError(packet);
});
ozpIwc.SystemApi.declareRoute({
    action: ["launch"],
    resource: "/application/{id}",
    filters: ozpIwc.standardApiFilters.getFilters()
}, function(packet, context, pathParams) {
    ozpIwc.log.info(this.logPrefix+" launching ",packet.entity);
    this.participant.send({
        dst: "intents.api",
        contentType: "application/vnd.ozp-iwc-intent-handler-v1+json",
        action: "invoke",
        resource: "/application/vnd.ozp-iwc-launch-data-v1+json/run",
        entity: {
            "url": context.node.entity.launchUrls.default,
            "applicationId": context.node.resource,
            "launchData": packet.entity,
            "id": context.node.entity.id
        }
    });
    return {response: "ok"};
});

ozpIwc.SystemApi.declareRoute({
    action: ["invoke"],
    resource: "/launchNewWindow",
    filters: []
}, function(packet,context,pathParams) {
    ozpIwc.log.info(this.logPrefix+" handling launchdata ",packet.entity);
    if(packet.entity && packet.entity.inFlightIntent){
        ozpIwc.util.openWindow(packet.entity.inFlightIntentEntity.entity.url,{
            "ozpIwc.peer":ozpIwc.BUS_ROOT,
            "ozpIwc.inFlightIntent":packet.entity.inFlightIntent
        });
//        this.launchApplication(node,packetContext.packet.entity.inFlightIntent);
        return {'response': "ok"};
    } else{
        return {'response': "badResource"};
    }

});