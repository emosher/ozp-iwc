/** @namespace */
var ozpIwc=ozpIwc || {};

/** @namespace */
ozpIwc.util=ozpIwc.util || {};

/**
 * Generates a large hexidecimal string to serve as a unique ID.  Not a guid.
 * @returns {String}
 */
ozpIwc.util.generateId=function() {
    return Math.floor(Math.random() * 0xffffffff).toString(16);
};

/**
 * Used to get the current epoch time.  Tests overrides this
 * to allow a fast-forward on time-based actions.
 * @returns {Number}
 */
ozpIwc.util.now=function() {
    return new Date().getTime();
};

/**
 * Create a class with the given parent in it's prototype chain.
 * @param {function} baseClass - the class being derived from
 * @param {function} newConstructor - the new base class
 * @returns {Function} newConstructor with an augmented prototype
 */
ozpIwc.util.extend=function(baseClass,newConstructor) {
    if(!baseClass || !baseClass.prototype) {
        console.error("Cannot create a new class for ",newConstructor," due to invalid baseclass:",baseClass);
        throw new Error("Cannot create a new class due to invalid baseClass.  Dependency not loaded first?");
    };
    newConstructor.prototype = Object.create(baseClass.prototype);
    newConstructor.prototype.constructor = newConstructor;
    return newConstructor;
};

/**
 * Invokes the callback handler on another event loop as soon as possible.
*/
ozpIwc.util.setImmediate=function(f) {
//    window.setTimeout(f,0);
    window.setImmediate(f);
};

/**
 * Detect browser support for structured clones.
 * @returns {boolean} - true if structured clones are supported,
 * false otherwise
 */
ozpIwc.util.structuredCloneSupport=function() {
    if (ozpIwc.util.structuredCloneSupport.cache !== undefined) {
        return ozpIwc.util.structuredCloneSupport.cache;
    }
    var onlyStrings = false;
    //If the browser doesn't support structured clones, it will call toString() on the object passed to postMessage.
    //A bug in FF will cause File clone to fail (see https://bugzilla.mozilla.org/show_bug.cgi?id=722126)
    //We detect this using a test Blob
    try {
        window.postMessage({
            toString: function () {
                onlyStrings = true;
            },
            blob: new Blob()
        }, "*");
    } catch (e) {
        onlyStrings=true;
    }
    ozpIwc.util.structuredCloneSupport.cache=!onlyStrings;
    return ozpIwc.util.structuredCloneSupport.cache;
};

ozpIwc.util.structuredCloneSupport.cache=undefined;

/**
 * Does a deep clone of a serializable object.  Note that this will not
 * clone unserializable objects like DOM elements, Date, RegExp, etc.
 * @param {type} value - value to be cloned.
 * @returns {object} - a deep copy of the object
 */
ozpIwc.util.clone=function(value) {
	if(Array.isArray(value) || typeof(value) === 'object') {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            console.log(e);
        }
	} else {
		return value;
	}
};


/**
 * Returns true if every needle is found in the haystack.
 * @param {array} haystack - The array to search.
 * @param {array} needles - All of the values to search.
 * @param {function} [equal] - What constitutes equality.  Defaults to a===b.
 * @returns {boolean}
 */
ozpIwc.util.arrayContainsAll=function(haystack,needles,equal) {
    equal=equal || function(a,b) { return a===b;};
    return needles.every(function(needle) { 
        return haystack.some(function(hay) { 
            return equal(hay,needle);
        });
    });
};


/**
 * Returns true if the value every attribute in needs is equal to 
 * value of the same attribute in haystack.
 * @param {array} haystack - The object that must contain all attributes and values.
 * @param {array} needles - The reference object for the attributes and values.
 * @param {function} [equal] - What constitutes equality.  Defaults to a===b.
 * @returns {boolean}
 */
ozpIwc.util.objectContainsAll=function(haystack,needles,equal) {
    equal=equal || function(a,b) { return a===b;};
    
    for(var attribute in needles) {
        if(!equal(haystack[attribute],needles[attribute])) {
            return false;
        }
    }
    return true;
};

ozpIwc.util.parseQueryParams=function(query) {
    query = query || window.location.search;
    var params={};
	var regex=/\??([^&=]+)=?([^&]*)/g;
	var match;
	while(match=regex.exec(query)) {
		params[match[1]]=decodeURIComponent(match[2]);
	}
    return params;
};

ozpIwc.util.ajax = function (config) {
    return new Promise(function(resolve,reject) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState !== 4) {
                return;
            }

            if (request.status === 200) {
                resolve(JSON.parse(this.responseText));
            } else {
                reject(this);
            }
        };
        request.open(config.method, config.href, true);

        if(config.method === "POST") {
            request.send(config.data);
        }
        request.setRequestHeader("Content-Type", "application/json");
        request.setRequestHeader("Cache-Control", "no-cache");
        request.send();
    });
};