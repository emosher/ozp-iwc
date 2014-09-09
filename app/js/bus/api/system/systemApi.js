var ozpIwc=ozpIwc || {};

ozpIwc.SystemApi = ozpIwc.util.extend(ozpIwc.CommonApiBase,function(config) {
    ozpIwc.CommonApiBase.apply(this,arguments);
    
    this.addDynamicNode(new ozpIwc.CommonApiCollectionValue({
        resource: "/application",
        pattern: /^\/application\/.*$/,
        contentType: "application/ozpIwc-application-list-v1+json"
    }));
    
    this.on("changedNode",this.updateIntents,this);
       
    this.loadFromServer("applications");
    
    
    // @todo populate user and system endpoints
    this.data["/user"]=new ozpIwc.CommonApiValue({
        resource: "/user",
        contentType: "application/ozpIwc-user-v1+json",
        entity: {
            "name": "DataFaked BySystemApi",
            "userName": "fixmefixmefixme"
        }
    });
    this.data["/system"]=new ozpIwc.CommonApiValue({
        resource: "/system",
        contentType: "application/ozpIwc-system-info-v1+json",
        entity: {
            "version": "1.0",
            "name": "Fake Data from SystemAPI FIXME"
        }
    });    
});


ozpIwc.SystemApi.prototype.updateIntents=function(node,changes) {
    if(!node.getIntentsRegistrations) {
        return;
    }
    var intents=node.getIntentsRegistrations();
    if(!intents) {
        return;
    }
    intents.forEach(function(i) {
        this.participant.send({
            'dst' : "intents.api",
            'src' : "system.api",
            'action': "set",
            'resource': "/"+i.type+"/"+i.action+"/system.api"+node.resource.replace(/\//g,'.'),
            'contentType': "application/ozpIwc-intents-handler-v1+json",
            'entity': {
                'type': i.type,
                'action': i.action,
                'icon': i.icon,
                'label': i.label,
                '_links': node.entity['_links'],
                'invokeIntent': {
                    'action' : 'invoke',
                    'resource' : node.resource
                }
            }
        });
    },this);
    
};

ozpIwc.SystemApi.prototype.findNodeForServerResource=function(serverObject,objectPath,rootPath) {
    var resource="/application" + objectPath.replace(rootPath,'');
    return this.findOrMakeValue({
        'resource': resource,
        'entity': serverObject,
        'contentType': "ozpIwc-application-definition-v1+json"
    });
};

ozpIwc.SystemApi.prototype.makeValue = function(packet){
    if(packet.resource.indexOf("/mailbox") === 0) {
        return new ozpIwc.SystemApiMailboxValue({
            resource: packet.resource, 
            entity: packet.entity, 
            contentType: packet.contentType
        });
    }
        
    return new ozpIwc.SystemApiApplicationValue({
        resource: packet.resource, 
        entity: packet.entity, 
        contentType: packet.contentType, 
        systemApi: this
    });
};

ozpIwc.SystemApi.prototype.handleSet = function() {
    throw new ozpIwc.ApiError("badAction", "Cannot modify the system API");
};

ozpIwc.SystemApi.prototype.handleDelete = function() {
    throw new ozpIwc.ApiError("badAction", "Cannot modify the system API");
};

ozpIwc.SystemApi.prototype.handleLaunch = function(node,packetContext) {
    var key=this.createKey("/mailbox/");

	// save the new child
	var mailboxNode=this.findOrMakeValue({'resource':key});
	mailboxNode.set(packetContext.packet);
    
    this.launchApplication(node,mailboxNode);
    packetContext.replyTo({'action': "ok"});
};

ozpIwc.SystemApi.prototype.handleInvoke = function(node,packetContext) {
    var key=this.createKey("/mailbox/");

	// save the new child
	var mailboxNode=this.findOrMakeValue({'resource':key});
    mailboxNode.set({
        contentType: "application/ozpiwc-intent-invocation+json",
        permissions: packetContext.permissions,
        entity: packetContext.packet
    });
    
    this.launchApplication(node,mailboxNode);
    packetContext.replyTo({'action': "ok"});
};

ozpIwc.SystemApi.prototype.launchApplication=function(node,mailboxNode) {
    var launchParams=[
        "ozpIwc.peer="+encodeURIComponent(ozpIwc.BUS_ROOT),
        "ozpIwc.mailbox="+encodeURIComponent(mailboxNode.resource)
    ];
    
    window.open(node.entity['_links'].describes.href,launchParams.join("&"));    
};

