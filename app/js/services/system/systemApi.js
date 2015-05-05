ozpIwc.SystemApi = ozpIwc.createApi(function(config) {
    // The stock initializeData should do fine for us here as we're not using
    // any special subclasses for these items.  Might have to revisit this at
    // some point.
    this.endpoints = this.endpoints || [];
    this.endpoints.push(ozpIwc.linkRelPrefix + ":application");
    this.endpoints.push(ozpIwc.linkRelPrefix + ":user");
    this.endpoints.push(ozpIwc.linkRelPrefix + ":system");
});

ozpIwc.SystemApi.useDefaultRoute(["bulkGet", "list", "delete", "watch", "unwatch"]);
