var ozpIwc=ozpIwc || {};

ozpIwc.SystemApi = ozpIwc.util.extend(ozpIwc.CommonApiBase,function(config) {
    ozpIwc.CommonApiBase.apply(this,arguments);
//    this.participant.securityAttributes=config.securityAttributes;
    if (config.userHref) {
        this.loadServerDataEmbedded({href: config.userHref, resource: '/user'})
            .success(function () {
                //Add on load code here
            });
    }
    if (config.systemHref) {
        this.loadServerDataEmbedded({href: config.systemHref, resource: '/system'})
            .success(function () {
                //Add on load code here
            });
    }
});

ozpIwc.SystemApi.prototype.makeValue = function(packet){
    return new ozpIwc.SystemApiValue({resource: packet.resource, entity: packet.entity, contentType: packet.contentType, systemApi: this});
};

ozpIwc.SystemApi.prototype.isPermitted=function(node,packetContext) {
    var originalNode=node;
    var originalPacketContext=packetContext;
    if (packetContext.packet.action==='set' || packetContext.packet.action==='delete') {
        node.permissions.modifyAuthority='apiLoader';
        if (packetContext.packet.securityAttributes) {
            packetContext.srcSubject=packetContext.srcSubject || {};
            Object.keys(packetContext.packet.securityAttributes).forEach(function(key) {
                packetContext.srcSubject[key]=packetContext.packet.securityAttributes[key];
            });
        }
    } else {
        delete node.permissions.modifyAuthority;
    }
    for (var i in arguments) {
        if (arguments[i] === originalNode) {
            arguments[i]=node;
        } else if (arguments[i] === originalPacketContext) {
            arguments[i]=packetContext;
        }
    }
    var retVal=ozpIwc.CommonApiBase.prototype.isPermitted.apply(this,arguments);
    delete node.permissions.modifyAuthority;
    return retVal;
};

/**
 * Loads the user and system data from the specified href. Data must be of hal/json type and
 * the keys 'user' and 'system' in the '_embedded' property must have object values that
 * correspond to user and system, respectively.
 *
 * @param config {Object}
 * @param config.href {String}
 * @returns {ozpIwc.AsyncAction}
 */
ozpIwc.SystemApi.prototype.loadServerDataEmbedded = function (config) {
    var self = this;
    var asyncResponse = new ozpIwc.AsyncAction();
    ozpIwc.util.ajax({
        href: config.href,
        method: "GET"
    })
        .success(function (data) {
            var value=self.findOrMakeValue({'resource': config.resource});
            value.set({entity: data});
            asyncResponse.resolve("success");
        })
        .failure(function(data) {
            console.log("AJAX failure response: " + data)
            asyncResponse.resolve("failure",data);
        });

    return asyncResponse;
};

/**
 * This systemApi launch function issues activates the new application.
 * Currently, it will just call window.open. 
 * Later, it will fire an intent for a registered app manager handler to launch (showing the user 
 * a choice of containers if more than one is registered.  Default is window.open.).
 * Finally, it will populate the launch mailbox to support passing data to the new application.
 * 
 * Parameter packet is of type invokeIntent, from "ozp intents handler v1 json".  See wiki.
 * 
 * @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 * @returns {windowObjectReference}
 */
ozpIwc.SystemApi.prototype.handleLaunch = function(node, packetContext){
	// Should use resource in packet as the key to look up the application node...
	// then use the application node to find the entity launch url, and issue that 
	// to window.open.
	
	var packet = packetContext.packet;
	
	// look up packetContext.packet.resource in node.entity[]._links.self
	// when match found, get launch url and call launchCommand
	node.resource === packet.resource;
	var launch_url = node.entity._links.launch.default;
	
	var windowObjectReference = this.launchCommand(node.entity._links, launch_url);
	//return new ozpIwc.SystemApiValue({resource: packet.resource, contentType: packet.contentType, systemApi: this});
	return windowObjectReference;
};

/**
 * Helper funtion for 'launch'. Opens application.
 * 
 * @param url {String}
 * @returns {windowObjectReference}
 */
ozpIwc.SystemApi.prototype.launchCommand = function(_links, url) {
	return window.open(url);
};
