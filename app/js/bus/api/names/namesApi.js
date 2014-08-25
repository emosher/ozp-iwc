ozpIwc.NamesApi = ozpIwc.util.extend(ozpIwc.CommonApiBase, function() {
    ozpIwc.CommonApiBase.apply(this, arguments);
    
    // map the alias "/me" to "/address/{packet.src}" upon receiving the packet
    this.on("receive", function(packetContext) {
        var packet = packetContext.packet;
        if (packet.resource) {
            packet.resource = packet.resource.replace(/\/me/, packetContext.packet.src);
        }
    });
    
    this.addDynamicNode("/address",new ozpIwc.CommonApiCollectionValue({
        pattern: /^\/address\/.*$/,
        contentType: "application/ozpIwc-address-v1+json"
    }));
    this.addDynamicNode("/multicast",new ozpIwc.CommonApiCollectionValue({
        pattern: /^\/multicast\/.*$/,
        contentType: "application/ozpIwc-multicast-address-v1+json"        
    }));
    this.addDynamicNode("/router",new ozpIwc.CommonApiCollectionValue({
        pattern: /^\/router\/.*$/,
        contentType: "application/ozpIwc-router-v1+json"        
    }));
    this.addDynamicNode("/api",new ozpIwc.CommonApiCollectionValue({
        pattern: /^\/api\/.*$/,
        contentType: "application/ozpIwc-api-descriptor-v1+json"        
    }));

});

ozpIwc.NamesApi.prototype.validateResource=function(node,packetContext) {
    if(packetContext.packet.resource && !packetContext.packet.resource.match(/^\/(api|address|multicast|router|me)/)){
        throw new ozpIwc.ApiError('badResource',"Invalide resource for name.api: " + packetContext.packet.resource);
    }
};

ozpIwc.NamesApi.prototype.makeValue = function(packet) {
    
    var path=packet.resource.split("/");
    var config={
        resource: packet.resource,
        contentType: packet.contentType
    };
    
    // only handle the root elements for now...
    switch(path[1]) {
        case "api": config.allowedContentTypes=["application/ozpIwc-api-descriptor-v1+json"]; break;
        case "address": config.allowedContentTypes=["application/ozpIwc-address-v1+json"]; break;
        case "multicast": config.allowedContentTypes=["application/ozpIwc-multicast-address-v1+json"]; break;
        case "router": config.allowedContentTypes=["application/ozpIwc-router-v1+json"]; break;

        default:
            throw new ozpIwc.ApiError("badResource","Not a valid path of names.api: " + path[1] + " in " + packet.resource);
    }
    return new ozpIwc.NamesApiValue(config);            
};
