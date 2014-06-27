ozpIwc.IntentsApiValue = ozpIwc.util.extend(ozpIwc.DataApiValue, function (config) {
    ozpIwc.DataApiValue.apply(this, arguments);
    config = config || {};

    //TODO: do we want to encapsulate intent properties inside a property of the value?
    this.type = config.type;
    this.action = config.action;
    this.icon = config.icon;
    this.label = config.label;
    /*
     * TODO: Is there any breaking reason not to use the DataApi children for IntentsApi handlers?
     *       It may be confusing to debug (when converted to packet: children --> handler, when converting packet to
     *       value: handler --> children)
     */
    this.children = config.handlers || [];
});

/**
 * Sets Intents Api Value properties from packet.
 * Sets Common Api Value properties from packet.
 *
 * @param packet
 */
ozpIwc.IntentsApiValue.prototype.set = function (packet) {
    if (this.isValidContentType(packet.contentType)) {
        this.type = packet.type || this.type;
        this.action = packet.action || this.action;
        this.icon = packet.icon || this.icon;
        this.label = packet.label || this.label;
        this.children = packet.handlers || this.children;
    }

    ozpIwc.DataApiValue.prototype.set.call(this, packet);
};

/**
 * Resets the data to an empty state:
 *  <li> type : undefined </li>
 *  <li> action: undefined </li>
 *  <li> icon: undefined </li>
 *  <li> label: undefined </li>
 *  <li> handlers: [] </li>
 *  It does NOT remove watchers.
 *  Resets Common Api Values to an empty state.
 */
ozpIwc.IntentsApiValue.prototype.deleteData = function () {
    this.type = undefined;
    this.action = undefined;
    this.icon = undefined;
    this.label = undefined;
    this.children = [];

    ozpIwc.DataApiValue.prototype.deleteData.call(this);
};

/**
 * Turns Intent Api Value into a packet
 *
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.IntentsApiValue.prototype.toPacket = function () {

    // Note: we don't use DataApiValue for toPacket since we are setting this.children to packet.handlers
    var packet = ozpIwc.CommonApiValue.prototype.toPacket.apply(this, arguments);
    packet.type = this.type;
    packet.action = this.action;
    packet.icon = this.icon;
    packet.label = this.label;
    packet.handlers = this.children;
    return packet;
};