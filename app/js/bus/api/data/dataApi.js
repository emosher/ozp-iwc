ozpIwc.DataApi = ozpIwc.util.extend(ozpIwc.CommonApiBase,function(config) {
	ozpIwc.CommonApiBase.apply(this,arguments);
    this.endpointName="data";
    this.loadFromServer();
});

ozpIwc.DataApi.prototype.makeValue = function(packet){
    return new ozpIwc.DataApiValue(packet);
};

ozpIwc.DataApi.prototype.createChild=function(node,packetContext) {
	var key=this.createKey(node.resource+"/");

	// save the new child
	var childNode=this.findOrMakeValue({'resource':key});
	childNode.set(packetContext.packet);
	return childNode;
};

ozpIwc.DataApi.prototype.handleList=function(node,packetContext) {
	packetContext.replyTo({
        'response': 'ok',
        'entity': node.listChildren()
    });
};

/**
 * @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.DataApi.prototype.handleAddchild=function(node,packetContext) {
	var childNode=this.createChild(node,packetContext);

	node.addChild(childNode.resource);
	
	packetContext.replyTo({
        'response':'ok',
        'entity' : {
            'resource': childNode.resource
        }
    });
};

/**
 * @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.DataApi.prototype.handleRemovechild=function(node,packetContext) {
    node.removeChild(packetContext.packet.entity.resource);
	// delegate to the handleGet call
	packetContext.replyTo({
        'response':'ok'
    });
};
