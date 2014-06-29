ozpIwc.IntentsApiHandlerValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
    config = config || {};

    //TODO: do we want to encapsulate intent properties inside a property of the value?
    this.type = config.type;
    this.action = config.action;
    this.icon = config.icon;
    this.label = config.label;
    this.invokeIntent = config.invokeIntent;
});

/**
 * Sets Intents Api Handler Value properties from packet.
 * Sets Common Api Value properties from packet.
 *
 * @param packet
 */
ozpIwc.IntentsApiHandlerValue.prototype.set = function (packet) {
    if (this.isValidContentType(packet.contentType)) {
        this.type = packet.type || this.type;
        this.action = packet.action || this.action;
        this.icon = packet.icon || this.icon;
        this.label = packet.label || this.label;
        this.invokeIntent = packet.invokeIntent || this.invokeIntent;
    }

    ozpIwc.CommonApiValue.prototype.set.call(this, packet);
};

/**
 * Resets the data to an empty state:
 *  <li> type : undefined </li>
 *  <li> action: undefined </li>
 *  <li> icon: undefined </li>
 *  <li> label: undefined </li>
 *  <li> invokeIntent: undefined </li>
 *  It does NOT remove watchers.
 *  Resets Common Api Values to an empty state.
 */
ozpIwc.IntentsApiHandlerValue.prototype.deleteData = function () {
    this.type = undefined;
    this.action = undefined;
    this.icon = undefined;
    this.label = undefined;
    this.invokeIntent = undefined;

    ozpIwc.CommonApiValue.prototype.deleteData.call(this);
};

/**
 * Turns Intent Api Handler Value into a packet
 *
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.IntentsApiHandlerValue.prototype.toPacket = function () {

    // Note: we don't use DataApiValue for toPacket since we are setting this.children to packet.handlers
    var packet = ozpIwc.CommonApiValue.prototype.toPacket.apply(this, arguments);
    packet.type = this.type;
    packet.action = this.action;
    packet.icon = this.icon;
    packet.label = this.label;
    packet.invokeIntent = this.invokeIntent;
    return packet;
};