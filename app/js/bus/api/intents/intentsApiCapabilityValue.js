/**
 * The capability value for an intent. adheres to the ozp-intents-type-capabilities-v1+json content type.
 * @class
 * @param {object} config
 *@param {object} config.entity
 * @param {string} config.entity.definitions - the list of definitions in this intent capability.
 */
ozpIwc.IntentsApiCapabilityValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
});

/**
 * Adds a definition to the end of the capability's list of definitions.
 * @param {string} definition - name of the definition added to this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.pushDefinition = function (definition) {
    this.entity.definitions = this.entity.definitions || [];
    this.entity.definitions.push(definition);
    this.version++;
};

/**
 * Adds a definition to the beginning of the capability's list of definitions.
 * @param {string} definition - name of the definition added to this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.unshiftDefinition = function (definition) {
    this.entity.definitions = this.entity.definitions || [];
    this.entity.definitions.unshift(definition);
    this.version++;
};

/**
 * Removes a definition from the end of the capability's list of definitions.
 * @returns {string} definition - name of the definition removed from this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.popDefinition = function () {
    if (this.entity.definitions && this.entity.definitions.length > 0) {
        this.version++;
        return this.entity.definitions.pop();
    }
};

/**
 * Removes a definition from the beginning of the capability's list of definitions.
 * @returns {string} definition - name of the definition removed from this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.shiftDefinition = function () {
    if (this.entity.definitions && this.entity.definitions.length > 0) {
        this.version++;
        return this.entity.definitions.shift();
    }
};

/**
 * Lists all definitions of the given capability.
 * @returns {Array} definitions - list of definitions in this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.listDefinitions = function () {
    return this.entity.definitions;
};