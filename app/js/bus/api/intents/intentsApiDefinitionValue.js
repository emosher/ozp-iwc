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
 * @override
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
 * @param {string} handler - name of the handler record of this
 * @returns {undefined}
 */
ozpIwc.IntentsApiDefinitionValue.prototype.pushHandler = function (handler) {
    this.handlers.push(handler);
    this.version++;
};

/**
 *
 * @param {string} handler - name of the handler record of this
 * @returns {undefined}
 */
ozpIwc.IntentsApiDefinitionValue.prototype.unshiftHandler = function (handler) {
    this.handlers.unshift(handler);
    this.version++;
};

/**
 *
 * @param {string} handler - name of the handler record of this
 * @returns {undefined}
 */
ozpIwc.IntentsApiDefinitionValue.prototype.popHandler = function () {
    this.version++;
    return this.handlers.pop();
};

/**
 *
 * @param {string} handler - name of the handler record of this
 * @returns {undefined}
 */
ozpIwc.IntentsApiDefinitionValue.prototype.shiftHandler = function () {
    this.version++;
    return this.handlers.shift();
};

/**
 *
 * @param {string} handler - name of the handler record of this
 * @returns {undefined}
 */
ozpIwc.IntentsApiDefinitionValue.prototype.listHandlers = function () {
    return this.handlers;
};

/**
 * Turns Intent Api Value into a packet
 * @override
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.IntentsApiDefinitionValue.prototype.toPacket = function () {
    var packet = ozpIwc.CommonApiValue.prototype.toPacket.apply(this, arguments);
    packet.entity = packet.entity || {};
    packet.entity.type = this.type;
    packet.entity.action = this.action;
    packet.entity.icon = this.icon;
    packet.entity.label = this.label;
    packet.entity.handlers = this.handlers;
    return packet;
};