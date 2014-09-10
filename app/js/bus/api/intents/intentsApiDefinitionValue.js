/**
 * The capability value for an intent. adheres to the ozp-intents-type-capabilities-v1+json content type.
 * @class
 * @param {object} config
 *@param {object} config.entity
 * @param {string} config.entity.definitions - the list of definitions in this intent capability.
 */
ozpIwc.IntentsApiDefinitionValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    config=config || {};
    config.allowedContentTypes=["application/ozpIwc-intents-definition-v1+json"];
    config.contentType="application/ozpIwc-intents-definition-v1+json";
    ozpIwc.CommonApiValue.call(this, config);
    this.pattern=new RegExp(ozpIwc.util.escapeRegex(this.resource)+"/[^/]*");
    this.handlers=[];
    this.entity={
        type: config.intentType,
        action: config.intentAction,        
        handlers: []
    };
});

ozpIwc.IntentsApiDefinitionValue.prototype.isUpdateNeeded=function(node) {
    return this.pattern.test(node.resource);
};

ozpIwc.IntentsApiDefinitionValue.prototype.updateContent=function(changedNodes) {
    this.version++;
    this.handlers=changedNodes;
    this.entity.handlers=changedNodes.map(function(changedNode) { 
        return changedNode.resource; 
    });
};

ozpIwc.IntentsApiDefinitionValue.prototype.getHandlers=function(packetContext) {
    return [this.handlers];
};

