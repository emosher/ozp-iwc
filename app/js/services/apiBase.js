

/**
 * Service API classes of the bus.
 * @module bus.service
 * @submodule bus.service.Type
 */

/**
 * The base class for APIs. Use {{#crossLink "ozpIwc.createApi"}}{{/crossLink}} to subclass
 * this.
 * 
 * Leader State Management
 * =======================
 * The base API uses locks.api to always have a single leader at a time.  An api instance goes
 * through a linear series of states:  member -> loading -> leader
 * * __member__ does not service requests
 * * __loading__ is a transitory state between acquiring the leader lock and being ready to serve requests
 * * __leader__ actively serves requests and broadcasts a death scream upon shutdown
 *
 * The member state has two substates-- ready and dormant
 *  * __ready__ queues requests in case it has to become leader.  switches back to dormant on discovering a leader
 *  * __dormant__ silently drops requests.  Upon hearing a deathScream, it switches to ready.

 * @class ApiBase
 * @module ozpIwc
 * @namespace ozpIwc
 * @constructor
 * @param {Object} config
 * @param {String} config.name The api address (e.g. "names.api")
 * @param {ozpIwc.ClientMixin} [config.participant] The connection to use for communication
 * @param {ozpIwc.Router} [config.router=ozpIwc.defaultRouter] The router to connect to
 */
ozpIwc.ApiBase=function(config) {
	if(!config.name) {
        throw Error("API must be configured with a name");
    }
    this.participant=config.participant || new ozpIwc.ClientParticipant();

    this.name=config.name;
    this.coordinationAddress="coord." + this.name;
    
    
    this.events = new ozpIwc.Event();
    this.events.mixinOnOff(this);
    
    this.data={};
    this.watchers={};
    this.changeList={};
    this.leaderState="member";

    
    var router=config.router || ozpIwc.defaultRouter;
    router.registerParticipant(this.participant);
    router.registerMulticast(this.participant,[this.name,this.coordinationAddress]);

    var self=this;
    this.participant.on("receive",function(packetContext) {
        self.receivePacketContext(packetContext);
    });

    this.transitionToMemberReady();

    this.logPrefix="[" + this.name + "/" + this.participant.address +"] ";
    
    this.leaderPromise=this.participant.send({
        dst: "locks.api",
        resource: "/mutex/"+this.name,
        action: "lock"
    }).then(function() {
        return self.transitionToLoading();
    });
    
    this.leaderPromise.catch(function(e) {
        console.error("Error registering for leader mutex [address="+self.participant.address+",api="+self.name+"]",e);
    });
};
//===============================================================
// Default methods that can be overriden by subclasses
//===============================================================
/**
 * Create the data that needs to be handed off to the new leader.
 *
 * __Intended to be overridden by subclasses__
 * 
 * Subsclasses can override this if they need to add additional
 * handoff data.  This MUST be a synchronous call that returns immediately.
 *
 * @method createDeathScream
 * @return {Object} the data that will be passed to the new leader
 */
ozpIwc.ApiBase.prototype.createDeathScream=function() {
    return {
        watchers: this.watchers,
        data: ozpIwc.object.eachEntry(this.data,function(k,v) {
            return v.serializeLive();
        })
    };
};

/**
 * Called when the API has become the leader, but before it starts
 * serving data.  Receives the deathScream of the previous leader
 * if available, otherwise undefined.
 * 
 * __Intended to be overridden by subclasses__
 * 
 * Subsclasses can override this to load data from the server.
 *  
 * @method initializeData
 * @param {object} deathScream
 * @return {Promise} a promise that resolves when all data is loaded.
 */
ozpIwc.ApiBase.prototype.initializeData=function(deathScream) {
//    console.log(this.logPrefix+"initializing data");

    deathScream=deathScream || { watchers: {}, data: []};
    this.watchers=deathScream.watchers;
    deathScream.data.forEach(function(packet) {
        this.data[packet.resource]=this.createNode({resource: packet.resource});
        this.data[packet.resource].deserializeLive(packet);
    },this);
    
    if(this.endpoints) {
        var self=this;
        return Promise.all(this.endpoints.map(function(u) {
            return self.loadFromEndpoint(ozpIwc.endpoint(u));
        }));    
    } else {
        return Promise.resolve();
    }
};

/**
 * Creates a node appropriate for the given config.  This does
 * NOT add the node to this.data.  Default implementation returns
 * a plain ozpIwc.ApiNode.
 * 
 * __Intended to be overridden by subclasses__
 * 
 * Subsclasses can override this for custom node types that may vary
 * from resource to resource.
 * 
 * @method createNode
 * @param {Object} config The ApiNode configuration.
 * @param {string} config.resource The resource path to create.
 * @return {ozpIwc.ApiNode}
 */
ozpIwc.ApiBase.prototype.createNode=function(config) {
    return new ozpIwc.ApiNode(config);
};


//===============================================================
// Leader state management
//===============================================================

/**
 * @method transitionToLoading
 * @private
 * @return {Promise} a promise that resolves when all data is loaded.
 */
ozpIwc.ApiBase.prototype.transitionToLoading=function() {
    var self=this;
    if(this.leaderState !== "member") {
        return;
    }
    this.leaderState="loading";
    return this.initializeData(this.deathScream)
        .then(function() {
             self.transitionToLeader();
        },function(e) {
            ozpIwc.log.error(self.logPrefix+"Failed to load data due to ",e);
            self.shutdown();
        });
};

/**
 * @method transitionToLeader
 * @private
 */
ozpIwc.ApiBase.prototype.transitionToLeader=function() {
    if(this.leaderState !== "loading") {
        return;
    }
//    console.log(this.logPrefix+"becoming leader");

    this.leaderState = "leader";
    this.broadcastLeaderReady();
    this.deliverRequestQueue();
};

/**
 * Shuts down the api, issuing a deathscream and releasing the lock, if possible.
 * @method shutdown
 * @return 
 */
ozpIwc.ApiBase.prototype.shutdown=function() {
    if(this.leaderState === "leader") {
        this.broadcastDeathScream(this.createDeathScream());
    }
    
    this.participant.send({
        dst: "locks.api",
        resource: "/mutex/"+this.name,
        action: "unlock"
    });
};

/**
 * @method transitionToMemberReady
 * @private
 * @param {Object} deathScream
 * @return {Promise}
 */
ozpIwc.ApiBase.prototype.transitionToMemberReady=function(deathScream) {
    if(this.leaderState !== "member") {
        return;
    }
    this.deathScream=deathScream;
    this.enableRequestQueue();
    return Promise.resolve();
};

/**
 * @method transitionToMemberDormant
 * @private
 * @return {Promise}
 */
ozpIwc.ApiBase.prototype.transitionToMemberDormant=function() {
    if(this.leaderState !== "member") {
        return;
    }
    this.deathScream=null;
    this.flushRequestQueue();
    return Promise.resolve();
};

//===============================================================
// Data Management
//===============================================================

/**
 * Authorize the request for the given node.
 *  
 * @method checkAuthorization
 * @param {ozpIwc.ApiNode} node
 * @param {Object} context
 * @param {ozpIwc.TransportPacket} packet
 * @param {String} action
 * @return {undefined}
 */
ozpIwc.ApiBase.prototype.checkAuthorization=function(node,context,packet,action) {
    //@TODO: actually implement checking the authorization...
    return true;
};

/**
 * Returns a list of nodes that start with the given prefix.
 *  
 * @method matchingNodes
 * @param {String} prefix
 * @return {ozpIwc.ApiNode[]} a promise that resolves when all data is loaded.
 */
ozpIwc.ApiBase.prototype.matchingNodes=function(prefix) {
    return ozpIwc.object.values(this.data, function(k,node) { 
        return node.resource.indexOf(prefix) ===0;
    });
};


//===============================================================
// Watches
//===============================================================

/**
 * Marks that a node has changed and that change notices may need to 
 * be sent out after the request completes.
 *  
 * @method markForChange
 * @param {ApiNode} nodes...
 */
ozpIwc.ApiBase.prototype.markForChange=function(/*varargs*/) {
    for(var i=0;i<arguments.length;++i) {
        if(Array.isArray(arguments[i])) {
            this.markForChange(arguments[i]);
        } else {
            var resource=arguments[i].resource || ""+arguments[i];
            // if it's already marked, skip it
            if(this.changeList.hasOwnProperty(resource)) {
                continue;
            }
            
            var n=this.data[resource];

            this.changeList[resource]=n?n.snapshot():{};
        }
    }
};

/**
 * Marks that a node has changed and that change notices may need to 
 * be sent out after the request completes.
 *  
 * @method addWatcher
 * @param {String} resource name of the resource to watch
 * @param {Object} watcher
 * @param {String} watcher.src Address of the watcher
 * @param {String | Number} watcher.replyTo The conversation id that change notices will go to
 */
ozpIwc.ApiBase.prototype.addWatcher=function(resource,watcher) {
    var watchList=this.watchers[resource];
    if(!Array.isArray(watchList)) {
        watchList=this.watchers[resource]=[];
    }

    watchList.push(watcher);
};

/**
 * Called after the request is complete to send out change notices.
 *  
 * @method resolveChangedNodes
 * @private
 */
ozpIwc.ApiBase.prototype.resolveChangedNodes=function() {
    ozpIwc.object.eachEntry(this.changeList,function(resource,snapshot) {
        var node=this.data[resource];
        var watcherList=this.watchers[resource] || [];
        
        if(!node) {
            return;
        }
        
        var changes=node.changesSince(snapshot);
        if(!changes) {
            return;
        }

        var permissions=ozpIwc.authorization.pip.attributeUnion(
            changes.oldValue.permissions,
            changes.newValue.permissions
        );

        var entity={
            oldValue: changes.oldValue.entity,
            newValue: changes.newValue.entity
        };
        
        this.events.trigger("changed",node,entity);
        
        watcherList.forEach(function(watcher) {
            // @TODO allow watchers to changes notifications if they have permission to either the old or new, not just both
            this.participant.send({
                'src'   : this.participant.name,
                'dst'   : watcher.src,
                'replyTo' : watcher.replyTo,
                'response': 'changed',
                'resource': node.resource,
                'permissions': permissions,
                'entity': entity
            });
        },this);
    },this);
    this.changeList={};
};


//===============================================================
// Packet Routing
//===============================================================

/**
 * Routes a packet received from the participant
 *  
 * @method receivePacketContext
 * @private
 */
ozpIwc.ApiBase.prototype.receivePacketContext=function(packetContext) {
    if(packetContext.packet.src===this.participant.address) {
        // drop our own packets
        return Promise.resolve();
    }

    if(packetContext.packet.dst===this.coordinationAddress) {
        return this.receiveCoordinationPacket(packetContext);
    } else if (packetContext.packet.dst === "$bus.multicast"){
        return this.receiveBusPacket(packetContext);
    } else {
        return this.receiveRequestPacket(packetContext);
    }
};

ozpIwc.ApiBase.prototype.receiveBusPacket=function(packetContext) {
    var packet=packetContext.packet;
    switch(packet.action) {
        case "connect":
            this.events.trigger("addressConnects",packet.entity.address,packet);
            break;
        case "disconnect":
            this.events.trigger("addressDisconnects",packet.entity.address,packet);
            break;
    }
    return Promise.resolve();
};


//===============================================================
// API Request Handling
//===============================================================

/**
 * Routes a request to the proper handler and takes care of overhead
 * such as change requests.
 *  
 * @method receivePacketContext
 * @private
 */
ozpIwc.ApiBase.prototype.receiveRequestPacket=function(packetContext) {
    var packet=packetContext.packet;

    if(this.isRequestQueueing) {
        this.requestQueue.push(packetContext);
        return Promise.resolve();
    }
    
    var self=this;
    return new Promise(function(resolve,reject) {
        try {
            packetContext.node=self.data[packet.resource];
            resolve(self.routePacket(packet,packetContext));
        } catch(e) {
            reject(e);
        }
    }).then(function(packetFragment) {
        if(packetFragment) {
            packetFragment.response = packetFragment.response || "ok";
            packetContext.replyTo(packetFragment);
        }
        self.resolveChangedNodes();    
    },function(e) {
        var packetFragment={
            'src': self.name,
            'response': e.errorAction || "errorUnknown",
            'entity': e.message
        };
        packetContext.replyTo(packetFragment);
    });

};

/**
 * Any request packet that does not match a route ends up here.  By default,
 * it replies with BadAction, BadResource, or BadRequest, as appropriate.
 *  
 * @method receivePacketContext
 * @param {ozpIwc.TransportPacket} packet
 * @param {ozpIwc.TransportPacketContext} context
 */
ozpIwc.ApiBase.prototype.defaultRoute=function(packet,context) {
//    console.log(this.logPrefix+"Could not route due to " + context.defaultRouteCause,packet);

    switch(context.defaultRouteCause) {
        case "nonRoutablePacket": // packet doesn't have an action/resource, so ignore it
            return;
        case "noAction": 
            throw new ozpIwc.BadActionError(packet);
        case "noResource":
            throw new ozpIwc.BadResourceError(packet);
        default:
            throw new ozpIwc.BadRequestError(packet);
    }
};

/**
 * @method enableRequestQueue
 * @private
 */
ozpIwc.ApiBase.prototype.enableRequestQueue=function() {
    this.isRequestQueueing=true;
    this.requestQueue=[];
};

/**
 * Routes all queued packets and turns off request queueing
 * @method deliverRequestQueue
 * @private
 */
ozpIwc.ApiBase.prototype.deliverRequestQueue=function() {
    this.isRequestQueueing=false;
    this.requestQueue.forEach(this.receiveRequestPacket,this);
    this.requestQueue=[];
};

/**
 * Empties the queue of requests without processing and turns off queuing
 * @method flushRequestQueue
 * @private
 */
ozpIwc.ApiBase.prototype.flushRequestQueue=function() {
    this.isRequestQueueing=false;
    this.requestQueue=[];
};



//===============================================================
// API Coordination Handling
//===============================================================
ozpIwc.ApiBase.prototype.broadcastLeaderReady=function() {
    this.participant.send({
        dst: this.coordinationAddress,
        action: "announceLeader"
    });
};

ozpIwc.ApiBase.prototype.broadcastDeathScream=function(deathScream) {
    this.participant.send({
        dst: this.coordinationAddress,
        action: "deathScream",
        entity: deathScream
    });
};

ozpIwc.ApiBase.prototype.receiveCoordinationPacket=function(packetContext) {
    var packet=packetContext.packet;
    switch(packet.action) {
        case "announceLeader":
            return this.transitionToMemberDormant();
        case "deathScream":
            return this.transitionToMemberReady(packet.entity);
        default:
            ozpIwc.log.error("Unknown coordination packet: ",packet);
    }
    return Promise.reject(new Error("Unknown action: " + packet.action + " in " + JSON.stringify(packetContext)));
};

//===============================================================
// Load data from the server
//===============================================================

/**
 * Loads data from the provided endpoint.  The endpoint must point to a HAL JSON document
 * that embeds or links to all resources for this api.
 * 
 * @method loadFromEndpoint
 * @param {ozpIwc.Endpoint} endpoint
 * @return {Promise} resolved when all data has been loaded.
 */
ozpIwc.ApiBase.prototype.loadFromEndpoint=function(endpoint) {
    var self=this;
    return endpoint.get("/").then(function(data) {
        var response=data.response;
        var embeddedItems=ozpIwc.util.ensureArray((response._embedded && response._embedded.item) || []);
        var linkedItems=ozpIwc.util.ensureArray((response._links && response._links.item) || []);

        // load all the embedded items
        embeddedItems.forEach(function(i) {
            var n=self.createNode({
                serializedEntity: i
            });
//            console.log(self.logPrefix+" loading ",n.resource);
            self.data[n.resource]=n;
        });

        var unknownLinks=linkedItems.map(function(i) { return i.href;});
        console.log(self.logPrefix+" pre-filter unknown links: ", unknownLinks);
        unknownLinks=unknownLinks.filter(function(href) {
                return ozpIwc.object.values(self.data,function(k,node) {
                    console.log(self.logPrefix+" comparing " + node.self + "===" + href);
                    return node.self === href;
                }).length === 0;
            });
        console.log(self.logPrefix+" post-filter unknown links: ", unknownLinks);
        // empty array resolves immediately, so no check needed
        return Promise.all(unknownLinks.map(function(l) {
//            console.log(self.logPrefix+"fetching link: " + l);
            return endpoint.get(l).then(function(data) {
  //              console.log(self.logPrefix+" retrieved data: ",data);
                var n=self.createNode({
                    serializedEntity: data.response
                });
                self.data[n.resource]=n;
            });
        }));

    });
};


//===============================================================
// Default Routes and Subclass Helpers
//===============================================================

ozpIwc.ApiBase.defaultHandler={
    "get":function(packet,context,pathParams) {
        return context.node.toPacket();
    },
    "set":function(packet,context,pathParams) {
        context.node.set(packet);
        return { response: "ok" };
    },
    "delete": function(packet,context,pathParams) {
        if(context.node) {
            context.node.markAsDeleted(packet);
        }

        return { response: "ok" };
    },
    "list": function(packet,context,pathParams) {
        var entity=this.matchingNodes(packet.resource).map(function(node) {
            return node.resource;
        });
        return {
            "contentType": "application/json",
            "entity": entity
        };
    },
    "bulkGet": function(packet,context,pathParams) {
        var entity=this.matchingNodes(packet.resource).map(function(node) {
            return node.toPacket();
        });
        // TODO: roll up the permissions of the nodes, as well
        return {
            "contentType": "application/json",
            "entity": entity
        };
    },
    "watch": function(packet,context,pathParams) {
        this.addWatcher(packet.resource,{
            src: packet.src,
            replyTo: packet.msgId
        });

        if(context.node) {
            return context.node.toPacket();
        } else {
            return { response: "ok"};
        }
    },
    "unwatch": function(packet,context,pathParams) {
        var watchList=this.watchers[packet.resource];
        if(watchList) {
            this.watchers[packet.resource]=watchList.filter(function(watch) {
               return watch.src === packet.src && watch.replyTo === packet.msgId;
           });
        }

        return { response: "ok" };
    }
};

/**
 * A list of all of the default actions.
 * @property allActions
 * @static
 * @type {String[]}
 */
ozpIwc.ApiBase.allActions=Object.keys(ozpIwc.ApiBase.defaultHandler);

/**
 * Install the default handler and filters for the provided actions and resources.
 * @method useDefaultRoute
 * @static
 * @param {String | String[]} actions
 * @param {String} resource="{resource:.*}" The resource template to install the default handler on.
 */


/**
 * Creates a subclass of ApiBase and adds some static helper functions.
 * 
 * @param {Function} init the constructor function for the class
 * @return {Class} A new API class that us
 */
ozpIwc.createApi=function(init) {
    var api=ozpIwc.util.extend(ozpIwc.ApiBase,function() {
        ozpIwc.ApiBase.apply(this, arguments);
        return init.apply(this,arguments);
    });
    ozpIwc.PacketRouter.mixin(api);
    api.useDefaultRoute=function(actions,resource) {
        resource = resource || "{resource:.*}";
        actions=ozpIwc.util.ensureArray(actions);
        actions.forEach(function(a) {
            var filterFunc=ozpIwc.standardApiFilters.forAction(a);
            api.declareRoute({
                action: a,
                resource: resource,
                filters: (filterFunc?filterFunc():[])
            },ozpIwc.ApiBase.defaultHandler[a]
            );
        });
    };
    return api;
};