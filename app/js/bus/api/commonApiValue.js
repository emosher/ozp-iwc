
/**
 * The base class for values in the various APIs.  Designed to be extended with API-specific
 * concerns and validation.
 * @class
 * @param {object} config
 * @param {string} config.name - the name of this resource
 */
ozpIwc.CommonApiValue = function(config) {
	config = config || {};
	this.watchers= config.watchers || [];
	this.resource=config.resource;
    this.allowedContentTypes=config.allowedContentTypes;
    this.entity=config.entity;
	this.contentType=config.contentType;
	this.permissions=config.permissions || {};
	this.version=config.version || 0;
    
    this.persist=true;
    this.deleted=true;
};

/**
 * Sets a data based upon the content of the packet.  Automatically updates the content type,
 * permissions, entity, and updates the version.
 * 
 * @param {ozpIwc.TransportPacket} packet
 * @returns {undefined}
 */
ozpIwc.CommonApiValue.prototype.set=function(packet) {
	if(this.isValidContentType(packet.contentType)) {
		this.permissions=packet.permissions || this.permissions;
		this.contentType=packet.contentType;
		this.entity=packet.entity;
		this.version++;
	}
};
/**
 * Adds a new watcher based upon the contents of the packet.
 * @param {ozpIwc.TransportPacket} packet
 * @returns {undefined}
 */
ozpIwc.CommonApiValue.prototype.watch=function(packet) {
	this.watchers.push({
		src: packet.src,
		msgId: packet.msgId
	});
};

/**
 * Removes a previously registered watcher.  An unwatch on
 * someone who isn't actually watching is not an error-- 
 * the post condition is satisfied.
 * 
 * @param {ozpIwc.TransportPacket} packet
 * @returns {undefined}
 */
ozpIwc.CommonApiValue.prototype.unwatch=function(packet) {
	this.watchers=this.watchers.filter(function(w) {
		return packet.replyTo !== w.msgId && packet.src !==w.src;
	});
};

/**
 * Invokes the callback on each watcher.
 * @param {function} callback
 * @param {object} [self] - Used as 'this' for the callback.  Defaults to the Value object.
 * @returns {undefined}
 */
ozpIwc.CommonApiValue.prototype.eachWatcher=function(callback,self) {
	self=self || this;
	return this.watchers.map(callback,self);
};

/**
 * Resets the data to an empy state-- undefined entity and contentType, no permissions,
 * and version of 0.  It does NOT remove watchers.  This allows for watches on values
 * that do not exist yet, or will be created in the future.
 * 
 * @returns {undefined}
 */
ozpIwc.CommonApiValue.prototype.deleteData=function() {
	this.entity=undefined;
	this.contentType=undefined;
	this.permissions=[];
	this.version=0;
    this.deleted=true;
};

/**
 * Turns this value into a packet.
 * 
 * @param {ozpIwc.TransportPacket} base - Fields to be merged into the packet.
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.CommonApiValue.prototype.toPacket=function(base) {
	base = base || {};
	base.entity=ozpIwc.util.clone(this.entity);
	base.contentType=this.contentType;
	base.permissions=ozpIwc.util.clone(this.permissions);
	base.eTag=this.version;
	base.resource=this.resource;
	return base;
};

/**
 * Determines if the contentType is acceptable to this value.  Intended to be
 * overriden by subclasses.
 * @param {string} contentType
 * @returns {Boolean}
 */
ozpIwc.CommonApiValue.prototype.isValidContentType=function(contentType) {
    if(this.allowedContentTypes && this.allowedContentTypes.indexOf(contentType) < 0) {
        throw new ozpIwc.ApiError("badContent",
                "Bad contentType " + contentType +", expected " + this.allowedContentTypes.join(","));
     } else {
        return true;
    }
};

/**
 * Generates a point-in-time snapshot of this value that can later be sent to
 * {@link ozpIwc.CommonApiValue#changesSince} to determine the changes made to the value.
 * This value should be considered opaque to consumers.
 * 
 * <p> For API subclasses, the default behavior is to simply call toPacket().  Subclasses
 * can override this, but should likely override {@link ozpIwc.CommonApiValue#changesSince}
 * as well.
 * 
 * @returns {object}
 */
ozpIwc.CommonApiValue.prototype.snapshot=function() {
	return this.toPacket();
};

/**
 * From a given snapshot, create a change notifications.  This is not a delta, rather it's
 * change structure.
 * <p> API subclasses can override if there are additional change notifications (e.g. children in DataApi).

 * @param {object} snapshot
 * @returns {ozpIwc.CommonApiValue.prototype.changesSince.Anonym$1}
 */
ozpIwc.CommonApiValue.prototype.changesSince=function(snapshot) {
	if(snapshot.eTag === this.version) {
        return null;
    }
	return {
			'newValue': ozpIwc.util.clone(this.entity),
			'oldValue': snapshot.entity
	};
};

/**
 * Returns true if the value of this is impacted by the value of node.
 * For nodes that base their value off of other nodes, override this function.
 * @param {type} node 
 * @returns boolean
 */
ozpIwc.CommonApiValue.prototype.isUpdateNeeded=function(node) {
    return false;
};

/**
 * Update this node based upon the changes made to changedNodes.
 * @param {ozpIwc.CommonApiValue[]} changedNodes - Array of all nodes for which isUpdatedNeeded returned true.
 * @returns {ozpIwc.CommonApiValue.changes}
 */
ozpIwc.CommonApiValue.prototype.updateContent=function(changedNodes) {
    return null;
};

ozpIwc.CommonApiValue.prototype.deserialize=function(serverData) {
};
