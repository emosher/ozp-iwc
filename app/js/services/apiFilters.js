
ozpIwc.apiFilter={
    /**
     * Stores the resource in context.node, creating it via the api's
     * createResource function if it doesn't exist.
     * @param {type} packet
     * @param {type} context
     * @param {type} pathParams
     * @param {type} next
     * @returns {unresolved}
     */
    createResource: function(NodeType) {
        if(NodeType) {
            return function(packet,context,pathParams,next) {
                if(!context.node) {
                    context.node=this.data[packet.resource]=new NodeType({
                        resource: packet.resource
                    });
                }
                return next();
            };
        } else {
            return function(packet,context,pathParams,next) {
                if(!context.node) {
                    context.node=this.data[packet.resource]=this.createNode({
                        resource: packet.resource
                    });
                }
                return next();
            };
        }
    },
    
    /**
     * Stores the resource in context.node or throws NoResourceError if it does not exist.
     * @param {type} packet
     * @param {type} context
     * @param {type} pathParams
     * @param {type} next
     * @returns {unresolved}
     */
    requireResource: function() { 
        return function(packet,context,pathParams,next) {
        if(!context.node || context.node.deleted) {
            throw new ozpIwc.NoResourceError(packet);
        }
        return next();
    };},
    
    /**
     * Checks that the subject within the context is authorized for the action
     * on the resource node.
     * 
     * @param {type} packet
     * @param {type} context
     * @param {type} pathParams
     * @param {type} next
     * @returns {unresolved}
     */
    
    checkAuthorization: function(action) {
        return function(packet,context,pathParams,next) {
            this.checkAuthorization(context.node,context,packet,action || packet.action);
            return next();
        };
    },
    nullFilter: function(packet,context,pathParams,next) {
        return next();
    },
    checkContentType: function(contentType) {
        if(!contentType) {
            return ozpIwc.apiFilter.nullFilter;
        }
        contentType=ozpIwc.util.ensureArray(contentType);
        return function(packet,context,pathParams,next) {
            if(!contentType.some(function(t) {
                return t===packet.contentType ||
                    (Object.prototype.toString.call(contentType) === '[object RegExp]' && 
                    t.test(packet.contentType));
                })
            ) {
                throw new ozpIwc.BadContentError({
                    'provided': packet.contentType,
                    'allowedTypes': contentType
                });
            }
            return next();
    };},
    markResourceAsChanged: function() { 
        return function(packet,context,pathParams,next) {
            this.markForChange(packet);
            return next();
    };},
    
    checkVersion: function() { 
        return function(packet,context,pathParams,next) {
        // if there is no resource node, then let the request through
        if(packet.ifTag && packet.ifTag!==context.node.version) {
            throw new ozpIwc.NoMatchError({
                expectedVersion: packet.ifTag,
                actualVersion: context.node.version
            });
        }
        return next();
    };}
};
//=======================================================================
// Wrappers that return the list of filters for a standard action
//=======================================================================

ozpIwc.standardApiFilters={
    forAction: function(a) {
        return ozpIwc.standardApiFilters[a+"Filters"];
    },
    setFilters: function(nodeType,contentType) {
        return [
            ozpIwc.apiFilter.createResource(nodeType),
            ozpIwc.apiFilter.checkAuthorization(),
            ozpIwc.apiFilter.checkContentType(contentType),
            ozpIwc.apiFilter.checkVersion(),
            ozpIwc.apiFilter.markResourceAsChanged()
        ];
    },
    deleteFilters: function() {
        return [
            ozpIwc.apiFilter.checkAuthorization(),
            ozpIwc.apiFilter.checkVersion(),
            ozpIwc.apiFilter.markResourceAsChanged()
        ];
    },
    getFilters: function() {
        return [
            ozpIwc.apiFilter.requireResource(),
            ozpIwc.apiFilter.checkAuthorization()
        ];
    }
};