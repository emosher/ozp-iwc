/**
 * The definition value for an intent. adheres to the ozp-intents-definition-v1+json content type.
 * @class
 * @param {object} config
 * @param {object} config.entity
 * @param {string} config.entity.type - the type of this intent definition.
 * @param {string} config.entity.action - the action of this intent definition.
 * @param {string} config.entity.icon - the icon for this intent definition.
 * @param {string} config.entity.label - the label for this intent definition.
 * @param {string} config.entity.handlers - the list of handlers for the definition.
 */
ozpIwc.IntentsApiDefinitionValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
});

/**
 *
 * Adds a handler to the end of the definition's list of handler.
 * @param {string} definition - name of the handler added to this definition.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.pushHandler = function (handler) {
    this.entity.handlers = this.entity.handlers || [];
    this.entity.handlers.push(handler);
    this.version++;
};

/**
 * Adds a handler to the beginning of the definition's list of handler.
 * @param {string} definition - name of the handler added to this definition.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.unshiftHandler = function (handler) {
    this.entity.handlers = this.entity.handlers || [];
    this.entity.handlers.unshift(handler);
    this.version++;
};

/**
 * Removes a handler from the end of the definition's list of handlers.
 * @returns {string} handler - name of the handler removed from this definition.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.popHandler = function () {
    if (this.entity.handlers && this.entity.handlers.length > 0) {
        this.version++;
        return this.entity.handlers.pop();
    }
};

/**
 * Removes a handler from the beginning of the definition's list of handlers.
 * @returns {string} handler - name of the handler removed from this definition.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.shiftHandler = function () {
    if (this.entity.handlers && this.entity.handlers.length > 0) {
        this.version++;
        return this.entity.handlers.shift();
    }
};

/**
 * Lists all handlers of the given intent definition.
 * @returns {Array} handlers - list of handlers in this capability.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.listHandlers = function () {
    return this.entity.handlers;
};