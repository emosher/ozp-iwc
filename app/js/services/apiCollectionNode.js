/**
 * Service API Value classes of the bus.
 * @module bus.service
 * @submodule bus.service.Value
 */
/**
 *
 * @class ApiCollectionNode
 * @namespace ozpIwc
 * @constructor
 * @param {Object} config
 * @param {String} config.resource
 * @param {String[]} config.allowedContentTypes
 * @param {Object} config.entity
 * @param {String} config.contentType
 * @param {Number} config.version
 * @param {String} config.self
 * @param {String} config.serializedEntity
 * @param {String} config.serializedContentType
 */
ozpIwc.ApiCollectionNode=ozpIwc.util.extend(ozpIwc.ApiNode,function(config) {
    ozpIwc.ApiNode.apply(this,arguments);
    if(!config.pattern) {throw "pattern required for collection matching.";}
    this.pattern = config.pattern;
    this.collection = [];
});


/**
 * Serialize the node to a form that conveys both persistent and
 * ephemeral state of the object to be handed off to a new API
 * leader.
 *
 * __Intended to be overridden by subclasses__
 * @method serializeLive
 * @returns {Object}
 */
ozpIwc.ApiCollectionNode.prototype.serializeLive=function() {
    return this.toPacket({
        deleted: this.deleted,
        pattern: this.pattern,
        lifespan: this.lifespan,
        allowedContentTypes: this.allowedContentTypes,
       _links: {
           self: {href: this.self}
       }
    });
};

/**
 * Set the node using the state returned by serializeLive.
 *
 * __Intended to be overridden by subclasses__
 *
 * @method deserializeLive
 * @param {Object} serializedForm The data returned from serializeLive
 * @return {Object} the content type of the serialized data
 */
ozpIwc.ApiCollectionNode.prototype.deserializeLive=function(serializedForm, serializedContentType) {
    ozpIwc.ApiNode.prototype.deserializeLive(this,arguments);
    this.pattern = serializedForm.pattern;
    this.collection = serializedForm.collection;
};


/**
 * Turns this value into a packet.
 *
 * @method toPacket
 * @param {ozpIwc.TransportPacket} base Fields to be merged into the packet.
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.ApiCollectionNode.prototype.toPacket=function(base) {
    base = base || {};
    base = ozpIwc.ApiNode.prototype.toPacket.apply(this,base);
    base.pattern = this.pattern;
    base.collection = this.collection;
    return base;
};



/**
 * Clears the entity of the node and marks as deleted.
 * @method markAsDeleted
 * @param {ozpIwc.TransportPacket} packet @TODO unused?
 */
ozpIwc.ApiCollectionNode.prototype.markAsDeleted=function(packet) {
    this.version++;
    this.deleted=true;
    this.entity=null;
};


/**
 * From a given snapshot, create a change notifications.  This is not a delta, rather it's
 * change structure.
 * <p> API subclasses can override if there are additional change notifications (e.g. children in DataApi).
 *
 * @method changesSince
 * @param {object} snapshot The state of the value at some time in the past.
 * @returns {Object} A record of the current value and the value of the snapshot.
 */
ozpIwc.ApiNode.prototype.changesSince=function(snapshot) {
    if(snapshot.eTag === this.version) {
        return null;
    }
    return {
        'newValue': this.toPacket(),
        'oldValue': snapshot
    };
};