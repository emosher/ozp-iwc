/**
 * The definition value for an intent. adheres to the ozp-intents-definition-v1+json content type.
 * @class
 * @param {object} config
 * @param {string} config.name - the name of this intent definition.
 * @param {string} config.type - the type of this intent definition.
 * @param {string} config.action - the action of this intent definition.
 * @param {string} config.icon - the icon for this intent definition.
 * @param {string} config.label - the label for this intent definition.
 * @param {string} config.handlers - the list of handlers for the definition.
 */
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
 * Sets Intents Api Definition Value properties from packet.
 * Sets Common Api Value properties from packet.
 * @override
 * @param {object} packet
 * @param {string} packet.name - the name of this intent definition.
 * @param {string} packet.type - the type of this intent definition.
 * @param {string} packet.action - the action of this intent definition.
 * @param {string} packet.icon - the icon for this intent definition.
 * @param {string} packet.label - the label for this intent definition.
 * @param {string} packet.handlers - the list of handlers for the definition.
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
 * @override
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
 *
 * Adds a handler to the end of the definition's list of handler.
 * @param {string} definition - name of the handler added to this definition.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.pushHandler = function (handler) {
    this.handlers.push(handler);
    this.version++;
};

/**
 * Adds a handler to the beginning of the definition's list of handler.
 * @param {string} definition - name of the handler added to this definition.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.unshiftHandler = function (handler) {
    this.handlers.unshift(handler);
    this.version++;
};

/**
 * Removes a handler from the end of the definition's list of handlers.
 * @returns {string} handler - name of the handler removed from this definition.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.popHandler = function () {
    this.version++;
    return this.handlers.pop();
};

/**
 * Removes a handler from the beginning of the definition's list of handlers.
 * @returns {string} handler - name of the handler removed from this definition.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.shiftHandler = function () {
    this.version++;
    return this.handlers.shift();
};

/**
 * Lists all handlers of the given intent definition.
 * @returns {Array} handlers - list of handlers in this capability.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.listHandlers = function () {
    return this.handlers;
};

/**
 * Returns the intent definition value as a packet.
 * @override
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