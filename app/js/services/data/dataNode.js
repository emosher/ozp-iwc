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
    this.lifespan = new ozpIwc.Lifespan.Persistent();
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
        entity: this.entity,
        children: this.children,
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
    var data;
    if(typeof(serializedForm.entity) === "string") {
        data=JSON.parse(serializedForm.entity);
    } else {
        data = serializedForm.entity;
    }

    this.entity=data.entity;
    this.children=data.children;
    this.contentType=data.contentType;
    this.permissions=data.permissions;
    this.version=data.version;
    data._links = data._links || {};
    if(data._links.self) {
        this.self=data._links.self.href;
    }

    if (!this.resource) {
        if (data._links["ozp:iwcSelf"]) {
            this.resource = data._links["ozp:iwcSelf"].href.replace(/web\+ozp:\/\/[^/]+/, "");
        } else {
            this.resource = this.resourceFallback(data);
        }
    }
};

/**
 * If a resource path isn't given, this takes the best guess at assigning it.
 * @override
 * @method resourceFallback
 * @param serializedForm
 * @returns String
 */
ozpIwc.DataNode.prototype.resourceFallback = function(serializedForm) {
    if(serializedForm.key) {
       return ((serializedForm.key.charAt(0) === "/") ? "" : "/") + serializedForm.key;
    }
};

/**
 * Adds a child resource to the Data Api value.
 *
 * @method addChild
 * @param {String} child name of the child record of this
 */
ozpIwc.DataNode.prototype.addChild=function(child) {
    if(this.children.indexOf(child) < 0) {
        this.children.push(child);
        this.version++;
    }
    this.dirty= true;
};

/**
 *
 * Removes a child resource from the Data Api value.
 *
 * @method removeChild
 * @param {String} child name of the child record of this
 */
ozpIwc.DataNode.prototype.removeChild=function(child) {
    this.dirty= true;
    var originalLen=this.children.length;
    this.children=this.children.filter(function(c) {
        return c !== child;
    });
    if(originalLen !== this.children.length) {
        this.version++;
    }
};

/**
 * Turns this value into a packet.
 *
 * @method toPacket
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.DataNode.prototype.toPacket=function() {
    var p = ozpIwc.ApiNode.prototype.toPacket.apply(this,arguments);
    p.children = this.children;
    return p;
};
