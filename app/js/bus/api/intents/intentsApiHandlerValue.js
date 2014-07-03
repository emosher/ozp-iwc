/**
 * The handler value for an intent. adheres to the ozp-intents-handler-v1+json content type.
 * @class
 * @param {object} config
 * @param {string} config.name - the name of this intent handler.
 * @param {string} config.type - the type of this intent handler.
 * @param {string} config.action - the action of this intent handler.
 * @param {string} config.icon - the icon for this intent handler.
 * @param {string} config.label - the label for this intent handler.
 * @param {string} config.invokeIntent - the resource that will be called when handling an invoked intent.
 */
ozpIwc.IntentsApiHandlerValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
    config = config || {};

    this.type = config.type;
    this.action = config.action;
    this.icon = config.icon;
    this.label = config.label;
    this.invokeIntent = config.invokeIntent;
});

/**
 * Sets Intents Api Handler Value properties from packet.
 * Sets Common Api Value properties from packet.
 * @override
 * @param {object} packet
 * @param {string} packet.type - the type of this intent handler.
 * @param {string} packet.action - the action of this intent handler.
 * @param {string} packet.icon - the icon for this intent handler.
 * @param {string} packet.label - the label for this intent handler.
 * @param {string} packet.invokeIntent - the resource that will be called when handling an invoked intent.
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
 * @override
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
 * Invokes the handler with the given packet information.
 * @param {object} packet - information passed to the activity receiving the intent.
 */
ozpIwc.IntentsApiHandlerValue.prototype.invoke = function (packet) {
    console.error('Invoking of intents.api handlers is not implemented.' +
        'Override ozpIwc.IntentsApiHandlerValue.invoke to implement');
};

/**
 * Turns Intent Api Handler Value into a packet
 * @override
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.IntentsApiHandlerValue.prototype.toPacket = function () {

    // Note: we don't use DataApiValue for toPacket since we are setting this.children to packet.handlers
    var packet = ozpIwc.CommonApiValue.prototype.toPacket.apply(this, arguments);
    packet.entity = packet.entity || {};
    packet.entity.type = this.type;
    packet.entity.action = this.action;
    packet.entity.icon = this.icon;
    packet.entity.label = this.label;
    packet.entity.invokeIntent = this.invokeIntent;
    return packet;
};