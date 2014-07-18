var ozpIwc=ozpIwc || {};

ozpIwc.DataApi = ozpIwc.util.extend(ozpIwc.CommonApiBase,function() {
    ozpIwc.metrics.counter('iwc.dataApi.dataRegistered').inc();
	ozpIwc.CommonApiBase.apply(this,arguments);
});

ozpIwc.DataApi.prototype.makeValue = function(packet){
    ozpIwc.metrics.meter('iwc.dataApi.' + this.participant.address + '.makeValue').mark();
    return new ozpIwc.DataApiValue({resource: packet.resource});
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
        'action': 'ok',
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
        'action':'ok',
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
        'action':'ok'
    });
};