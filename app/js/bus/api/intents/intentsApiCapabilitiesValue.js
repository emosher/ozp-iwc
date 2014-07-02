ozpIwc.IntentsApiCapabilitiesValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
    config = config || {};
    this.definitions = config.definitions || [];
});

/**
 * Sets Intents Api Value properties from packet.
 * Sets Common Api Value properties from packet.
 *
 * @param packet
 */
ozpIwc.IntentsApiCapabilitiesValue.prototype.set = function (packet) {
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
 */
ozpIwc.IntentsApiCapabilitiesValue.prototype.deleteData = function () {
    this.definitions = [];

    ozpIwc.CommonApiValue.prototype.deleteData.call(this);
};


/**
 *
 * @param {string} definition - name of the definition record of this
 * @returns {undefined}
 */
ozpIwc.IntentsApiCapabilitiesValue.prototype.pushDefinition = function (definition) {
    this.definitions.push(definition);
    this.version++;
};

/**
 *
 * @param {string} definition - name of the definition record of this
 * @returns {undefined}
 */
ozpIwc.IntentsApiCapabilitiesValue.prototype.unshiftDefinition = function (definition) {
    this.definitions.unshift(definition);
    this.version++;
};

/**
 *
 * @returns {definition} - name of the definition record of this
 */
ozpIwc.IntentsApiCapabilitiesValue.prototype.popDefinition = function () {
    this.version++;
    return this.definitions.pop();
};

/**
 * @returns {definition} - name of the definition record of this
 */
ozpIwc.IntentsApiCapabilitiesValue.prototype.shiftDefinition = function () {
    this.version++;
    return this.definitions.shift();
};

/**
 *
 * @returns {definitions} - list of definitions in this capability
 */
ozpIwc.IntentsApiCapabilitiesValue.prototype.listDefinitions = function () {
    return this.definitions;
};

/**
 * Turns Intent Api Value into a packet
 *
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.IntentsApiCapabilitiesValue.prototype.toPacket = function () {
    var packet = ozpIwc.CommonApiValue.prototype.toPacket.apply(this, arguments);
    packet.definitions = this.definitions;
    return packet;
};