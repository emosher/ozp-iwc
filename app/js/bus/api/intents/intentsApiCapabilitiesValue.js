ozpIwc.IntentsApiCapabilityValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
    config = config || {};
    this.definitions = config.definitions || [];
});

/**
 * Sets Intents Api Value properties from packet.
 * Sets Common Api Value properties from packet.
 * @override
 * @param packet
 */
ozpIwc.IntentsApiCapabilityValue.prototype.set = function (packet) {
    if (this.isValidContentType(packet.contentType)) {
        this.definitions = packet.definitions || this.definitions;
    }

    ozpIwc.CommonApiValue.prototype.set.call(this, packet);
};

/**
 * Resets the data to an empty state:
 *  <li> definitionss: [] </li>
 *  It does NOT remove watchers.
 *  Resets Common Api Values to an empty state.
 * @override
 */
ozpIwc.IntentsApiCapabilityValue.prototype.deleteData = function () {
    this.definitions = [];

    ozpIwc.CommonApiValue.prototype.deleteData.call(this);
};


/**
 *
 * @param {string} definition - name of the definition record of this
 * @returns {undefined}
 */
ozpIwc.IntentsApiCapabilityValue.prototype.pushDefinition = function (definition) {
    this.definitions.push(definition);
    this.version++;
};

/**
 *
 * @param {string} definition - name of the definition record of this
 * @returns {undefined}
 */
ozpIwc.IntentsApiCapabilityValue.prototype.unshiftDefinition = function (definition) {
    this.definitions.unshift(definition);
    this.version++;
};

/**
 *
 * @returns {definition} - name of the definition record of this
 */
ozpIwc.IntentsApiCapabilityValue.prototype.popDefinition = function () {
    this.version++;
    return this.definitions.pop();
};

/**
 * @returns {definition} - name of the definition record of this
 */
ozpIwc.IntentsApiCapabilityValue.prototype.shiftDefinition = function () {
    this.version++;
    return this.definitions.shift();
};

/**
 *
 * @returns {definitions} - list of definitions in this capability
 */
ozpIwc.IntentsApiCapabilityValue.prototype.listDefinitions = function () {
    return this.definitions;
};

/**
 * Turns Intent Api Value into a packet
 * @override
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.IntentsApiCapabilityValue.prototype.toPacket = function () {
    var packet = ozpIwc.CommonApiValue.prototype.toPacket.apply(this, arguments);
    packet.entity = packet.entity || {};
    packet.definitions = this.definitions;
    return packet;
};