ozpIwc.IntentsApiDefinitionValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
    config = config || {};

    this.type = config.type;
    this.action = config.action;
    this.icon = config.icon;
    this.label = config.label;
    this.handlers = config.handlers || [];
});

/**
 * Sets Intents Api Value properties from packet.
 * Sets Common Api Value properties from packet.
 *
 * @param packet
 */
ozpIwc.IntentsApiDefinitionValue.prototype.set = function (packet) {
    if (this.isValidContentType(packet.contentType)) {
        this.type = packet.type || this.type;
        this.action = packet.action || this.action;
        this.icon = packet.icon || this.icon;
        this.label = packet.label || this.label;
        this.handlers = packet.handlers || this.handlers;
    }

    ozpIwc.CommonApiValue.prototype.set.call(this, packet);
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
ozpIwc.IntentsApiDefinitionValue.prototype.deleteData = function () {
    this.type = undefined;
    this.action = undefined;
    this.icon = undefined;
    this.label = undefined;
    this.handlers = [];

    ozpIwc.CommonApiValue.prototype.deleteData.call(this);
};

/**
 * Turns Intent Api Value into a packet
 *
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.IntentsApiDefinitionValue.prototype.toPacket = function () {
    var packet = ozpIwc.CommonApiValue.prototype.toPacket.apply(this, arguments);
    packet.type = this.type;
    packet.action = this.action;
    packet.icon = this.icon;
    packet.label = this.label;
    packet.handlers = this.handlers;
    return packet;
};