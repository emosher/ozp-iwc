/**
 * @submodule bus.service.Value
 */

/**
 * @class DataNode
 * @namespace ozpIwc
 * @extends ozpIwc.ApiNode
 * @constructor
 */
ozpIwc.DataNode=ozpIwc.util.extend(ozpIwc.ApiNode,function(config) {
   this.children=[];
   ozpIwc.ApiNode.apply(this, arguments);
});

ozpIwc.DataNode.prototype.uriTemplate="ozp:data-item";
/**
 * Serialize the node to a form that conveys both persistent and
 * ephemeral state of the object to be handed off to a new API
 * leader.
 *
 * @method serializeLive
 * @returns {Object}
 */
ozpIwc.DataNode.prototype.serializeLive=function() {
    var s=ozpIwc.ApiNode.prototype.serializeLive.apply(this,arguments);
    s.children=this.children;
    return s;
};

/**
 * Set the node using the state returned by serializeLive.
 *
 * @method deserializeLive
 * @param packet
 */
ozpIwc.DataNode.prototype.deserializeLive=function(packet) {
    ozpIwc.ApiNode.prototype.deserializeLive.apply(this,arguments);
    this.children = packet.children || this.children;
};

/**
 * Serializes the node for persistence to the server.
 *
 * @method serializedEntity
 * @returns {String}
 */
ozpIwc.DataNode.prototype.serializedEntity=function() {
    return JSON.stringify({
        key: this.resource,
        entity: {
            entity: this.entity,
            children: this.children
        },
        contentType: this.contentType,
        permissions: this.permissions,
        version: this.version,
        _links: {
            self: {
                href: this.self
            }
        }
    });
};

/**
 * The content type of the data returned by serializedEntity()
 *
 * @method serializedContentType
 * @returns {string}
 */
ozpIwc.DataNode.prototype.serializedContentType=function() {
    return "application/vnd.ozp-iwc-data-object+json";
};

/**
 * Sets the api node from the serialized form.
 *
 * @method deserializedEntity
 * @param {String} serializedForm
 * @param {String} contentType
 */
ozpIwc.DataNode.prototype.deserializedEntity=function(serializedForm,contentType) {
    if(typeof(serializedForm) === "string") {
        serializedForm=JSON.parse(serializedForm);
    }
    if(!this.resource) {
        this.resourceFallback(serializedForm);
    }
    this.entity=serializedForm.entity.entity;
    this.children=serializedForm.entity.children;
    this.contentType=serializedForm.contentType;
    this.permissions=serializedForm.permissions;
    this.version=serializedForm.version;
    if(serializedForm._links && serializedForm._links.self) {
        this.self=serializedForm._links.self.href;
    }
};

/**
 * If a resource path isn't given, this takes the best guess at assigning it.
 * @override
 * @method resourceFallback
 * @param serializedForm
 */
ozpIwc.DataNode.prototype.resourceFallback = function(serializedForm) {
    if(serializedForm.key) {
        this.resource = ((serializedForm.key.charAt(0) === "/") ? "" : "/") + serializedForm.key;
    }
};