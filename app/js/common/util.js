/**
 * @submodule common
 */

/**
 * @class util
 * @namespace ozpIwc
 * @static
 */
ozpIwc.util=ozpIwc.util || {};

/**
 * Used to get the current epoch time.  Tests overrides this
 * to allow a fast-forward on time-based actions.
 *
 * @method now
 * @returns {Number}
 */
ozpIwc.util.now=function() {
    return new Date().getTime();
};

/**
 * Create a class with the given parent in it's prototype chain.
 *
 * @method extend
 * @param {Function} baseClass The class being derived from.
 * @param {Function} newConstructor The new base class.
 *
 * @returns {Function} New Constructor with an augmented prototype.
 */
ozpIwc.util.extend=function(baseClass,newConstructor) {
    if(!baseClass || !baseClass.prototype) {
        ozpIwc.log.error("Cannot create a new class for ",newConstructor," due to invalid baseclass:",baseClass);
        throw new Error("Cannot create a new class due to invalid baseClass.  Dependency not loaded first?");
    }
    newConstructor.prototype = Object.create(baseClass.prototype);
    newConstructor.prototype.constructor = newConstructor;
    return newConstructor;
};

/**
 * Invoke postMessage on a given window in a safe manner. Test whether the browser
 * supports structured clones, and stringifies the message if not. Catches
 * errors (especially attempts to send non-cloneable objects), and tries to
 * send a stringified copy of the message asa fallback.
 *
 * @param window a window on which to invoke postMessage
 * @param msg the message to be sent
 * @param origin the target origin. The message will be sent only if it matches the origin of window.
 */
ozpIwc.util.safePostMessage = function(window,msg,origin) {
    try {
        var data = msg;
        if (!ozpIwc.util.structuredCloneSupport() && typeof data !== 'string') {
           data=JSON.stringify(msg);
        }
        window.postMessage(data, origin);
    } catch (e) {
        try {
            window.postMessage(JSON.stringify(msg), origin);
        } catch (e) {
            ozpIwc.util.log("Invalid call to window.postMessage: " + e.message);
        }
    }
};

/**
 * Detect browser support for structured clones. Returns quickly since it
 * caches the result. This method only determines browser support for structured
 * clones. Clients are responsible, when accessing capabilities that rely on structured
 * cloning, to ensure that objects to be cloned meet the criteria of the structured clone
 * algorithm. (See ozpIwc.util.safePostMessage for a method which handles attempts to
 * clone an invalid object.). NB: a bug in FF will cause file objects to be treated as
 * non-cloneable, even in FF versions that support structured clones.
 * (see https://bugzilla.mozilla.org/show_bug.cgi?id=722126).
 *
 * @private
 *
 * @method structuredCloneSupport
 *
 * @returns {Boolean} True if structured clones are supported, false otherwise.
 */
ozpIwc.util.structuredCloneSupport=function() {
    ozpIwc.util = ozpIwc.util || {};
    if (ozpIwc.util.structuredCloneSupportCache !== undefined) {
        return ozpIwc.util.structuredCloneSupportCache;
    }
    var cloneSupport = 'postMessage' in window;
    //If the browser doesn't support structured clones, it will call toString() on the object passed to postMessage.
    try {
        window.postMessage({
            toString: function () {
                cloneSupport = false;
            }
        }, "*");
    } catch (e) {
        //exception expected: objects with methods can't be cloned
        //e.DATA_CLONE_ERR will exist only for browsers with structured clone support, which can be used as an additional check if needed
    }
    ozpIwc.util.structuredCloneSupportCache=cloneSupport;
    return ozpIwc.util.structuredCloneSupportCache;
};

ozpIwc.util.structuredCloneSupport.cache=undefined;

/**
 * Does a deep clone of a serializable object.  Note that this will not
 * clone unserializable objects like DOM elements, Date, RegExp, etc.
 *
 * @method clone
 * @param {Array|Object} value The value to be cloned.
 * @returns {Array|Object}  a deep copy of the object
 */
ozpIwc.util.clone=function(value) {
	if(Array.isArray(value) || typeof(value) === 'object') {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            ozpIwc.log.log(e);
        }
	} else {
		return value;
	}
};

/**
 * Non serializable cloning. Used to include prototype functions in the cloned object by creating a new instance
 * and copying over any attributes.
 * @method protoClone
 * @param {Object|Array} obj
 * @returns {*|Array.<T>|string|Blob}
 */
ozpIwc.util.protoClone = function(obj) {

    if (obj instanceof Array) {
        return obj.slice();
    }

    // Handle Object
    if (obj instanceof Object) {
        var clone = new obj.constructor();
        for(var i in obj){

            if(obj.hasOwnProperty(i)){
                //recurse if needed
                clone[i] = ozpIwc.util.protoClone(obj[i]);
            } else{
                clone[i] = obj[i];
            }
        }
        return clone;
    }
    return obj;
};

/**
 * A regex method to parse query parameters.
 *
 * @method parseQueryParams
 * @param {String} query
 *
 */
ozpIwc.util.parseQueryParams=function(query) {
    query = query || window.location.search;
    var params={};
	var regex=/\??([^&=]+)=?([^&]*)/g;
	var match;
	while((match=regex.exec(query)) !== null) {
		params[match[1]]=decodeURIComponent(match[2]);
	}
    return params;
};

/**
 * Determines the origin of a given url.  
 * @method determineOrigin
 * @param url
 * @returns {String}
 */
ozpIwc.util.protocolPorts={
    "http:" : "80",
    "https:" : "443",
    "ws:" : "80",
    "wss:" : "443"
};
ozpIwc.util.determineOrigin=function(url) {
    var a=document.createElement("a");
    a.href = url;
    if(a.origin) {
        return a.origin;
    }
    var origin=a.protocol + "//" + a.hostname;
    /* Internet Explorer adds the port to urls in <a> tags created by a script, even
     * if it wasn't there to start with.  Thanks, IE!
     * https://connect.microsoft.com/IE/feedback/details/817343/ie11-scripting-value-of-htmlanchorelement-host-differs-between-script-created-link-and-link-from-document
     * 
     * Other browsers seem to drop the port if it's the default, so we'll do the same.
    */
   
    if(a.port && ozpIwc.util.protocolPorts[a.protocol] !== a.port) {
        origin+= ":" + a.port;
    }
    return origin;
};

/**
 * Escapes regular expression characters in a string.
 * @method escapeRegex
 * @param {String} str
 * @returns {String}
 */
ozpIwc.util.escapeRegex=function(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * 
 * @method parseOzpUrl
 * @param {type} url
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.util.parseOzpUrl=function(url) {
    var m = /^(?:(?:web\+ozp|ozp):\/\/)?([0-9a-zA-Z](?:[-.\w])*)(\/[^?#]*)(\?[^#]*)?(#.*)?$/.exec(decodeURIComponent(url));
    if (m) {
        // an action of "get" is implied
        var packet = {
            'dst': m[1],
            'resource': m[2],
            'action': "get"
        };
        // TODO: parse the query params into fields

        return packet;
    }
    return null;
};

/**
 * Returns true if the specified packet meets the criteria of an IWC Packet.
 * @method isIwcPacket
 * @static
 * @param {ozpIwc.TransportPacket} packet
 * @returns {Boolean}
 */
ozpIwc.util.isIWCPacket=function(packet) {
    if(typeof packet.src !== "string" ||typeof packet.dst !== "string" ||
        typeof packet.ver !== "number" || typeof packet.msgId !== "string") {
        return false;
    } else {
        return true;
    }
};

/**
 * Returns true if the the given document node is a direct descendant of the parent node.
 * @method isDirectDescendant
 * @param parent
 * @param child
 * @returns {boolean}
 */
ozpIwc.util.isDirectDescendant = function(child,parent){
    if (child.parentNode === parent) {
        return true;
    }
    return false;
};

/**
 *
 * @param {Object} config
 * @param {Array<String>} config.reqAttrs
 * @param {Array<String>} config.optAttrs
 * @param {Array<String>} config.reqNodes
 * @param {Array<String>} config.optNodes
 */
ozpIwc.util.elementParser = function(config){
    config = config || {};

    config.reqAttrs = config.reqAttrs || [];
    config.optAttrs = config.optAttrs || [];
    config.reqNodes = config.reqNodes || [];
    config.optNodes = config.optNodes || [];

    var element = config.element || {};

    var findings = {
        attrs: {},
        nodes: {}
    };
    config.reqAttrs.forEach(function(attr){
        var attribute = element.getAttribute(attr);
        if(attribute){
//            console.log('Found attribute of policy,(',attr,',',attribute,')');
            findings.attrs[attr] = attribute;
        } else {
            console.error('Required attribute not found,(',attr,')');
        }

    });

    config.optAttrs.forEach(function(attr){
        var attribute = element.getAttribute(attr);
        if(attribute){
//            console.log('Found attribute of policy,(',attr,',',attribute,')');
            findings.attrs[attr] = attribute;
        }

    });

    config.reqNodes.forEach(function(tag){
        var nodes = element.getElementsByTagName(tag);
        findings.nodes[tag] = findings.nodes[tag] || [];
        for(var i in nodes){
            if(ozpIwc.util.isDirectDescendant(nodes[i],element)){
//                console.log('Found node of policy: ', nodes[i]);
                findings.nodes[tag].push(nodes[i]);
            }
        }
        if(findings.nodes[tag].length <= 0) {
            console.error('Required node not found,(',tag,')');
        }
    });
    config.optNodes.forEach(function(tag){
        var nodes = element.getElementsByTagName(tag);
        for(var i in nodes){
            if(ozpIwc.util.isDirectDescendant(nodes[i],element)){
//                console.log('Found node of policy: ', nodes[i]);
                findings.nodes[tag] = findings.nodes[tag] || [];
                findings.nodes[tag].push(nodes[i]);
            }
        }
    });
    return findings;
};

ozpIwc.util.camelCased = function(string){
    return string.charAt(0).toLowerCase() + string.substring(1);
};

/**
 * Shortened call for returning a resolving promise (cleans up promise chaining)
 * @param {*} obj any valid javascript to resolve with.
 * @returns {Promise}
 */
ozpIwc.util.resolveWith = function(obj){
    return new Promise(function(resolve,reject){
        resolve(obj);
    });
};
/**
 * Shortened call for returning a rejecting promise (cleans up promise chaining)
 * @param {*} obj any valid javascript to reject with.
 * @returns {Promise}
 */
ozpIwc.util.rejectWith = function(obj){
    return new Promise(function(resolve,reject){
        reject(obj);
    });
};

/**
 * Returns the version of Internet Explorer or a -1
 * (indicating the use of another browser).
 * @returns {number}
 */
ozpIwc.util.getInternetExplorerVersion= function() {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName === 'Microsoft Internet Explorer')
    {
        var ua = navigator.userAgent;
        var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) !== null) {
            rv = parseFloat(RegExp.$1);
        }
    }
    return rv;
};