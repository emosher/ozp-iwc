/**
 * @class IntentsInFlightNode
 * @namespace ozpIwc
 * @extends ozpIwc.ApiNode
 * @constructor
 */
ozpIwc.IntentHandlerNode = ozpIwc.util.extend(ozpIwc.ApiNode, function(config) {
    // Take the supplied data for anything that matches in the super class,
    // such as resource.
    ozpIwc.ApiNode.apply(this, arguments);

    this.entity = config.entity || {};

});

ozpIwc.IntentHandlerNode.prototype.set=function(packet) {
    var dst=packet.src;
    if(packet.entity && packet.entity.invokeIntent && packet.entity.invokeIntent.dst) {
        dst=packet.entity.invokeIntent.dst;
    }
    if(!dst) {
        ozpIwc.log.error("Handler lacks a invokeIntent.dst",packet);
        throw new ozpIwc.BadContentError("Intent handler must supply invokeIntent.dst");
    }
    
    ozpIwc.ApiNode.prototype.set.apply(this, arguments);
    this.entity.invokeIntent=this.entity.invokeIntent || {};
    this.entity.invokeIntent.dst=dst;
};

/*{
  "type": "application/ozp-demo-ball+json",
  "action": "view",
  "icon": "http://localhost:15001/largeIcon.png",
  "label": "Green Ball",
  "_links": {
    "self": {
      "href": "/api/profile/v1/exampleUser/application/23456"
    },
    "describes": {
      "href": "http://localhost:15001/?color=green"
    },
    "ozp:iwcSelf": {
      "href": "web+ozp://system.api/application/23456"
    }
  },
  "invokeIntent": {
    "action": "invoke",
    "resource": "/application/23456"
  }
}*/