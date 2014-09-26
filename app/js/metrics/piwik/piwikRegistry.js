var ozpIwc=ozpIwc || {};
//ozpIwc.metrics=ozpIwc.metrics || {};

var _paq = _paq || [];


// Piwik Object
ozpIwc.Piwik = function(config) {
    
    this._paq = config._paq || [];
    //var self = this;
    this.metrics = config.metrics || {};
    this.client = config.client || {};
    
    console.log(this.client);
};

console.log(ozpIwc);

ozpIwc.Piwik.prototype.init = function(){
 // Send collected metrics to Piwik database
    this._paq.push(['trackPageView']);
    this._paq.push(['enableLinkTracking']);
    var self = this;
    (function() {
        var u = (("https:" == document.location.protocol) ? "https" : "http") + "://10.10.10.146/webapps/piwik/";
        self._paq.push(['setTrackerUrl', u + 'piwik.php']);
        self._paq.push(['setSiteId', 5]);
        
        for(var i in self._paq){
            _paq.push(self._paq[i]);
        }
        var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
        g.type = 'text/javascript';
        g.defer = true;
        g.async = true;
        g.src = u + 'piwik.js';
        s.parentNode.insertBefore(g, s);
    })();
    this._paq = [];
    console.log(_paq);
};

ozpIwc.Piwik.prototype.setupInternalMetric = function() {
    // ***This should maybe be done in a file specifically
    // for internal metrics
    
    // 1. Set URI metric
    var self = this;
    this.metrics.gauge("client.iframe.baseURI").set(function() {
        return self.client.iframe.baseURI;
    });

// 2. Set App title metric
    this.metrics.gauge("client.iframe.ownerDocument.title").set(function() {
        return self.client.iframe.ownerDocument.title;
    });
    //ozpIwc.metrics.counter("client.iframe.ownerDocument.title").inc();

// 3. Figure out meter metric - returns object
    this.metrics.meter(this.metricRoot, "visitor").mark(3);

// 4. Figure out timer metric - 
    this.metrics.timer();

// 5. Figure out histogram metric - 
    this.metrics.histogram("visits2");
};


ozpIwc.Piwik.prototype.addCustomMetric = function(metricName) {
    // Adds metrics value to _paq array
    
    switch(metricName) {
        case "VisitorType":
            // Value: Member
            metricIndex = 1;
            metricScope = "visit";
            break;
        case "App.Uri.Internal":
            metricValue = this.metrics.gauge("client.iframe.baseURI").get();
            metricIndex = 2;
            metricScope = "page";
            break;
        case "App.Title.Internal":
            metricValue = this.metrics.gauge("client.iframe.ownerDocument.title").get();
            metricIndex = 3;
            metricScope = "page";
            break;
        case "Visit.Meter.Internal":
            metricValue = this.metrics.meter("visitor").get().count;
            metricIndex = 2;
            metricScope = "visit";
            break;
        case "Visit.Histogram.Internal":
            metricValue = this.metrics.histogram("visits2").get().mean;
            metricIndex = 3;
            metricScope = "visit";
            break;
        default:
            // Metric not found
            return;
    }
    
    this._paq.push(['setCustomVariable',
        // Index, the number from 1 to 5 where this custom variable name is stored
        metricIndex,
        // Name, the name of the variable, for example: Gender, VisitorType
        metricName,
        // Value, for example: "Male", "Female" or "new", "engaged", "customer"
        metricValue,
        // Scope of the custom variable, "visit" means the custom variable applies to the current visit
        metricScope
    ]);
    
};

ozpIwc.Piwik.prototype.sendMetric = function(param) {
    
   this._paq.push(['trackPageView']);
   this._paq.push(['enableLinkTracking']);
   for(var i in this._paq){
            _paq.push(this._paq[i]);
    }
    this._paq = [];
};



// Instantiation is necessary.  New instance of Piwik with its own _paq, client, etc.
window.setTimeout(function(){
ozpIwc.piwik = new ozpIwc.Piwik({metrics : ozpIwc.metrics, 
    client : client});

// Example usage for tracking metrics:
ozpIwc.piwik.setupInternalMetric();
ozpIwc.piwik.addCustomMetric("App.Uri.Internal");
ozpIwc.piwik.addCustomMetric("App.Title.Internal");
ozpIwc.piwik.init();

// Send metrics to piwik at an interval
// Perhaps check if metrics are necessary (changed)
window.setInterval(function(){
    ozpIwc.piwik.addCustomMetric("App.Uri.Internal");
    ozpIwc.piwik.addCustomMetric("App.Title.Internal");
    ozpIwc.piwik.sendMetric();
    
}, 2000);
}, 1000);



//----------------------------------------------

// Sending metrics data straight to piwik [Deprecated]
/*
window.setTimeout(function(){

        // Goal tracking
	if (client.iframe.baseURI.indexOf("green") > -1) {
		_paq.push(['trackGoal', 1]);
	}

	_paq.push(['trackPageView']);
	_paq.push(['enableLinkTracking']);
	(function() {
		var u=(("https:" == document.location.protocol) ? "https" : "http") + "://10.10.10.145/webapps/piwik/";
		_paq.push(['setTrackerUrl', u+'piwik.php']);
		_paq.push(['setSiteId', 5]);
		var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0]; g.type='text/javascript';
		g.defer=true; g.async=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
	})();
	console.log(self.client);
        
        // Test logging:
        console.log(ozpIwc);
        
},1000);
*/


// ---------------------------------
// Use the internal Metrics framework for metrics data.
// Then send data to piwik as necessary

/*
window.setTimeout(function() {

// 1. Set URI metric
    ozpIwc.metrics.gauge("client.iframe.baseURI").set(function() {
        return client.iframe.baseURI;
    });

// 2. Set App title metric
    ozpIwc.metrics.gauge("client.iframe.ownerDocument.title").set(function() {
        return client.iframe.ownerDocument.title;
    });
    //ozpIwc.metrics.counter("client.iframe.ownerDocument.title").inc();

// 3. Figure out meter metric - returns object
    ozpIwc.metrics.meter(this.metricRoot,"visitor").mark(3);
    
// 4. Figure out timer metric - 
    ozpIwc.metrics.timer();

// 5. Figure out histogram metric - 
    ozpIwc.metrics.histogram("visits2");


// Send metric data to piwik using get
    _paq.push(['setCustomVariable',
        // Index, the number from 1 to 5 where this custom variable name is stored
        2,
        // Name, the name of the variable, for example: Gender, VisitorType
        "App.URI.Internal",
        // Value, for example: "Male", "Female" or "new", "engaged", "customer"
        ozpIwc.metrics.gauge("client.iframe.baseURI").get(),
        // Scope of the custom variable, "visit" means the custom variable applies to the current visit
        "page"
    ]);
    
    _paq.push(['setCustomVariable',
        // Index, the number from 1 to 5 where this custom variable name is stored
        3,
        // Name, the name of the variable, for example: Gender, VisitorType
        "App.Title.Internal",
        // Value, for example: "Male", "Female" or "new", "engaged", "customer"
        ozpIwc.metrics.gauge("client.iframe.ownerDocument.title").get(),
        // Scope of the custom variable, "visit" means the custom variable applies to the current visit
        "page"
    ]);
    
     _paq.push(['setCustomVariable',
        // Index, the number from 1 to 5 where this custom variable name is stored
        2,
        // Name, the name of the variable, for example: Gender, VisitorType
        "Visit.Meter.Internal",
        // Value, for example: "Male", "Female" or "new", "engaged", "customer"
        ozpIwc.metrics.meter("visitor").get().count,
        // Scope of the custom variable, "visit" means the custom variable applies to the current visit
        "visit"
    ]);
    
    _paq.push(['setCustomVariable',
        // Index, the number from 1 to 5 where this custom variable name is stored
        3,
        // Name, the name of the variable, for example: Gender, VisitorType
        "Visit.Histogram.Internal",
        // Value, for example: "Male", "Female" or "new", "engaged", "customer"
        ozpIwc.metrics.histogram("visits2").get().mean,
        // Scope of the custom variable, "visit" means the custom variable applies to the current visit
        "visit"
    ]);

    _paq.push(['trackPageView']);

}, 2000);
*/