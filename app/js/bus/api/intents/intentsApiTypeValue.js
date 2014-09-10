/**
 * The capability value for an intent. adheres to the ozp-intents-type-capabilities-v1+json content type.
 * @class
 * @param {object} config
 *@param {object} config.entity
 * @param {string} config.entity.definitions - the list of definitions in this intent capability.
 */
ozpIwc.IntentsApiTypeValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    config=config || {};
    config.allowedContentTypes=["application/ozpIwc-intents-contentType-v1+json"];
    config.contentType="application/ozpIwc-intents-contentType-v1+json";

    ozpIwc.CommonApiValue.apply(this, arguments);
    this.pattern=new RegExp(ozpIwc.util.escapeRegex(this.resource)+"/[^/]*$");
    this.entity={
        type: config.intentType,
        actions: []
    };
});

ozpIwc.IntentsApiTypeValue.prototype.isUpdateNeeded=function(node) {
    return this.pattern.test(node.resource);
};

ozpIwc.IntentsApiTypeValue.prototype.updateContent=function(changedNodes) {
    this.version++;
    this.entity.actions=changedNodes.map(function(changedNode) { 
        return changedNode.resource; 
    });
};