/**
 * The handler value for an intent. adheres to the ozp-intents-handler-v1+json content type.
 * @class
 * @param {object} config
 * @param {object} config.entity
 * @param {string} config.entity.type - the type of this intent handler.
 * @param {string} config.entity.action - the action of this intent handler.
 * @param {string} config.entity.icon - the icon for this intent handler.
 * @param {string} config.entity.label - the label for this intent handler.
 * @param {string} config.entity.invokeIntent - the resource that will be called when handling an invoked intent.
 */
ozpIwc.IntentsApiHandlerValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
});

/**
 * Invokes the handler with the given packet information.
 * @param {object} packet - information passed to the activity receiving the intent.
 */
ozpIwc.IntentsApiHandlerValue.prototype.invoke = function (packet) {
    this.set(packet);
//    console.error('Invoking of intents.api handlers is not implemented.' +
//        'Override ozpIwc.IntentsApiHandlerValue.invoke to implement');
};
