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
});

/**
 * Override the default node type to be a DataNode.
 * @param {type} config
 * @returns {ozpIwc.DataNode}
 */
ozpIwc.SystemApi.prototype.createNode=function(config) {
    return new ozpIwc.ApiNode(config);
};

//====================================================================
// Collection endpoints
//====================================================================
ozpIwc.SystemApi.useDefaultRoute(["bulkGet","list"],"/{c:user|application|system");
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
ozpIwc.SystemApi.declareRoute({
    action: ["launch"],
    resource: "/application/{id}",
    filters: []
}, function(packet, context, pathParams) {
    var sendPacket = {
        dst: "intents.api",
        contentType: "application/vnd.ozp-iwc-intent-handler-v1+json",
        action: "invoke",
        resource: "/application/vnd.ozp-iwc-launch-data-v1+json/run",
        entity: {
            "url": context.node.entity.launchUrls.default,
            "applicationId": context.node.resource,
            "launchData": packet.entity
        }
    };
    if (typeof context.node.entity.id !== "undefined") {
        sendPacket.entity.id = context.node.entity.id;
    }
    this.participant.send(sendPacket);
    return {response: "ok"};
});

ozpIwc.SystemApi.declareRoute({
    action: ["set", "delete"],
    resource: "/application/{id}",
    filters: []
}, function(packet, context, pathParams) {
    throw new ozpIwc.BadActionError(packet);
});