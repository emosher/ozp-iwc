var ozpIwc=ozpIwc || {};

ozpIwc.Endpoint=function(endpointRegistry) {
    this.endpointRegistry=endpointRegistry;
};

ozpIwc.Endpoint.prototype.get=function(resource) {
    var self=this;
    return this.endpointRegistry.loadPromise.then(function() {
        return ozpIwc.util.ajax({
            href: self.baseUrl + resource,
            method: 'GET'
        });
    });
};

ozpIwc.EndpointRegistry=function(config) {
    config=config || {};
    var apiRoot=config.apiRoot || 'api';
    this.endPoints={};
    var self=this;
    this.loadPromise=ozpIwc.util.ajax({
        href: apiRoot,
        method: 'GET'
    }).then(function(data) {
        for (var ep in data._links) {
            if (ep !== 'self') {
                self.endpoint(ep).baseUrl=data._links[ep].href;
            }
        }
    });
};

ozpIwc.EndpointRegistry.prototype.endpoint=function(name) {
    var endpoint=this.endPoints[name];
    if(!endpoint) {
        endpoint=this.endPoints[name]=new ozpIwc.Endpoint(this);
    }
    return endpoint;
};

ozpIwc.initEndpoints=function(apiRoot) {
    var registry=new ozpIwc.EndpointRegistry({'apiRoot':apiRoot});
    ozpIwc.endpoint=function(name) {
        return registry.endpoint(name);
    };
};