/**
 * Persistance types for the apiNode.
 * @module bus.service.Value
 * @submodule bus.service.Value.Persistance
 */
/**
 *
 * @class Lifespan
 * @namespace ozpIwc
 * @constructor
 */
ozpIwc.Lifespan=function(){
};

ozpIwc.Lifespan.getLifespan = function(lifespanObj){

    switch(lifespanObj.type){
        case "Ephemeral":
            return ozpIwc.Lifespan.ephemeralFunctionality;
        case "Persistent":
            return ozpIwc.Lifespan.persistentFunctionality;
        case "Bound":
            return ozpIwc.Lifespan.boundFunctionality;
        default:
            ozpIwc.Error("Received a malformed Lifespan, resource will be dropped: ", lifespanObj);
            break;
    }
};

ozpIwc.Lifespan.ephemeralFunctionality = {
    shouldPersist: function(){ return false; },
    shouldDelete: function(){ return false; }
};

ozpIwc.Lifespan.persistentFunctionality = {
    shouldPersist: function(){ return false; },
    shouldDelete: function(){ return false; }
};

ozpIwc.Lifespan.boundFunctionality = {
    shouldPersist: function(){ return false; },
    shouldDelete: function(lifespan,address){
        var len=address.length;
        for(var i in lifespan.addresses) {
            if(lifespan.addresses[i].substr(-len) === address) {
                return true;
            }
        }
        return false;
    }
};

ozpIwc.Lifespan.Persistent = function(){
    this.type = "Persistent";
};

ozpIwc.Lifespan.Ephemeral = function(){
    this.type = "Ephemeral";
};

ozpIwc.Lifespan.Bound = function(config){
    config = config || {};
    this.type = "Bound";
    this.addresses = config.addresses || [];
};
