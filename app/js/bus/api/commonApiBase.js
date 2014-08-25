/**
 * The Common API Base implements the API Common Conventions.  It is intended to be subclassed by
 * the specific API implementations.
 * @class
 */
ozpIwc.CommonApiBase = function(config) {
	config = config || {};
	this.participant=config.participant;
    this.participant.on("unloadState",ozpIwc.CommonApiBase.prototype.unloadState,this);
    this.participant.on("acquireState",ozpIwc.CommonApiBase.prototype.setState,this);
	this.participant.on("receiveApiPacket",ozpIwc.CommonApiBase.prototype.routePacket,this);

	this.events = new ozpIwc.Event();
    this.events.mixinOnOff(this);
    
    this.dynamicNodes=[];
    this.data={};
};

ozpIwc.CommonApiBase.prototype.loadFromServer=function() {
    // fetch the base endpoint. it should be a HAL Json object that all of the 
    // resources and keys in it
    if(!this.endpointName) {
        return;
    }
    var self=this;
    ozpIwc.endpoint(this.endpointName).get("/")
        .then(function(data) {
            var rootPath = data._links.self.href;
            for (var i in data._embedded['ozp:dataObjects']) {
                var object = data._embedded['ozp:dataObjects'][i];
                object.children = object.children || [];
                var resource=object._links.self.href.replace(rootPath, '');
                var node = self.findOrMakeValue({
                        'resource': resource,
                        'entity': object.entity,
                        'contentType': object.contentType
                    });

                var snapshot=node.snapshot();
                node.deserialize(node,object);
                self.notifyWatchers(node,node.changesSince(snapshot));
            }
            // update all the collection values
            self.dynamicNodes.forEach(function(resource) {
                self.updateDynamicNode(self.data[resource]);
            });        
    }).catch(function(e) {
        console.error("Could not load from api",e);
    });
};
    
    
/**
 * Creates a new value for the given packet's request.  Subclasses must override this
 * function to return the proper value based upon the packet's resource, content type, or
 * other parameters.
 * 
 * @abstract
 * @param {ozpIwc.TransportPacket} packet
 * @returns {ozpIwc.CommonApiValue} an object implementing the commonApiValue interfaces
 */
ozpIwc.CommonApiBase.prototype.makeValue=function(/*packet*/) {
	throw new Error("Subclasses of CommonApiBase must implement the makeValue(packet) function.");
};

/**
 * Determines whether the action implied by the packet is permitted to occur on
 * node in question.
 * @todo the refactoring of security to allow action-level permissions
 * @todo make the packetContext have the srcSubject inside of it
 * @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 * @returns {ozpIwc.AsyncAction}
 */
ozpIwc.CommonApiBase.prototype.isPermitted=function(node,packetContext) {
	var subject=packetContext.srcSubject || {
        'rawAddress':packetContext.packet.src
    };

	return ozpIwc.authorization.isPermitted({
        'subject': subject,
        'object': node.permissions,
        'action': {'action':packetContext.action}
    });
};


/** 
 * Turn an event into a list of change packets to be sent to the watchers.
 * @param {object} evt
 * @param {object} evt.node - The node being changed.
 */
ozpIwc.CommonApiBase.prototype.notifyWatchers=function(node,changes) {
    if(!changes) {
        return;
    }
	node.eachWatcher(function(watcher) {
		// @TODO check that the recipient has permission to both the new and old values
		var reply={
			'dst'   : watcher.src,
            'src'   : this.participant.name,
		    'replyTo' : watcher.msgId,
			'response': 'changed',
			'resource': node.resource,
			'permissions': node.permissions,
			'entity': changes
		};
        
		this.participant.send(reply);
	},this);
};

/**
 * For a given packet, return the value if it already exists, otherwise create the value
 * using makeValue()
 * @protected
 * @param {ozpIwc.TransportPacket} packet
 */
ozpIwc.CommonApiBase.prototype.findOrMakeValue=function(packet) {
    if(packet.resource === null || packet.resource === undefined) {
        // return a throw-away value
        return new ozpIwc.CommonApiValue();
    }
	var node=this.data[packet.resource];

	if(!node) {
		node=this.data[packet.resource]=this.makeValue(packet);
	}
	return node;
};

/**
 * 
 * Determines if the given resource exists.
 * @param {string} resource
 * @returns {boolean}
 */
ozpIwc.CommonApiBase.prototype.hasKey=function(resource) {
	return resource in this.data;
};

/**
 * Generates a keyname that does not already exist and starts
 * with a given prefix.
 * @param {String} prefix
 * @returns {String}
 */
ozpIwc.CommonApiBase.prototype.createKey=function(prefix) {
	prefix=prefix || "";
	var key;
	do {
		key=prefix + ozpIwc.util.generateId();
	} while(this.hasKey(key));
	return key;
};

/**
* Route a packet to the appropriate handler.  The routing path is based upon
 * the action and whether a resource is defined. If the handler does not exist, it is routed 
 * to defaultHandler(node,packetContext)
 * 
 * Has Resource: handleAction(node,packetContext)
 *
 * No resource: rootHandleAction(node,packetContext)
 * 
 * Where "Action" is replaced with the packet's action, lowercase with first letter capitalized
 * (e.g. "doSomething" invokes "handleDosomething")
 * Note that node will usually be null for the rootHandlerAction calls.
 * <ul>
 * <li> Pre-routing checks	<ul>
 *		<li> Permission check</li>
 *		<li> ACL Checks (todo)</li>
 *		<li> Precondition checks</li>
 * </ul></li>
 * <li> Post-routing actions <ul>
 *		<li> Reply to requester </li>
 *		<li> If node version changed, notify all watchers </li>
 * </ul></li>
 * @param {ozpIwc.TransportPacketContext} packetContext
 * @returns {undefined}
 */
ozpIwc.CommonApiBase.prototype.routePacket=function(packetContext) {
	var packet=packetContext.packet;
    this.events.trigger("receive",packetContext);
    var self=this;
    var errorWrap=function(f) {
        try {
            f.apply(self);
        } catch(e) {
//            if(!e instanceof ozpIwc.ApiError) {
                console.error("Unexpected error:",e);
//            }
            packetContext.replyTo({
                'response': e.errorAction || "unknownError",
                'entity': e.message
            });
            return;
        }
    };
	if(packetContext.leaderState !== 'leader')	{
		// if not leader, just drop it.
		return;
	}
    
    if(packet.response && !packet.action) {
        console.log(this.participant.name + " dropping response packet ",packet);
        // if it's a response packet that didn't wire an explicit handler, drop the sucker
        return;
    }
    var node;
    
    errorWrap(function() {
        var handler=this.findHandler(packetContext);
        this.validateResource(node,packetContext);
        node=this.findOrMakeValue(packetContext.packet);

        this.isPermitted(node,packetContext)
            .success(function() {
                errorWrap(function() {
                    this.validatePreconditions(node,packetContext);
                    var snapshot=node.snapshot();
                    handler.call(this,node,packetContext);
                    this.notifyWatchers(node,node.changesSince(snapshot));

                    // update all the collection values
                    this.dynamicNodes.forEach(function(resource) {
                        this.updateDynamicNode(this.data[resource]);
                    },this);
                });
            },this)
            .failure(function() {
                packetContext.replyTo({'response':'noPerm'});				
            });
    });
};

ozpIwc.CommonApiBase.prototype.findHandler=function(packetContext) {
    var action=packetContext.packet.action;
    var resource=packetContext.packet.resource;
    
    var handler;

    if(resource===null || resource===undefined) {
        handler="rootHandle";
    } else {
        handler="handle";
    }
    
	if(action) {
		handler+=action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
	} else {
        handler="defaultHandler";
    }
    
	if(!handler || typeof(this[handler]) !== 'function') {
       handler="defaultHandler";
	}
    return this[handler];
};




ozpIwc.CommonApiBase.prototype.validateResource=function(/* node,packetContext */) {
	return true;
};

ozpIwc.CommonApiBase.prototype.validatePreconditions=function(node,packetContext) {
	if(packetContext.packet.ifTag && packetContext.packet.ifTag!==node.version) {
        throw new ozpIwc.ApiError('noMatch',"Latest version is " + node.version);
    }
};

ozpIwc.CommonApiBase.prototype.validateContentType=function(node,packetContext) {
    return true;
};

ozpIwc.CommonApiBase.prototype.updateDynamicNode=function(node) {
    if(!node) {
        return;
    }
    var ofInterest=[];

    for(var k in this.data) {
        if(node.isUpdateNeeded(this.data[k])){
            ofInterest.push(this.data[k]);
        }                        
    }

    if(ofInterest) {
        var snapshot=node.snapshot();
        node.updateContent(ofInterest);
        this.notifyWatchers(node,node.changesSince(snapshot));
    }
};

ozpIwc.CommonApiBase.prototype.addDynamicNode=function(resource,node) {
    this.data[resource]=node;
    node.resource=resource;
    this.dynamicNodes.push(resource);
    this.updateDynamicNode(node);
};

ozpIwc.CommonApiBase.prototype.defaultHandler=function(node,packetContext) {
    packetContext.replyTo({
        'response': 'badAction',
        'entity': packetContext.packet.action
    });
};

/**
 * @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.CommonApiBase.prototype.handleGet=function(node,packetContext) {
	packetContext.replyTo(node.toPacket({'response': 'ok'}));
};

/**
 * @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.CommonApiBase.prototype.handleSet=function(node,packetContext) {
	node.set(packetContext.packet);
	packetContext.replyTo({'response':'ok'});
};

/**
 * @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.CommonApiBase.prototype.handleDelete=function(node,packetContext) {
	node.deleteData();
	packetContext.replyTo({'response':'ok'});
};

/**
 * @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.CommonApiBase.prototype.handleWatch=function(node,packetContext) {
	node.watch(packetContext.packet);
	
	// @TODO: Reply with the entity? Immediately send a change notice to the new watcher?  
	packetContext.replyTo({'response': 'ok'});
};

/**
 * @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.CommonApiBase.prototype.handleUnwatch=function(node,packetContext) {
	node.unwatch(packetContext.packet);
	
	packetContext.replyTo({'response':'ok'});
};

/**
 * Called when the leader participant fires its beforeUnload state. Releases the Api's data property
 * to be consumed by all, then used by the new leader.
 */
ozpIwc.CommonApiBase.prototype.unloadState = function(){
    this.participant.startElection({state:this.data});
    this.data = {};
};

/**
 * Called when the leader participant looses its leadership. This occurs when a new participant joins with a higher
 * priority
 */
ozpIwc.CommonApiBase.prototype.transferState = function(){
    this.participant.sendElectionMessage("prevLeader", {
        state:this.data,
        prevLeader: this.participant.address
    });
    this.data = {};
};

/**
 * Sets the APIs data property. Removes current values, then constructs each API value anew.
 * @param state
 */
ozpIwc.CommonApiBase.prototype.setState = function(state) {
    this.data = {};
    for (var key in state) {
        this.findOrMakeValue(state[key]);
    }
};

 /** @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.CommonApiBase.prototype.rootHandleList=function(node,packetContext) {
    packetContext.replyTo({
        'response':'ok',
        'entity': Object.keys(this.data)
    });
};

