/**
 * The capability value for an intent. adheres to the ozp-intents-type-capabilities-v1+json content type.
 * @class
 * @param {object} config
 * @param {string} config.name - the name of this intent capability.
 * @param {string} config.definitions - the list of definitions in this intent capability.
 */
ozpIwc.IntentsApiCapabilityValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
    config = config || {};
    this.definitions = config.definitions || [];
});

/**
 * Sets Intents Api Capability Value properties from packet.
 * Sets Common Api Value properties from packet.
 * @override
 * @param {object}packet
 * @param {string} packet.definitions - the list of definitions in this intent capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.set = function (packet) {
    if (this.isValidContentType(packet.contentType)) {
        this.definitions = packet.definitions || this.definitions;
    }

    ozpIwc.CommonApiValue.prototype.set.call(this, packet);
};

/**
 * Resets the data to an empty state:
 *  <li> definitions: [] </li>
 *  It does NOT remove watchers.
 *  Resets Common Api Values to an empty state.
 * @override
 */
ozpIwc.IntentsApiCapabilityValue.prototype.deleteData = function () {
    this.definitions = [];

    ozpIwc.CommonApiValue.prototype.deleteData.call(this);
};


/**
 * Adds a definition to the end of the capability's list of definitions.
 * @param {string} definition - name of the definition added to this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.pushDefinition = function (definition) {
    this.definitions.push(definition);
    this.version++;
};

/**
 * Adds a definition to the beginning of the capability's list of definitions.
 * @param {string} definition - name of the definition added to this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.unshiftDefinition = function (definition) {
    this.definitions.unshift(definition);
    this.version++;
};

/**
 * Removes a definition from the end of the capability's list of definitions.
 * @returns {string} definition - name of the definition removed from this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.popDefinition = function () {
    this.version++;
    return this.definitions.pop();
};

/**
 * Removes a definition from the beginning of the capability's list of definitions.
 * @returns {string} definition - name of the definition removed from this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.shiftDefinition = function () {
    this.version++;
    return this.definitions.shift();
};

/**
 * Lists all definitions of the given capability.
 * @returns {Array} definitions - list of definitions in this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.listDefinitions = function () {
    return this.definitions;
};

/**
 * Returns the capability as a packet.
 * @override
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.IntentsApiCapabilityValue.prototype.toPacket = function () {
    var packet = ozpIwc.CommonApiValue.prototype.toPacket.apply(this, arguments);
    packet.entity = packet.entity || {};
    packet.definitions = this.definitions;
    return packet;
};