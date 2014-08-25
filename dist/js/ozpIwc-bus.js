/** @namespace */
var ozpIwc=ozpIwc || {};

/**
	* @class
	*/
ozpIwc.Event=function() {
	this.events={};
};

/**
 * Registers a handler for the the event.
 * @param {string} event The name of the event to trigger on
 * @param {function} callback Function to be invoked
 * @param {object} [self] Used as the this pointer when callback is invoked.
 * @returns {object} A handle that can be used to unregister the callback via [off()]{@link ozpIwc.Event#off}
 */
ozpIwc.Event.prototype.on=function(event,callback,self) {
	var wrapped=callback;
	if(self) {
		wrapped=function() {
			callback.apply(self,arguments);
		};
		wrapped.ozpIwcDelegateFor=callback;
	}
	this.events[event]=this.events[event]||[];
	this.events[event].push(wrapped);
	return wrapped;
};

/**
 * Unregisters an event handler previously registered.
 * @param {type} event
 * @param {type} callback
 */
ozpIwc.Event.prototype.off=function(event,callback) {
	this.events[event]=(this.events[event]||[]).filter( function(h) {
		return h!==callback && h.ozpIwcDelegateFor !== callback;
	});
};

/**
 * Fires an event that will be received by all handlers.
 * @param {string} eventName  - Name of the event
 * @param {object} event - Event object to pass to the handers.
 * @returns {object} The event after all handlers have processed it
 */
ozpIwc.Event.prototype.trigger=function(eventName,event) {
	event = event || new ozpIwc.CancelableEvent();
	var handlers=this.events[eventName] || [];

	handlers.forEach(function(h) {
		h(event);
	});
	return event;
};


/**
 * Adds an on() and off() function to the target that delegate to this object
 * @param {object} target Target to receive the on/off functions
 */
ozpIwc.Event.prototype.mixinOnOff=function(target) {
	var self=this;
	target.on=function() { return self.on.apply(self,arguments);};
	target.off=function() { return self.off.apply(self,arguments);};
};

/**
 * Convenient base for events that can be canceled.  Provides and manages
 * the properties canceled and cancelReason, as well as the member function
 * cancel().
 * @class
 * @param {object} data - Data that will be copied into the event
 */
ozpIwc.CancelableEvent=function(data) {
	data = data || {};
	for(var k in data) {
		this[k]=data[k];
	}
	this.canceled=false;
	this.cancelReason=null;
};

/**
 * Marks the event as canceled.
 * @param {type} reason - A text description of why the event was canceled.
 * @returns {ozpIwc.CancelableEvent} Reference to self
 */
ozpIwc.CancelableEvent.prototype.cancel=function(reason) {
	reason= reason || "Unknown";
	this.canceled=true;
	this.cancelReason=reason;
	return this;
};

/** @namespace */
var ozpIwc=ozpIwc || {};


/**
 * A deferred action, but not in the sense of the Javascript standard.
 * @class
 */
ozpIwc.AsyncAction=function() {
	this.callbacks={};
};

ozpIwc.AsyncAction.prototype.when=function(state,callback,self) {
    self=self || this;
	
	if(this.resolution === state) {
		callback.apply(self,this.value);
	} else {
		this.callbacks[state]=function() { return callback.apply(self,arguments); };
	}
	return this;
};


ozpIwc.AsyncAction.prototype.resolve=function(status) {
	if(this.resolution) {
		throw "Cannot resolve an already resolved AsyncAction";
	}
	var callback=this.callbacks[status];
	this.resolution=status;
	this.value=Array.prototype.slice.call(arguments,1);
	
	if(callback) {
		callback.apply(this,this.value);
	}
	return this;
};

ozpIwc.AsyncAction.prototype.success=function(callback,self) {
	return this.when("success",callback,self);
};

ozpIwc.AsyncAction.prototype.failure=function(callback,self) {
	return this.when("failure",callback,self);
};
/*!
 * https://github.com/es-shims/es5-shim
 * @license es5-shim Copyright 2009-2014 by contributors, MIT License
 * see https://github.com/es-shims/es5-shim/blob/master/LICENSE
 */

// vim: ts=4 sts=4 sw=4 expandtab

//Add semicolon to prevent IIFE from being passed as argument to concated code.
;

// UMD (Universal Module Definition)
// see https://github.com/umdjs/umd/blob/master/returnExports.js
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
  }
}(this, function () {

var call = Function.prototype.call;
var prototypeOfObject = Object.prototype;
var owns = call.bind(prototypeOfObject.hasOwnProperty);

// If JS engine supports accessors creating shortcuts.
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors = owns(prototypeOfObject, "__defineGetter__");
if (supportsAccessors) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}

// ES5 15.2.3.2
// http://es5.github.com/#x15.2.3.2
if (!Object.getPrototypeOf) {
    // https://github.com/es-shims/es5-shim/issues#issue/2
    // http://ejohn.org/blog/objectgetprototypeof/
    // recommended by fschaefer on github
    //
    // sure, and webreflection says ^_^
    // ... this will nerever possibly return null
    // ... Opera Mini breaks here with infinite loops
    Object.getPrototypeOf = function getPrototypeOf(object) {
        var proto = object.__proto__;
        if (proto || proto === null) {
            return proto;
        } else if (object.constructor) {
            return object.constructor.prototype;
        } else {
            return prototypeOfObject;
        }
    };
}

//ES5 15.2.3.3
//http://es5.github.com/#x15.2.3.3

function doesGetOwnPropertyDescriptorWork(object) {
    try {
        object.sentinel = 0;
        return Object.getOwnPropertyDescriptor(
                object,
                "sentinel"
        ).value === 0;
    } catch (exception) {
        // returns falsy
    }
}

//check whether getOwnPropertyDescriptor works if it's given. Otherwise,
//shim partially.
if (Object.defineProperty) {
    var getOwnPropertyDescriptorWorksOnObject = doesGetOwnPropertyDescriptorWork({});
    var getOwnPropertyDescriptorWorksOnDom = typeof document === "undefined" ||
    doesGetOwnPropertyDescriptorWork(document.createElement("div"));
    if (!getOwnPropertyDescriptorWorksOnDom || !getOwnPropertyDescriptorWorksOnObject) {
        var getOwnPropertyDescriptorFallback = Object.getOwnPropertyDescriptor;
    }
}

if (!Object.getOwnPropertyDescriptor || getOwnPropertyDescriptorFallback) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a non-object: ";

    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
        if ((typeof object !== "object" && typeof object !== "function") || object === null) {
            throw new TypeError(ERR_NON_OBJECT + object);
        }

        // make a valiant attempt to use the real getOwnPropertyDescriptor
        // for I8's DOM elements.
        if (getOwnPropertyDescriptorFallback) {
            try {
                return getOwnPropertyDescriptorFallback.call(Object, object, property);
            } catch (exception) {
                // try the shim if the real one doesn't work
            }
        }

        // If object does not owns property return undefined immediately.
        if (!owns(object, property)) {
            return;
        }

        // If object has a property then it's for sure both `enumerable` and
        // `configurable`.
        var descriptor =  { enumerable: true, configurable: true };

        // If JS engine supports accessor properties then property may be a
        // getter or setter.
        if (supportsAccessors) {
            // Unfortunately `__lookupGetter__` will return a getter even
            // if object has own non getter property along with a same named
            // inherited getter. To avoid misbehavior we temporary remove
            // `__proto__` so that `__lookupGetter__` will return getter only
            // if it's owned by an object.
            var prototype = object.__proto__;
            var notPrototypeOfObject = object !== prototypeOfObject;
            // avoid recursion problem, breaking in Opera Mini when
            // Object.getOwnPropertyDescriptor(Object.prototype, 'toString')
            // or any other Object.prototype accessor
            if (notPrototypeOfObject) {
                object.__proto__ = prototypeOfObject;
            }

            var getter = lookupGetter(object, property);
            var setter = lookupSetter(object, property);

            if (notPrototypeOfObject) {
                // Once we have getter and setter we can put values back.
                object.__proto__ = prototype;
            }

            if (getter || setter) {
                if (getter) {
                    descriptor.get = getter;
                }
                if (setter) {
                    descriptor.set = setter;
                }
                // If it was accessor property we're done and return here
                // in order to avoid adding `value` to the descriptor.
                return descriptor;
            }
        }

        // If we got this far we know that object has an own property that is
        // not an accessor so we set it as a value and return descriptor.
        descriptor.value = object[property];
        descriptor.writable = true;
        return descriptor;
    };
}

// ES5 15.2.3.4
// http://es5.github.com/#x15.2.3.4
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
        return Object.keys(object);
    };
}

// ES5 15.2.3.5
// http://es5.github.com/#x15.2.3.5
if (!Object.create) {

    // Contributed by Brandon Benvie, October, 2012
    var createEmpty;
    var supportsProto = !({__proto__:null} instanceof Object);
                        // the following produces false positives
                        // in Opera Mini => not a reliable check
                        // Object.prototype.__proto__ === null
    if (supportsProto || typeof document === 'undefined') {
        createEmpty = function () {
            return { "__proto__": null };
        };
    } else {
        // In old IE __proto__ can't be used to manually set `null`, nor does
        // any other method exist to make an object that inherits from nothing,
        // aside from Object.prototype itself. Instead, create a new global
        // object and *steal* its Object.prototype and strip it bare. This is
        // used as the prototype to create nullary objects.
        createEmpty = function () {
            var iframe = document.createElement('iframe');
            var parent = document.body || document.documentElement;
            iframe.style.display = 'none';
            parent.appendChild(iframe);
            iframe.src = 'javascript:';
            var empty = iframe.contentWindow.Object.prototype;
            parent.removeChild(iframe);
            iframe = null;
            delete empty.constructor;
            delete empty.hasOwnProperty;
            delete empty.propertyIsEnumerable;
            delete empty.isPrototypeOf;
            delete empty.toLocaleString;
            delete empty.toString;
            delete empty.valueOf;
            empty.__proto__ = null;

            function Empty() {}
            Empty.prototype = empty;
            // short-circuit future calls
            createEmpty = function () {
                return new Empty();
            };
            return new Empty();
        };
    }

    Object.create = function create(prototype, properties) {

        var object;
        function Type() {}  // An empty constructor.

        if (prototype === null) {
            object = createEmpty();
        } else {
            if (typeof prototype !== "object" && typeof prototype !== "function") {
                // In the native implementation `parent` can be `null`
                // OR *any* `instanceof Object`  (Object|Function|Array|RegExp|etc)
                // Use `typeof` tho, b/c in old IE, DOM elements are not `instanceof Object`
                // like they are in modern browsers. Using `Object.create` on DOM elements
                // is...err...probably inappropriate, but the native version allows for it.
                throw new TypeError("Object prototype may only be an Object or null"); // same msg as Chrome
            }
            Type.prototype = prototype;
            object = new Type();
            // IE has no built-in implementation of `Object.getPrototypeOf`
            // neither `__proto__`, but this manually setting `__proto__` will
            // guarantee that `Object.getPrototypeOf` will work as expected with
            // objects created using `Object.create`
            object.__proto__ = prototype;
        }

        if (properties !== void 0) {
            Object.defineProperties(object, properties);
        }

        return object;
    };
}

// ES5 15.2.3.6
// http://es5.github.com/#x15.2.3.6

// Patch for WebKit and IE8 standard mode
// Designed by hax <hax.github.com>
// related issue: https://github.com/es-shims/es5-shim/issues#issue/5
// IE8 Reference:
//     http://msdn.microsoft.com/en-us/library/dd282900.aspx
//     http://msdn.microsoft.com/en-us/library/dd229916.aspx
// WebKit Bugs:
//     https://bugs.webkit.org/show_bug.cgi?id=36423

function doesDefinePropertyWork(object) {
    try {
        Object.defineProperty(object, "sentinel", {});
        return "sentinel" in object;
    } catch (exception) {
        // returns falsy
    }
}

// check whether defineProperty works if it's given. Otherwise,
// shim partially.
if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document === "undefined" ||
        doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
        var definePropertyFallback = Object.defineProperty,
            definePropertiesFallback = Object.defineProperties;
    }
}

if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
                                      "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
        if ((typeof object !== "object" && typeof object !== "function") || object === null) {
            throw new TypeError(ERR_NON_OBJECT_TARGET + object);
        }
        if ((typeof descriptor !== "object" && typeof descriptor !== "function") || descriptor === null) {
            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);
        }
        // make a valiant attempt to use the real defineProperty
        // for I8's DOM elements.
        if (definePropertyFallback) {
            try {
                return definePropertyFallback.call(Object, object, property, descriptor);
            } catch (exception) {
                // try the shim if the real one doesn't work
            }
        }

        // If it's a data property.
        if (owns(descriptor, "value")) {
            // fail silently if "writable", "enumerable", or "configurable"
            // are requested but not supported
            /*
            // alternate approach:
            if ( // can't implement these features; allow false but not true
                !(owns(descriptor, "writable") ? descriptor.writable : true) ||
                !(owns(descriptor, "enumerable") ? descriptor.enumerable : true) ||
                !(owns(descriptor, "configurable") ? descriptor.configurable : true)
            )
                throw new RangeError(
                    "This implementation of Object.defineProperty does not " +
                    "support configurable, enumerable, or writable."
                );
            */

            if (supportsAccessors && (lookupGetter(object, property) ||
                                      lookupSetter(object, property)))
            {
                // As accessors are supported only on engines implementing
                // `__proto__` we can safely override `__proto__` while defining
                // a property to make sure that we don't hit an inherited
                // accessor.
                var prototype = object.__proto__;
                object.__proto__ = prototypeOfObject;
                // Deleting a property anyway since getter / setter may be
                // defined on object itself.
                delete object[property];
                object[property] = descriptor.value;
                // Setting original `__proto__` back now.
                object.__proto__ = prototype;
            } else {
                object[property] = descriptor.value;
            }
        } else {
            if (!supportsAccessors) {
                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
            }
            // If we got that far then getters and setters can be defined !!
            if (owns(descriptor, "get")) {
                defineGetter(object, property, descriptor.get);
            }
            if (owns(descriptor, "set")) {
                defineSetter(object, property, descriptor.set);
            }
        }
        return object;
    };
}

// ES5 15.2.3.7
// http://es5.github.com/#x15.2.3.7
if (!Object.defineProperties || definePropertiesFallback) {
    Object.defineProperties = function defineProperties(object, properties) {
        // make a valiant attempt to use the real defineProperties
        if (definePropertiesFallback) {
            try {
                return definePropertiesFallback.call(Object, object, properties);
            } catch (exception) {
                // try the shim if the real one doesn't work
            }
        }

        for (var property in properties) {
            if (owns(properties, property) && property !== "__proto__") {
                Object.defineProperty(object, property, properties[property]);
            }
        }
        return object;
    };
}

// ES5 15.2.3.8
// http://es5.github.com/#x15.2.3.8
if (!Object.seal) {
    Object.seal = function seal(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.9
// http://es5.github.com/#x15.2.3.9
if (!Object.freeze) {
    Object.freeze = function freeze(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// detect a Rhino bug and patch it
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function freeze(freezeObject) {
        return function freeze(object) {
            if (typeof object === "function") {
                return object;
            } else {
                return freezeObject(object);
            }
        };
    })(Object.freeze);
}

// ES5 15.2.3.10
// http://es5.github.com/#x15.2.3.10
if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.11
// http://es5.github.com/#x15.2.3.11
if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
        return false;
    };
}

// ES5 15.2.3.12
// http://es5.github.com/#x15.2.3.12
if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
        return false;
    };
}

// ES5 15.2.3.13
// http://es5.github.com/#x15.2.3.13
if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
        // 1. If Type(O) is not Object throw a TypeError exception.
        if (Object(object) !== object) {
            throw new TypeError(); // TODO message
        }
        // 2. Return the Boolean value of the [[Extensible]] internal property of O.
        var name = '';
        while (owns(object, name)) {
            name += '?';
        }
        object[name] = true;
        var returnValue = owns(object, name);
        delete object[name];
        return returnValue;
    };
}

}));


/*!
 * https://github.com/es-shims/es5-shim
 * @license es5-shim Copyright 2009-2014 by contributors, MIT License
 * see https://github.com/es-shims/es5-shim/blob/master/LICENSE
 */

// vim: ts=4 sts=4 sw=4 expandtab

//Add semicolon to prevent IIFE from being passed as argument to concated code.
;

// UMD (Universal Module Definition)
// see https://github.com/umdjs/umd/blob/master/returnExports.js
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
}(this, function () {

/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * Annotated ES5: http://es5.github.com/ (specific links below)
 * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
 * Required reading: http://javascriptweblog.wordpress.com/2011/12/05/extending-javascript-natives/
 */

// Shortcut to an often accessed properties, in order to avoid multiple
// dereference that costs universally.
var ArrayPrototype = Array.prototype;
var ObjectPrototype = Object.prototype;
var FunctionPrototype = Function.prototype;
var StringPrototype = String.prototype;
var NumberPrototype = Number.prototype;
var array_slice = ArrayPrototype.slice;
var array_splice = ArrayPrototype.splice;
var array_push = ArrayPrototype.push;
var array_unshift = ArrayPrototype.unshift;
var call = FunctionPrototype.call;

// Having a toString local variable name breaks in Opera so use _toString.
var _toString = ObjectPrototype.toString;

var isFunction = function (val) {
    return ObjectPrototype.toString.call(val) === '[object Function]';
};
var isRegex = function (val) {
    return ObjectPrototype.toString.call(val) === '[object RegExp]';
};
var isArray = function isArray(obj) {
    return _toString.call(obj) === "[object Array]";
};
var isString = function isString(obj) {
    return _toString.call(obj) === "[object String]";
};
var isArguments = function isArguments(value) {
    var str = _toString.call(value);
    var isArgs = str === '[object Arguments]';
    if (!isArgs) {
        isArgs = !isArray(value)
            && value !== null
            && typeof value === 'object'
            && typeof value.length === 'number'
            && value.length >= 0
            && isFunction(value.callee);
    }
    return isArgs;
};

var supportsDescriptors = Object.defineProperty && (function () {
    try {
        Object.defineProperty({}, 'x', {});
        return true;
    } catch (e) { /* this is ES3 */
        return false;
    }
}());

// Define configurable, writable and non-enumerable props
// if they don't exist.
var defineProperty;
if (supportsDescriptors) {
    defineProperty = function (object, name, method, forceAssign) {
        if (!forceAssign && (name in object)) { return; }
        Object.defineProperty(object, name, {
            configurable: true,
            enumerable: false,
            writable: true,
            value: method
        });
    };
} else {
    defineProperty = function (object, name, method, forceAssign) {
        if (!forceAssign && (name in object)) { return; }
        object[name] = method;
    };
}
var defineProperties = function (object, map, forceAssign) {
    for (var name in map) {
        if (ObjectPrototype.hasOwnProperty.call(map, name)) {
          defineProperty(object, name, map[name], forceAssign);
        }
    }
};

//
// Util
// ======
//

// ES5 9.4
// http://es5.github.com/#x9.4
// http://jsperf.com/to-integer

function toInteger(n) {
    n = +n;
    if (n !== n) { // isNaN
        n = 0;
    } else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
}

function isPrimitive(input) {
    var type = typeof input;
    return (
        input === null ||
        type === "undefined" ||
        type === "boolean" ||
        type === "number" ||
        type === "string"
    );
}

function toPrimitive(input) {
    var val, valueOf, toStr;
    if (isPrimitive(input)) {
        return input;
    }
    valueOf = input.valueOf;
    if (isFunction(valueOf)) {
        val = valueOf.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    toStr = input.toString;
    if (isFunction(toStr)) {
        val = toStr.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    throw new TypeError();
}

// ES5 9.9
// http://es5.github.com/#x9.9
var toObject = function (o) {
    if (o == null) { // this matches both null and undefined
        throw new TypeError("can't convert " + o + " to object");
    }
    return Object(o);
};

var ToUint32 = function ToUint32(x) {
    return x >>> 0;
};

//
// Function
// ========
//

// ES-5 15.3.4.5
// http://es5.github.com/#x15.3.4.5

function Empty() {}

defineProperties(FunctionPrototype, {
    bind: function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (!isFunction(target)) {
            throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        // XXX slicedArgs will stand in for "A" if used
        var args = array_slice.call(arguments, 1); // for normal call
        // 4. Let F be a new native ECMAScript object.
        // 11. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 12. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 13. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 14. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        var binder = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs, the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Construct]] internal
                //   method of target providing args as the arguments.

                var result = target.apply(
                    this,
                    args.concat(array_slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs, the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Call]] internal method
                //   of target providing boundThis as the this value and
                //   providing args as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.apply(
                    that,
                    args.concat(array_slice.call(arguments))
                );

            }

        };

        // 15. If the [[Class]] internal property of Target is "Function", then
        //     a. Let L be the length property of Target minus the length of A.
        //     b. Set the length own property of F to either 0 or L, whichever is
        //       larger.
        // 16. Else set the length own property of F to 0.

        var boundLength = Math.max(0, target.length - args.length);

        // 17. Set the attributes of the length own property of F to the values
        //   specified in 15.3.5.1.
        var boundArgs = [];
        for (var i = 0; i < boundLength; i++) {
            boundArgs.push("$" + i);
        }

        // XXX Build a dynamic function with desired amount of arguments is the only
        // way to set the length property of a function.
        // In environments where Content Security Policies enabled (Chrome extensions,
        // for ex.) all use of eval or Function costructor throws an exception.
        // However in all of these environments Function.prototype.bind exists
        // and so this code will never be executed.
        var bound = Function("binder", "return function (" + boundArgs.join(",") + "){return binder.apply(this,arguments)}")(binder);

        if (target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            // Clean up dangling references.
            Empty.prototype = null;
        }

        // TODO
        // 18. Set the [[Extensible]] internal property of F to true.

        // TODO
        // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
        // 20. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
        //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and
        //   false.
        // 21. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Get]]: thrower,
        //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
        //   and false.

        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property or the [[Code]], [[FormalParameters]], and
        // [[Scope]] internal properties.
        // XXX can't delete prototype in pure-js.

        // 22. Return F.
        return bound;
    }
});

// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
// us it in defining shortcuts.
var owns = call.bind(ObjectPrototype.hasOwnProperty);

// If JS engine supports accessors creating shortcuts.
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(ObjectPrototype, "__defineGetter__"))) {
    defineGetter = call.bind(ObjectPrototype.__defineGetter__);
    defineSetter = call.bind(ObjectPrototype.__defineSetter__);
    lookupGetter = call.bind(ObjectPrototype.__lookupGetter__);
    lookupSetter = call.bind(ObjectPrototype.__lookupSetter__);
}

//
// Array
// =====
//

// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.12
var spliceNoopReturnsEmptyArray = (function () {
    var a = [1, 2];
    var result = a.splice();
    return a.length === 2 && isArray(result) && result.length === 0;
}());
defineProperties(ArrayPrototype, {
    // Safari 5.0 bug where .splice() returns undefined
    splice: function splice(start, deleteCount) {
        if (arguments.length === 0) {
            return [];
        } else {
            return array_splice.apply(this, arguments);
        }
    }
}, spliceNoopReturnsEmptyArray);

var spliceWorksWithEmptyObject = (function () {
    var obj = {};
    ArrayPrototype.splice.call(obj, 0, 0, 1);
    return obj.length === 1;
}());
defineProperties(ArrayPrototype, {
    splice: function splice(start, deleteCount) {
        if (arguments.length === 0) { return []; }
        var args = arguments;
        this.length = Math.max(toInteger(this.length), 0);
        if (arguments.length > 0 && typeof deleteCount !== 'number') {
            args = array_slice.call(arguments);
            if (args.length < 2) {
                args.push(this.length - start);
            } else {
                args[1] = toInteger(deleteCount);
            }
        }
        return array_splice.apply(this, args);
    }
}, !spliceWorksWithEmptyObject);

// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.13
// Return len+argCount.
// [bugfix, ielt8]
// IE < 8 bug: [].unshift(0) === undefined but should be "1"
var hasUnshiftReturnValueBug = [].unshift(0) !== 1;
defineProperties(ArrayPrototype, {
    unshift: function () {
        array_unshift.apply(this, arguments);
        return this.length;
    }
}, hasUnshiftReturnValueBug);

// ES5 15.4.3.2
// http://es5.github.com/#x15.4.3.2
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
defineProperties(Array, { isArray: isArray });

// The IsCallable() check in the Array functions
// has been replaced with a strict check on the
// internal class of the object to trap cases where
// the provided function was actually a regular
// expression literal, which in V8 and
// JavaScriptCore is a typeof "function".  Only in
// V8 are regular expression literals permitted as
// reduce parameters, so it is desirable in the
// general case for the shim to match the more
// strict and common behavior of rejecting regular
// expressions.

// ES5 15.4.4.18
// http://es5.github.com/#x15.4.4.18
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach

// Check failure of by-index access of string characters (IE < 9)
// and failure of `0 in boxedString` (Rhino)
var boxedString = Object("a");
var splitString = boxedString[0] !== "a" || !(0 in boxedString);

var properlyBoxesContext = function properlyBoxed(method) {
    // Check node 0.6.21 bug where third parameter is not boxed
    var properlyBoxesNonStrict = true;
    var properlyBoxesStrict = true;
    if (method) {
        method.call('foo', function (_, __, context) {
            if (typeof context !== 'object') { properlyBoxesNonStrict = false; }
        });

        method.call([1], function () {
            'use strict';
            properlyBoxesStrict = typeof this === 'string';
        }, 'x');
    }
    return !!method && properlyBoxesNonStrict && properlyBoxesStrict;
};

defineProperties(ArrayPrototype, {
    forEach: function forEach(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && isString(this) ? this.split('') : object,
            thisp = arguments[1],
            i = -1,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (!isFunction(fun)) {
            throw new TypeError(); // TODO message
        }

        while (++i < length) {
            if (i in self) {
                // Invoke the callback function with call, passing arguments:
                // context, property value, property key, thisArg object
                // context
                fun.call(thisp, self[i], i, object);
            }
        }
    }
}, !properlyBoxesContext(ArrayPrototype.forEach));

// ES5 15.4.4.19
// http://es5.github.com/#x15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
defineProperties(ArrayPrototype, {
    map: function map(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && isString(this) ? this.split('') : object,
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (!isFunction(fun)) {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                result[i] = fun.call(thisp, self[i], i, object);
            }
        }
        return result;
    }
}, !properlyBoxesContext(ArrayPrototype.map));

// ES5 15.4.4.20
// http://es5.github.com/#x15.4.4.20
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
defineProperties(ArrayPrototype, {
    filter: function filter(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && isString(this) ? this.split('') : object,
            length = self.length >>> 0,
            result = [],
            value,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (!isFunction(fun)) {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (fun.call(thisp, value, i, object)) {
                    result.push(value);
                }
            }
        }
        return result;
    }
}, !properlyBoxesContext(ArrayPrototype.filter));

// ES5 15.4.4.16
// http://es5.github.com/#x15.4.4.16
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
defineProperties(ArrayPrototype, {
    every: function every(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && isString(this) ? this.split('') : object,
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (!isFunction(fun)) {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, object)) {
                return false;
            }
        }
        return true;
    }
}, !properlyBoxesContext(ArrayPrototype.every));

// ES5 15.4.4.17
// http://es5.github.com/#x15.4.4.17
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
defineProperties(ArrayPrototype, {
    some: function some(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && isString(this) ? this.split('') : object,
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (!isFunction(fun)) {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, object)) {
                return true;
            }
        }
        return false;
    }
}, !properlyBoxesContext(ArrayPrototype.some));

// ES5 15.4.4.21
// http://es5.github.com/#x15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
var reduceCoercesToObject = false;
if (ArrayPrototype.reduce) {
    reduceCoercesToObject = typeof ArrayPrototype.reduce.call('es5', function (_, __, ___, list) { return list; }) === 'object';
}
defineProperties(ArrayPrototype, {
    reduce: function reduce(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && isString(this) ? this.split('') : object,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (!isFunction(fun)) {
            throw new TypeError(fun + " is not a function");
        }

        // no value to return if no initial value and an empty array
        if (!length && arguments.length === 1) {
            throw new TypeError("reduce of empty array with no initial value");
        }

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= length) {
                    throw new TypeError("reduce of empty array with no initial value");
                }
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        }

        return result;
    }
}, !reduceCoercesToObject);

// ES5 15.4.4.22
// http://es5.github.com/#x15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
var reduceRightCoercesToObject = false;
if (ArrayPrototype.reduceRight) {
    reduceRightCoercesToObject = typeof ArrayPrototype.reduceRight.call('es5', function (_, __, ___, list) { return list; }) === 'object';
}
defineProperties(ArrayPrototype, {
    reduceRight: function reduceRight(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && isString(this) ? this.split('') : object,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (!isFunction(fun)) {
            throw new TypeError(fun + " is not a function");
        }

        // no value to return if no initial value, empty array
        if (!length && arguments.length === 1) {
            throw new TypeError("reduceRight of empty array with no initial value");
        }

        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0) {
                    throw new TypeError("reduceRight of empty array with no initial value");
                }
            } while (true);
        }

        if (i < 0) {
            return result;
        }

        do {
            if (i in self) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        } while (i--);

        return result;
    }
}, !reduceRightCoercesToObject);

// ES5 15.4.4.14
// http://es5.github.com/#x15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
var hasFirefox2IndexOfBug = Array.prototype.indexOf && [0, 1].indexOf(1, 2) !== -1;
defineProperties(ArrayPrototype, {
    indexOf: function indexOf(sought /*, fromIndex */ ) {
        var self = splitString && isString(this) ? this.split('') : toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }

        var i = 0;
        if (arguments.length > 1) {
            i = toInteger(arguments[1]);
        }

        // handle negative indices
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    }
}, hasFirefox2IndexOfBug);

// ES5 15.4.4.15
// http://es5.github.com/#x15.4.4.15
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
var hasFirefox2LastIndexOfBug = Array.prototype.lastIndexOf && [0, 1].lastIndexOf(0, -3) !== -1;
defineProperties(ArrayPrototype, {
    lastIndexOf: function lastIndexOf(sought /*, fromIndex */) {
        var self = splitString && isString(this) ? this.split('') : toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = Math.min(i, toInteger(arguments[1]));
        }
        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i]) {
                return i;
            }
        }
        return -1;
    }
}, hasFirefox2LastIndexOfBug);

//
// Object
// ======
//

// ES5 15.2.3.14
// http://es5.github.com/#x15.2.3.14

// http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
var hasDontEnumBug = !({'toString': null}).propertyIsEnumerable('toString'),
    hasProtoEnumBug = (function () {}).propertyIsEnumerable('prototype'),
    dontEnums = [
        "toString",
        "toLocaleString",
        "valueOf",
        "hasOwnProperty",
        "isPrototypeOf",
        "propertyIsEnumerable",
        "constructor"
    ],
    dontEnumsLength = dontEnums.length;

defineProperties(Object, {
    keys: function keys(object) {
        var isFn = isFunction(object),
            isArgs = isArguments(object),
            isObject = object !== null && typeof object === 'object',
            isStr = isObject && isString(object);

        if (!isObject && !isFn && !isArgs) {
            throw new TypeError("Object.keys called on a non-object");
        }

        var theKeys = [];
        var skipProto = hasProtoEnumBug && isFn;
        if (isStr || isArgs) {
            for (var i = 0; i < object.length; ++i) {
                theKeys.push(String(i));
            }
        } else {
            for (var name in object) {
                if (!(skipProto && name === 'prototype') && owns(object, name)) {
                    theKeys.push(String(name));
                }
            }
        }

        if (hasDontEnumBug) {
            var ctor = object.constructor,
                skipConstructor = ctor && ctor.prototype === object;
            for (var j = 0; j < dontEnumsLength; j++) {
                var dontEnum = dontEnums[j];
                if (!(skipConstructor && dontEnum === 'constructor') && owns(object, dontEnum)) {
                    theKeys.push(dontEnum);
                }
            }
        }
        return theKeys;
    }
});

var keysWorksWithArguments = Object.keys && (function () {
    // Safari 5.0 bug
    return Object.keys(arguments).length === 2;
}(1, 2));
var originalKeys = Object.keys;
defineProperties(Object, {
    keys: function keys(object) {
        if (isArguments(object)) {
            return originalKeys(ArrayPrototype.slice.call(object));
        } else {
            return originalKeys(object);
        }
    }
}, !keysWorksWithArguments);

//
// Date
// ====
//

// ES5 15.9.5.43
// http://es5.github.com/#x15.9.5.43
// This function returns a String value represent the instance in time
// represented by this Date object. The format of the String is the Date Time
// string format defined in 15.9.1.15. All fields are present in the String.
// The time zone is always UTC, denoted by the suffix Z. If the time value of
// this object is not a finite Number a RangeError exception is thrown.
var negativeDate = -62198755200000;
var negativeYearString = "-000001";
var hasNegativeDateBug = Date.prototype.toISOString && new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1;

defineProperties(Date.prototype, {
    toISOString: function toISOString() {
        var result, length, value, year, month;
        if (!isFinite(this)) {
            throw new RangeError("Date.prototype.toISOString called on non-finite value.");
        }

        year = this.getUTCFullYear();

        month = this.getUTCMonth();
        // see https://github.com/es-shims/es5-shim/issues/111
        year += Math.floor(month / 12);
        month = (month % 12 + 12) % 12;

        // the date time string format is specified in 15.9.1.15.
        result = [month + 1, this.getUTCDate(), this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];
        year = (
            (year < 0 ? "-" : (year > 9999 ? "+" : "")) +
            ("00000" + Math.abs(year)).slice(0 <= year && year <= 9999 ? -4 : -6)
        );

        length = result.length;
        while (length--) {
            value = result[length];
            // pad months, days, hours, minutes, and seconds to have two
            // digits.
            if (value < 10) {
                result[length] = "0" + value;
            }
        }
        // pad milliseconds to have three digits.
        return (
            year + "-" + result.slice(0, 2).join("-") +
            "T" + result.slice(2).join(":") + "." +
            ("000" + this.getUTCMilliseconds()).slice(-3) + "Z"
        );
    }
}, hasNegativeDateBug);


// ES5 15.9.5.44
// http://es5.github.com/#x15.9.5.44
// This function provides a String representation of a Date object for use by
// JSON.stringify (15.12.3).
var dateToJSONIsSupported = false;
try {
    dateToJSONIsSupported = (
        Date.prototype.toJSON &&
        new Date(NaN).toJSON() === null &&
        new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1 &&
        Date.prototype.toJSON.call({ // generic
            toISOString: function () {
                return true;
            }
        })
    );
} catch (e) {
}
if (!dateToJSONIsSupported) {
    Date.prototype.toJSON = function toJSON(key) {
        // When the toJSON method is called with argument key, the following
        // steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be toPrimitive(O, hint Number).
        var o = Object(this),
            tv = toPrimitive(o),
            toISO;
        // 3. If tv is a Number and is not finite, return null.
        if (typeof tv === "number" && !isFinite(tv)) {
            return null;
        }
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        toISO = o.toISOString;
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (typeof toISO !== "function") {
            throw new TypeError("toISOString property is not callable");
        }
        // 6. Return the result of calling the [[Call]] internal method of
        //  toISO with O as the this value and an empty argument list.
        return toISO.call(o);

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// ES5 15.9.4.2
// http://es5.github.com/#x15.9.4.2
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
var supportsExtendedYears = Date.parse('+033658-09-27T01:46:40.000Z') === 1e15;
var acceptsInvalidDates = !isNaN(Date.parse('2012-04-04T24:00:00.500Z')) || !isNaN(Date.parse('2012-11-31T23:59:59.000Z'));
var doesNotParseY2KNewYear = isNaN(Date.parse("2000-01-01T00:00:00.000Z"));
if (!Date.parse || doesNotParseY2KNewYear || acceptsInvalidDates || !supportsExtendedYears) {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    Date = (function (NativeDate) {

        // Date.length === 7
        function Date(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            if (this instanceof NativeDate) {
                var date = length === 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(Date.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
                // Prevent mixups with unfixed Date object
                date.constructor = Date;
                return date;
            }
            return NativeDate.apply(this, arguments);
        }

        // 15.9.1.15 Date Time String Format.
        var isoDateExpression = new RegExp("^" +
            "(\\d{4}|[\+\-]\\d{6})" + // four-digit year capture or sign +
                                      // 6-digit extended year
            "(?:-(\\d{2})" + // optional month capture
            "(?:-(\\d{2})" + // optional day capture
            "(?:" + // capture hours:minutes:seconds.milliseconds
                "T(\\d{2})" + // hours capture
                ":(\\d{2})" + // minutes capture
                "(?:" + // optional :seconds.milliseconds
                    ":(\\d{2})" + // seconds capture
                    "(?:(\\.\\d{1,}))?" + // milliseconds capture
                ")?" +
            "(" + // capture UTC offset component
                "Z|" + // UTC capture
                "(?:" + // offset specifier +/-hours:minutes
                    "([-+])" + // sign capture
                    "(\\d{2})" + // hours offset capture
                    ":(\\d{2})" + // minutes offset capture
                ")" +
            ")?)?)?)?" +
        "$");

        var months = [
            0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365
        ];

        function dayFromMonth(year, month) {
            var t = month > 1 ? 1 : 0;
            return (
                months[month] +
                Math.floor((year - 1969 + t) / 4) -
                Math.floor((year - 1901 + t) / 100) +
                Math.floor((year - 1601 + t) / 400) +
                365 * (year - 1970)
            );
        }

        function toUTC(t) {
            return Number(new NativeDate(1970, 0, 1, 0, 0, 0, t));
        }

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate) {
            Date[key] = NativeDate[key];
        }

        // Copy "native" methods explicitly; they may be non-enumerable
        Date.now = NativeDate.now;
        Date.UTC = NativeDate.UTC;
        Date.prototype = NativeDate.prototype;
        Date.prototype.constructor = Date;

        // Upgrade Date.parse to handle simplified ISO 8601 strings
        Date.parse = function parse(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                // parse months, days, hours, minutes, seconds, and milliseconds
                // provide default values if necessary
                // parse the UTC offset component
                var year = Number(match[1]),
                    month = Number(match[2] || 1) - 1,
                    day = Number(match[3] || 1) - 1,
                    hour = Number(match[4] || 0),
                    minute = Number(match[5] || 0),
                    second = Number(match[6] || 0),
                    millisecond = Math.floor(Number(match[7] || 0) * 1000),
                    // When time zone is missed, local offset should be used
                    // (ES 5.1 bug)
                    // see https://bugs.ecmascript.org/show_bug.cgi?id=112
                    isLocalTime = Boolean(match[4] && !match[8]),
                    signOffset = match[9] === "-" ? 1 : -1,
                    hourOffset = Number(match[10] || 0),
                    minuteOffset = Number(match[11] || 0),
                    result;
                if (
                    hour < (
                        minute > 0 || second > 0 || millisecond > 0 ?
                        24 : 25
                    ) &&
                    minute < 60 && second < 60 && millisecond < 1000 &&
                    month > -1 && month < 12 && hourOffset < 24 &&
                    minuteOffset < 60 && // detect invalid offsets
                    day > -1 &&
                    day < (
                        dayFromMonth(year, month + 1) -
                        dayFromMonth(year, month)
                    )
                ) {
                    result = (
                        (dayFromMonth(year, month) + day) * 24 +
                        hour +
                        hourOffset * signOffset
                    ) * 60;
                    result = (
                        (result + minute + minuteOffset * signOffset) * 60 +
                        second
                    ) * 1000 + millisecond;
                    if (isLocalTime) {
                        result = toUTC(result);
                    }
                    if (-8.64e15 <= result && result <= 8.64e15) {
                        return result;
                    }
                }
                return NaN;
            }
            return NativeDate.parse.apply(this, arguments);
        };

        return Date;
    })(Date);
}

// ES5 15.9.4.4
// http://es5.github.com/#x15.9.4.4
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}


//
// Number
// ======
//

// ES5.1 15.7.4.5
// http://es5.github.com/#x15.7.4.5
var hasToFixedBugs = NumberPrototype.toFixed && (
  (0.00008).toFixed(3) !== '0.000'
  || (0.9).toFixed(0) !== '1'
  || (1.255).toFixed(2) !== '1.25'
  || (1000000000000000128).toFixed(0) !== "1000000000000000128"
);

var toFixedHelpers = {
  base: 1e7,
  size: 6,
  data: [0, 0, 0, 0, 0, 0],
  multiply: function multiply(n, c) {
      var i = -1;
      while (++i < toFixedHelpers.size) {
          c += n * toFixedHelpers.data[i];
          toFixedHelpers.data[i] = c % toFixedHelpers.base;
          c = Math.floor(c / toFixedHelpers.base);
      }
  },
  divide: function divide(n) {
      var i = toFixedHelpers.size, c = 0;
      while (--i >= 0) {
          c += toFixedHelpers.data[i];
          toFixedHelpers.data[i] = Math.floor(c / n);
          c = (c % n) * toFixedHelpers.base;
      }
  },
  numToString: function numToString() {
      var i = toFixedHelpers.size;
      var s = '';
      while (--i >= 0) {
          if (s !== '' || i === 0 || toFixedHelpers.data[i] !== 0) {
              var t = String(toFixedHelpers.data[i]);
              if (s === '') {
                  s = t;
              } else {
                  s += '0000000'.slice(0, 7 - t.length) + t;
              }
          }
      }
      return s;
  },
  pow: function pow(x, n, acc) {
      return (n === 0 ? acc : (n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc)));
  },
  log: function log(x) {
      var n = 0;
      while (x >= 4096) {
          n += 12;
          x /= 4096;
      }
      while (x >= 2) {
          n += 1;
          x /= 2;
      }
      return n;
  }
};

defineProperties(NumberPrototype, {
    toFixed: function toFixed(fractionDigits) {
        var f, x, s, m, e, z, j, k;

        // Test for NaN and round fractionDigits down
        f = Number(fractionDigits);
        f = f !== f ? 0 : Math.floor(f);

        if (f < 0 || f > 20) {
            throw new RangeError("Number.toFixed called with invalid number of decimals");
        }

        x = Number(this);

        // Test for NaN
        if (x !== x) {
            return "NaN";
        }

        // If it is too big or small, return the string value of the number
        if (x <= -1e21 || x >= 1e21) {
            return String(x);
        }

        s = "";

        if (x < 0) {
            s = "-";
            x = -x;
        }

        m = "0";

        if (x > 1e-21) {
            // 1e-21 < x < 1e21
            // -70 < log2(x) < 70
            e = toFixedHelpers.log(x * toFixedHelpers.pow(2, 69, 1)) - 69;
            z = (e < 0 ? x * toFixedHelpers.pow(2, -e, 1) : x / toFixedHelpers.pow(2, e, 1));
            z *= 0x10000000000000; // Math.pow(2, 52);
            e = 52 - e;

            // -18 < e < 122
            // x = z / 2 ^ e
            if (e > 0) {
                toFixedHelpers.multiply(0, z);
                j = f;

                while (j >= 7) {
                    toFixedHelpers.multiply(1e7, 0);
                    j -= 7;
                }

                toFixedHelpers.multiply(toFixedHelpers.pow(10, j, 1), 0);
                j = e - 1;

                while (j >= 23) {
                    toFixedHelpers.divide(1 << 23);
                    j -= 23;
                }

                toFixedHelpers.divide(1 << j);
                toFixedHelpers.multiply(1, 1);
                toFixedHelpers.divide(2);
                m = toFixedHelpers.numToString();
            } else {
                toFixedHelpers.multiply(0, z);
                toFixedHelpers.multiply(1 << (-e), 0);
                m = toFixedHelpers.numToString() + '0.00000000000000000000'.slice(2, 2 + f);
            }
        }

        if (f > 0) {
            k = m.length;

            if (k <= f) {
                m = s + '0.0000000000000000000'.slice(0, f - k + 2) + m;
            } else {
                m = s + m.slice(0, k - f) + '.' + m.slice(k - f);
            }
        } else {
            m = s + m;
        }

        return m;
    }
}, hasToFixedBugs);


//
// String
// ======
//

// ES5 15.5.4.14
// http://es5.github.com/#x15.5.4.14

// [bugfix, IE lt 9, firefox 4, Konqueror, Opera, obscure browsers]
// Many browsers do not split properly with regular expressions or they
// do not perform the split correctly under obscure conditions.
// See http://blog.stevenlevithan.com/archives/cross-browser-split
// I've tested in many browsers and this seems to cover the deviant ones:
//    'ab'.split(/(?:ab)*/) should be ["", ""], not [""]
//    '.'.split(/(.?)(.?)/) should be ["", ".", "", ""], not ["", ""]
//    'tesst'.split(/(s)*/) should be ["t", undefined, "e", "s", "t"], not
//       [undefined, "t", undefined, "e", ...]
//    ''.split(/.?/) should be [], not [""]
//    '.'.split(/()()/) should be ["."], not ["", "", "."]

var string_split = StringPrototype.split;
if (
    'ab'.split(/(?:ab)*/).length !== 2 ||
    '.'.split(/(.?)(.?)/).length !== 4 ||
    'tesst'.split(/(s)*/)[1] === "t" ||
    'test'.split(/(?:)/, -1).length !== 4 ||
    ''.split(/.?/).length ||
    '.'.split(/()()/).length > 1
) {
    (function () {
        var compliantExecNpcg = /()??/.exec("")[1] === void 0; // NPCG: nonparticipating capturing group

        StringPrototype.split = function (separator, limit) {
            var string = this;
            if (separator === void 0 && limit === 0) {
                return [];
            }

            // If `separator` is not a regex, use native split
            if (_toString.call(separator) !== "[object RegExp]") {
                return string_split.call(this, separator, limit);
            }

            var output = [],
                flags = (separator.ignoreCase ? "i" : "") +
                        (separator.multiline  ? "m" : "") +
                        (separator.extended   ? "x" : "") + // Proposed for ES6
                        (separator.sticky     ? "y" : ""), // Firefox 3+
                lastLastIndex = 0,
                // Make `global` and avoid `lastIndex` issues by working with a copy
                separator2, match, lastIndex, lastLength;
            separator = new RegExp(separator.source, flags + "g");
            string += ""; // Type-convert
            if (!compliantExecNpcg) {
                // Doesn't need flags gy, but they don't hurt
                separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
            }
            /* Values for `limit`, per the spec:
             * If undefined: 4294967295 // Math.pow(2, 32) - 1
             * If 0, Infinity, or NaN: 0
             * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
             * If negative number: 4294967296 - Math.floor(Math.abs(limit))
             * If other: Type-convert, then use the above rules
             */
            limit = limit === void 0 ?
                -1 >>> 0 : // Math.pow(2, 32) - 1
                ToUint32(limit);
            while (match = separator.exec(string)) {
                // `separator.lastIndex` is not reliable cross-browser
                lastIndex = match.index + match[0].length;
                if (lastIndex > lastLastIndex) {
                    output.push(string.slice(lastLastIndex, match.index));
                    // Fix browsers whose `exec` methods don't consistently return `undefined` for
                    // nonparticipating capturing groups
                    if (!compliantExecNpcg && match.length > 1) {
                        match[0].replace(separator2, function () {
                            for (var i = 1; i < arguments.length - 2; i++) {
                                if (arguments[i] === void 0) {
                                    match[i] = void 0;
                                }
                            }
                        });
                    }
                    if (match.length > 1 && match.index < string.length) {
                        ArrayPrototype.push.apply(output, match.slice(1));
                    }
                    lastLength = match[0].length;
                    lastLastIndex = lastIndex;
                    if (output.length >= limit) {
                        break;
                    }
                }
                if (separator.lastIndex === match.index) {
                    separator.lastIndex++; // Avoid an infinite loop
                }
            }
            if (lastLastIndex === string.length) {
                if (lastLength || !separator.test("")) {
                    output.push("");
                }
            } else {
                output.push(string.slice(lastLastIndex));
            }
            return output.length > limit ? output.slice(0, limit) : output;
        };
    }());

// [bugfix, chrome]
// If separator is undefined, then the result array contains just one String,
// which is the this value (converted to a String). If limit is not undefined,
// then the output array is truncated so that it contains no more than limit
// elements.
// "0".split(undefined, 0) -> []
} else if ("0".split(void 0, 0).length) {
    StringPrototype.split = function split(separator, limit) {
        if (separator === void 0 && limit === 0) { return []; }
        return string_split.call(this, separator, limit);
    };
}

var str_replace = StringPrototype.replace;
var replaceReportsGroupsCorrectly = (function () {
    var groups = [];
    'x'.replace(/x(.)?/g, function (match, group) {
        groups.push(group);
    });
    return groups.length === 1 && typeof groups[0] === 'undefined';
}());

if (!replaceReportsGroupsCorrectly) {
    StringPrototype.replace = function replace(searchValue, replaceValue) {
        var isFn = isFunction(replaceValue);
        var hasCapturingGroups = isRegex(searchValue) && (/\)[*?]/).test(searchValue.source);
        if (!isFn || !hasCapturingGroups) {
            return str_replace.call(this, searchValue, replaceValue);
        } else {
            var wrappedReplaceValue = function (match) {
                var length = arguments.length;
                var originalLastIndex = searchValue.lastIndex;
                searchValue.lastIndex = 0;
                var args = searchValue.exec(match);
                searchValue.lastIndex = originalLastIndex;
                args.push(arguments[length - 2], arguments[length - 1]);
                return replaceValue.apply(this, args);
            };
            return str_replace.call(this, searchValue, wrappedReplaceValue);
        }
    };
}

// ECMA-262, 3rd B.2.3
// Not an ECMAScript standard, although ECMAScript 3rd Edition has a
// non-normative section suggesting uniform semantics and it should be
// normalized across all browsers
// [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE
var string_substr = StringPrototype.substr;
var hasNegativeSubstrBug = "".substr && "0b".substr(-1) !== "b";
defineProperties(StringPrototype, {
    substr: function substr(start, length) {
        return string_substr.call(
            this,
            start < 0 ? ((start = this.length + start) < 0 ? 0 : start) : start,
            length
        );
    }
}, hasNegativeSubstrBug);

// ES5 15.5.4.20
// whitespace from: http://es5.github.io/#x15.5.4.20
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
var zeroWidth = '\u200b';
var wsRegexChars = "[" + ws + "]";
var trimBeginRegexp = new RegExp("^" + wsRegexChars + wsRegexChars + "*");
var trimEndRegexp = new RegExp(wsRegexChars + wsRegexChars + "*$");
var hasTrimWhitespaceBug = StringPrototype.trim && (ws.trim() || !zeroWidth.trim());
defineProperties(StringPrototype, {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    // http://perfectionkills.com/whitespace-deviations/
    trim: function trim() {
        if (this === void 0 || this === null) {
            throw new TypeError("can't convert " + this + " to object");
        }
        return String(this).replace(trimBeginRegexp, "").replace(trimEndRegexp, "");
    }
}, hasTrimWhitespaceBug);

// ES-5 15.1.2.2
if (parseInt(ws + '08') !== 8 || parseInt(ws + '0x16') !== 22) {
    parseInt = (function (origParseInt) {
        var hexRegex = /^0[xX]/;
        return function parseIntES5(str, radix) {
            str = String(str).trim();
            if (!Number(radix)) {
                radix = hexRegex.test(str) ? 16 : 10;
            }
            return origParseInt(str, radix);
        };
    }(parseInt));
}

}));

/** @namespace */
var ozpIwc=ozpIwc || {};

/**
 * @type {object}
 * @property {function} log - Normal log output.
 * @property {function} error - Error output.
 */
ozpIwc.log=ozpIwc.log || {
	log: function() {
		if(window.console && typeof(window.console.log)==="function") {
			window.console.log.apply(window.console,arguments);
		}
	},
	error: function() {
		if(window.console && typeof(window.console.error)==="function") {
			window.console.error.apply(window.console,arguments);
		}
	}
};

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
/*
 * The MIT License (MIT) Copyright (c) 2012 Mike Ihbe
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial 
 * portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO 
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * Original code owned by Mike Ihbe.  Modifications licensed under same terms.
 */
var ozpIwc=ozpIwc || {};
ozpIwc.metricsStats=ozpIwc.metricsStats || {};

ozpIwc.metricsStats.DEFAULT_POOL_SIZE=1028;

ozpIwc.metricsStats.Sample = function(){
	this.clear();
};

ozpIwc.metricsStats.Sample.prototype.update = function(val){ 
	this.values.push(val); 
};

ozpIwc.metricsStats.Sample.prototype.clear = function(){ 
	this.values = []; 
	this.count = 0; 
};
ozpIwc.metricsStats.Sample.prototype.size = function(){ 
	return this.values.length;
};

ozpIwc.metricsStats.Sample.prototype.getValues = function(){ 
	return this.values; 
};


/**
 *  Take a uniform sample of size size for all values
 *  @class
 *  @param {Number} [size=ozpIwc.metricsStats.DEFAULT_POOL_SIZE] - The size of the sample pool.
 */
ozpIwc.metricsStats.UniformSample=ozpIwc.util.extend(ozpIwc.metricsStats.Sample,function(size) {
	ozpIwc.metricsStats.Sample.apply(this);
  this.limit = size || ozpIwc.metricsStats.DEFAULT_POOL_SIZE;
});

ozpIwc.metricsStats.UniformSample.prototype.update = function(val) {
  this.count++;
  if (this.size() < this.limit) {
    this.values.push(val);
  } else {
    var rand = parseInt(Math.random() * this.count);
    if (rand < this.limit) {
      this.values[rand] = val;
    }
  }
};

// From http://eloquentjavascript.net/appendix2.html, 
// licensed under CCv3.0: http://creativecommons.org/licenses/by/3.0/

var ozpIwc=ozpIwc || {};
ozpIwc.metricsStats=ozpIwc.metricsStats || {};
/**
 * This acts as a ordered binary heap for any serializeable JS object or collection of such objects 
 * <p>Borrowed from https://github.com/mikejihbe/metrics. Originally from from http://eloquentjavascript.net/appendix2.html
 * <p>Licenced under CCv3.0
 * @class
 * @param {type} scoreFunction
 * @returns {BinaryHeap}
 */
ozpIwc.metricsStats.BinaryHeap = function BinaryHeap(scoreFunction){
  this.content = [];
  this.scoreFunction = scoreFunction;
};

ozpIwc.metricsStats.BinaryHeap.prototype = {

  clone: function() {
    var heap = new ozpIwc.metricsStats.BinaryHeap(this.scoreFunction);
    // A little hacky, but effective.
    heap.content = JSON.parse(JSON.stringify(this.content));
    return heap;
  },

  push: function(element) {
    // Add the new element to the end of the array.
    this.content.push(element);
    // Allow it to bubble up.
    this.bubbleUp(this.content.length - 1);
  },

  peek: function() {
    return this.content[0];
  },

  pop: function() {
    // Store the first element so we can return it later.
    var result = this.content[0];
    // Get the element at the end of the array.
    var end = this.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it sink down.
    if (this.content.length > 0) {
      this.content[0] = end;
      this.sinkDown(0);
    }
    return result;
  },

  remove: function(node) {
    var len = this.content.length;
    // To remove a value, we must search through the array to find
    // it.
    for (var i = 0; i < len; i++) {
      if (this.content[i] == node) {
        // When it is found, the process seen in 'pop' is repeated
        // to fill up the hole.
        var end = this.content.pop();
        if (i != len - 1) {
          this.content[i] = end;
          if (this.scoreFunction(end) < this.scoreFunction(node))
            this.bubbleUp(i);
          else
            this.sinkDown(i);
        }
        return true;
      }
    }
    throw new Error("Node not found.");
  },

  size: function() {
    return this.content.length;
  },

  bubbleUp: function(n) {
    // Fetch the element that has to be moved.
    var element = this.content[n];
    // When at 0, an element can not go up any further.
    while (n > 0) {
      // Compute the parent element's index, and fetch it.
      var parentN = Math.floor((n + 1) / 2) - 1,
          parent = this.content[parentN];
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        // Update 'n' to continue at the new position.
        n = parentN;
      }
      // Found a parent that is less, no need to move it further.
      else {
        break;
      }
    }
  },

  sinkDown: function(n) {
    // Look up the target element and its score.
    var length = this.content.length,
        element = this.content[n],
        elemScore = this.scoreFunction(element);

    while(true) {
      // Compute the indices of the child elements.
      var child2N = (n + 1) * 2, child1N = child2N - 1;
      // This is used to store the new position of the element,
      // if any.
      var swap = null;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        var child1 = this.content[child1N],
            child1Score = this.scoreFunction(child1);
        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore)
          swap = child1N;
      }
      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.content[child2N],
            child2Score = this.scoreFunction(child2);
        if (child2Score < (swap == null ? elemScore : child1Score))
          swap = child2N;
      }

      // If the element needs to be moved, swap it, and continue.
      if (swap != null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      }
      // Otherwise, we are done.
      else {
        break;
      }
    }
  }
};


/*
 * The MIT License (MIT) Copyright (c) 2012 Mike Ihbe
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial 
 * portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO 
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * Original code owned by Mike Ihbe.  Modifications licensed under same terms.
 */
var ozpIwc=ozpIwc || {};
ozpIwc.metricsStats=ozpIwc.metricsStats || {};

//  Take an exponentially decaying sample of size size of all values
ozpIwc.metricsStats.DEFAULT_RESCALE_THRESHOLD = 60 * 60 * 1000; // 1 hour in milliseconds
ozpIwc.metricsStats.DEFAULT_DECAY_ALPHA=0.015;
/**
 * This acts as a ordered binary heap for any serializeable JS object or collection of such objects 
 * <p>Borrowed from https://github.com/mikejihbe/metrics. 
 * @class 
	*/
ozpIwc.metricsStats.ExponentiallyDecayingSample=ozpIwc.util.extend(ozpIwc.metricsStats.Sample,function(size, alpha) {
	ozpIwc.metricsStats.Sample.apply(this);
  this.limit = size || ozpIwc.metricsStats.DEFAULT_POOL_SIZE;
  this.alpha = alpha || ozpIwc.metricsStats.DEFAULT_DECAY_ALPHA;
	this.rescaleThreshold = ozpIwc.metricsStats.DEFAULT_RESCALE_THRESHOLD;
});

// This is a relatively expensive operation
ozpIwc.metricsStats.ExponentiallyDecayingSample.prototype.getValues = function() {
  var values = [];
  var heap = this.values.clone();
	var elt;
  while(elt = heap.pop()) {
    values.push(elt.val);
  }
  return values;
};

ozpIwc.metricsStats.ExponentiallyDecayingSample.prototype.size = function() {
  return this.values.size();
};

ozpIwc.metricsStats.ExponentiallyDecayingSample.prototype.newHeap = function() {
  return new ozpIwc.metricsStats.BinaryHeap(function(obj){return obj.priority;});
};

ozpIwc.metricsStats.ExponentiallyDecayingSample.prototype.now = function() {
  return ozpIwc.util.now();
};

ozpIwc.metricsStats.ExponentiallyDecayingSample.prototype.tick = function() {
  return this.now() / 1000;
};

ozpIwc.metricsStats.ExponentiallyDecayingSample.prototype.clear = function() {
  this.values = this.newHeap();
  this.count = 0;
  this.startTime = this.tick();
  this.nextScaleTime = this.now() + this.rescaleThreshold;
};

/*
* timestamp in milliseconds
*/
ozpIwc.metricsStats.ExponentiallyDecayingSample.prototype.update = function(val, timestamp) {
  // Convert timestamp to seconds
  if (timestamp == undefined) {
    timestamp = this.tick();
  } else {
    timestamp = timestamp / 1000;
  }
  var priority = this.weight(timestamp - this.startTime) / Math.random()
    , value = {val: val, priority: priority};
  if (this.count < this.limit) {
    this.count += 1;
    this.values.push(value);
  } else {
    var first = this.values.peek();
    if (first.priority < priority) {
      this.values.push(value);
      this.values.pop();
    }
  }

  if (this.now() > this.nextScaleTime) {
    this.rescale();
  }
};

ozpIwc.metricsStats.ExponentiallyDecayingSample.prototype.weight = function(time) {
  return Math.exp(this.alpha * time);
};

ozpIwc.metricsStats.ExponentiallyDecayingSample.prototype.rescale = function() {
  this.nextScaleTime = this.now() + this.rescaleThreshold;
  var oldContent = this.values.content
    , newContent = []
    , elt
    , oldStartTime = this.startTime;
  this.startTime = this.tick();
  // Downscale every priority by the same factor. Order is unaffected, which is why we're avoiding the cost of popping.
  for(var i = 0; i < oldContent.length; i++) {
    newContent.push({val: oldContent[i].val, priority: oldContent[i].priority * Math.exp(-this.alpha * (this.startTime - oldStartTime))});
  }
  this.values.content = newContent;
};

/*
 * The MIT License (MIT) Copyright (c) 2012 Mike Ihbe
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial 
 * portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO 
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * Original code owned by Mike Ihbe.  Modifications licensed under same terms.
 */
var ozpIwc=ozpIwc || {};
ozpIwc.metricsStats=ozpIwc.metricsStats || {};

/*
 *  Exponentially weighted moving average.
 *  Args: 
 *  - alpha:
 *  - interval: time in milliseconds
 */

ozpIwc.metricsStats.M1_ALPHA = 1 - Math.exp(-5/60);
ozpIwc.metricsStats.M5_ALPHA = 1 - Math.exp(-5/60/5);
ozpIwc.metricsStats.M15_ALPHA = 1 - Math.exp(-5/60/15);

ozpIwc.metricsStats.ExponentiallyWeightedMovingAverage=function(alpha, interval) {
  this.alpha = alpha;
  this.interval = interval || 5000;
  this.currentRate = null;
  this.uncounted = 0;
	this.lastTick=ozpIwc.util.now();
};

ozpIwc.metricsStats.ExponentiallyWeightedMovingAverage.prototype.update = function(n) {
  this.uncounted += (n || 1);
	this.tick();
};

/*
 * Update our rate measurements every interval
 */
ozpIwc.metricsStats.ExponentiallyWeightedMovingAverage.prototype.tick = function() {
 	var now=ozpIwc.util.now();
	var age=now-this.lastTick;
	if(age > this.interval) {
		this.lastTick=now - (age % this.interval);
		var requiredTicks=Math.floor(age / this.interval);
		for(var i=0; i < requiredTicks; ++i) {
			var instantRate = this.uncounted / this.interval;
			this.uncounted = 0;
			if(this.currentRate!==null) {
				this.currentRate += this.alpha * (instantRate - this.currentRate);
			} else {
				this.currentRate = instantRate;
			}
		}
	}
};

/*
 * Return the rate per second
 */
ozpIwc.metricsStats.ExponentiallyWeightedMovingAverage.prototype.rate = function() {
  return this.currentRate * 1000;
};

var ozpIwc=ozpIwc || {};
ozpIwc.metricTypes=ozpIwc.metricTypes || {};

/**
 * @typedef {object} ozpIwc.MetricType 
 * @property {function} get - returns the current value of the metric
 */

ozpIwc.metricTypes.BaseMetric=function() {
	this.value=0;
    this.name="";
    this.unitName="";
};

ozpIwc.metricTypes.BaseMetric.prototype.get=function() { 
	return this.value; 
};

ozpIwc.metricTypes.BaseMetric.prototype.unit=function(val) { 
	if(val) {
		this.unitName=val;
		return this;
	}
	return this.unitName; 
};




/**
 * @class
 * @extends ozpIwc.MetricType
 * A counter running total that can be adjusted up or down.
 * Where a meter is set to a known value at each update, a
 * counter is incremented up or down by a known change.
 */
ozpIwc.metricTypes.Counter=ozpIwc.util.extend(ozpIwc.metricTypes.BaseMetric,function() {
	ozpIwc.metricTypes.BaseMetric.apply(this,arguments);
	this.value=0;
});

/**
 * @param {Number} [delta=1] - Increment by this value
 * @returns {Number} - Value of the counter after increment
 */
ozpIwc.metricTypes.Counter.prototype.inc=function(delta) { 
	return this.value+=(delta?delta:1);
};

/**
 * @param {Number} [delta=1] - Decrement by this value
 * @returns {Number} - Value of the counter after decrement
 */
ozpIwc.metricTypes.Counter.prototype.dec=function(delta) { 
	return this.value-=(delta?delta:1);
};

ozpIwc.metricTypes=ozpIwc.metricTypes || {};
/**
 * @callback ozpIwc.metricTypes.Gauge~gaugeCallback
 * @returns {ozpIwc.metricTypes.MetricsTree} 
 */

/**
 * @class
 * @extends ozpIwc.MetricType
 * A gauge is an externally defined set of metrics returned by a callback function
 * @param {ozpIwc.metricTypes.Gauge~gaugeCallback} metricsCallback
 */
ozpIwc.metricTypes.Gauge=ozpIwc.util.extend(ozpIwc.metricTypes.BaseMetric,function(metricsCallback) {
	ozpIwc.metricTypes.BaseMetric.apply(this,arguments);
	this.callback=metricsCallback;
});
/**
 * Set the metrics callback for this gauge.
 * @param {ozpIwc.metricTypes.Gauge~gaugeCallback} metricsCallback
 * @returns {ozpIwc.metricTypes.Gauge} this
 */
ozpIwc.metricTypes.Gauge.prototype.set=function(metricsCallback) { 
	this.callback=metricsCallback;
	return this;
};
/**
 * Executes the callback and returns a metrics tree.
 * @returns {ozpIwc.metricTypes.MetricsTree}
 */
ozpIwc.metricTypes.Gauge.prototype.get=function() {
    if (this.callback) {
        return this.callback();
    }
    return undefined;
};

/**
 * @class
 * @extends ozpIwc.BaseMetric
 */
ozpIwc.metricTypes.Histogram=ozpIwc.util.extend(ozpIwc.metricTypes.BaseMetric,function() {
	ozpIwc.metricTypes.BaseMetric.apply(this,arguments);
	this.sample = new ozpIwc.metricsStats.ExponentiallyDecayingSample();
	this.clear();
});


ozpIwc.metricTypes.Histogram.prototype.clear=function() {
	this.sample.clear();
	this.min=this.max=null;
	this.varianceMean=0;
	this.varianceM2=0;
	this.sum=0;
	this.count=0;	
};

/**
 * @param {Number} [delta=1] - Increment by this value
 * @returns {Number} - Value of the counter after increment
 */
ozpIwc.metricTypes.Histogram.prototype.mark=function(val,timestamp) { 
	timestamp = timestamp || ozpIwc.util.now();
	
	this.sample.update(val,timestamp);
	
	this.max=(this.max===null?val:Math.max(this.max,val));
	this.min=(this.min===null?val:Math.min(this.min,val));
	this.sum+=val;
	this.count++;
	
	var delta=val - this.varianceMean;
	this.varianceMean += delta/this.count;
	this.varianceM2 += delta * (val - this.varianceMean);

	return this.count;
};

ozpIwc.metricTypes.Histogram.prototype.get=function() { 
	var values=this.sample.getValues().map(function(v){
		return parseFloat(v);
	}).sort(function(a,b) { 
		return a-b;
	});
	var percentile=function(p) {
		var pos=p *(values.length);
		if(pos >= values.length) {
			return values[values.length-1];
		}
		pos=Math.max(0,pos);
		pos=Math.min(pos,values.length+1);
		var lower = values[Math.floor(pos)-1];
		var upper = values[Math.floor(pos)];
		return lower+(pos-Math.floor(pos))*(upper-lower);
	};

	return {
		'percentile_10': percentile(0.10),
		'percentile_25': percentile(0.25),				
		'median': percentile(0.50),				
		'percentile_75': percentile(0.75),				
		'percentile_90': percentile(0.90),				
		'percentile_95': percentile(0.95),				
		'percentile_99': percentile(0.99),				
		'percentile_999': percentile(0.999),				
		'variance' : this.count < 1 ? null : this.varianceM2 / (this.count -1),
		'mean' : this.count === 0 ? null : this.varianceMean,
		'stdDev' : this.count < 1 ? null : Math.sqrt(this.varianceM2 / (this.count -1)),
		'count' : this.count,
		'sum' : this.sum,
		'max' : this.max,
		'min' : this.min
	};
};


/**
 * @class
 * @extends ozpIwc.BaseMetric
 */
ozpIwc.metricTypes.Meter=ozpIwc.util.extend(ozpIwc.metricTypes.BaseMetric,function() {
	ozpIwc.metricTypes.BaseMetric.apply(this,arguments);
	this.m1Rate= new ozpIwc.metricsStats.ExponentiallyWeightedMovingAverage(ozpIwc.metricsStats.M1_ALPHA);
	this.m5Rate= new ozpIwc.metricsStats.ExponentiallyWeightedMovingAverage(ozpIwc.metricsStats.M5_ALPHA);
	this.m15Rate= new ozpIwc.metricsStats.ExponentiallyWeightedMovingAverage(ozpIwc.metricsStats.M15_ALPHA);
	this.startTime=ozpIwc.util.now();
	this.value=0;
});

/**
 * @param {Number} [delta=1] - Increment by this value
 * @returns {Number} - Value of the counter after increment
 */
ozpIwc.metricTypes.Meter.prototype.mark=function(delta) { 
	delta=delta || 1;
	this.value+=delta;
	this.m1Rate.update(delta);
	this.m5Rate.update(delta);
	this.m15Rate.update(delta);
	
	return this.value;
};

ozpIwc.metricTypes.Meter.prototype.get=function() { 
	return {
		'rate_1m' : this.m1Rate.rate(),
		'rate_5m' : this.m5Rate.rate(),
		'rate_15m' : this.m15Rate.rate(),
		'rate_mean' : this.value / (ozpIwc.util.now() - this.startTime) * 1000,
		'count' : this.value
	};
};

ozpIwc.metricTypes.Meter.prototype.tick=function() { 
	this.m1Rate.tick();
	this.m5Rate.tick();
	this.m15Rate.tick();
};

ozpIwc.metricTypes.Timer=ozpIwc.util.extend(ozpIwc.metricTypes.BaseMetric,function() {
	ozpIwc.metricTypes.BaseMetric.apply(this,arguments);
	this.meter=new ozpIwc.metricTypes.Meter();
	this.histogram=new ozpIwc.metricTypes.Histogram();
});

ozpIwc.metricTypes.Timer.prototype.mark=function(val,time) {
	this.meter.mark();
	this.histogram.mark(val,time);
};

ozpIwc.metricTypes.Timer.prototype.start=function() {
	var self=this;
	var startTime=ozpIwc.util.now();
	return function() {
		var endTime=ozpIwc.util.now();
		self.mark(endTime-startTime,endTime);
	};
};

ozpIwc.metricTypes.Timer.prototype.time=function(callback) {
	var startTime=ozpIwc.util.now();
	try {
		callback();
	} finally {
		var endTime=ozpIwc.util.now();
		this.mark(endTime-startTime,endTime);
	}
};

ozpIwc.metricTypes.Timer.prototype.get=function() {
	var val=this.histogram.get();
	var meterMetrics=this.meter.get();
	for(var k in meterMetrics) {
		val[k]=meterMetrics[k];
	}
	return val;
};
var ozpIwc=ozpIwc || {};

/**
 * @class
 * A repository of metrics
 */
ozpIwc.MetricsRegistry=function() {
	this.metrics={};
    var self=this;
    this.gauge('registry.metrics.types').set(function() {
        return Object.keys(self.metrics).length;
    });

};

/**
 * 
 * @private
 * @param {string} name - Name of the metric
 * @param {function} type - The constructor of the requested type for this metric.
 * @returns {MetricType} - Null if the metric already exists of a different type.  Otherwise a reference to the metric.
 */
ozpIwc.MetricsRegistry.prototype.findOrCreateMetric=function(name,type) {
	var m= this.metrics[name];
    if(!m) {
        m = this.metrics[name] = new type();
        m.name=name;
        return m;
    }
	if(m instanceof type){
			return m;
	} else {
			return null;
	}			
};

/**
 * Joins the arguments together into a name.
 * @private
 * @param {string[]} args - Array or the argument-like "arguments" value.
 * @returns {string}
 */
ozpIwc.MetricsRegistry.prototype.makeName=function(args) {
	// slice is necessary because "arguments" isn't a real array, and it's what
	// is usually passed in, here.
	return Array.prototype.slice.call(args).join(".");
};

/**
 * @param {...string} name - components of the name
 * @returns {ozpIwc.metricTypes.Counter}
 */
ozpIwc.MetricsRegistry.prototype.counter=function(name) {
	return this.findOrCreateMetric(this.makeName(arguments),ozpIwc.metricTypes.Counter);
};

/**
 * @param {...string} name - components of the name
 * @returns {ozpIwc.metricTypes.Meter}
 */
ozpIwc.MetricsRegistry.prototype.meter=function(name) {
	return this.findOrCreateMetric(this.makeName(arguments),ozpIwc.metricTypes.Meter);
};

/**
 * @param {...string} name - components of the name
 * @returns {ozpIwc.metricTypes.Gauge}
 */
ozpIwc.MetricsRegistry.prototype.gauge=function(name) {
	return this.findOrCreateMetric(this.makeName(arguments),ozpIwc.metricTypes.Gauge);
};

/**
 * @param {...string} name - components of the name
 * @returns {ozpIwc.metricTypes.Gauge}
 */
ozpIwc.MetricsRegistry.prototype.histogram=function(name) {
	return this.findOrCreateMetric(this.makeName(arguments),ozpIwc.metricTypes.Histogram);
};

/**
 * @param {...string} name - components of the name
 * @returns {ozpIwc.metricTypes.Gauge}
 */
ozpIwc.MetricsRegistry.prototype.timer=function(name) {
	return this.findOrCreateMetric(this.makeName(arguments),ozpIwc.metricTypes.Timer);
};

/**
 * @param {...string} name - components of the name
 * @returns {ozpIwc.metricTypes.Gauge}
 */
ozpIwc.MetricsRegistry.prototype.register=function(name,metric) {
	this.metrics[this.makeName(name)]=metric;
	
	return metric;
};

/**
 * 
 * @returns {unresolved}
 */
ozpIwc.MetricsRegistry.prototype.toJson=function() {
	var rv={};
	for(var k in this.metrics) {
		var path=k.split(".");
		var pos=rv;
		while(path.length > 1) {
			var current=path.shift();
			pos = pos[current]=pos[current] || {};
		}
		pos[path[0]]=this.metrics[k].get();
	}
	return rv;
};

ozpIwc.MetricsRegistry.prototype.allMetrics=function() {
    var rv=[];
    for(var k in this.metrics) {
        rv.push(this.metrics[k]);
    }
    return rv;
};

ozpIwc.metrics=new ozpIwc.MetricsRegistry();

(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var setImmediate;

    function addFromSetImmediateArguments(args) {
        tasksByHandle[nextHandle] = partiallyApplied.apply(undefined, args);
        return nextHandle++;
    }

    // This function accepts the same arguments as setImmediate, but
    // returns a function that requires no arguments.
    function partiallyApplied(handler) {
        var args = [].slice.call(arguments, 1);
        return function() {
            if (typeof handler === "function") {
                handler.apply(undefined, args);
            } else {
                (new Function("" + handler))();
            }
        };
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(partiallyApplied(runIfPresent, handle), 0);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    task();
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function installNextTickImplementation() {
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            process.nextTick(partiallyApplied(runIfPresent, handle));
            return handle;
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            global.postMessage(messagePrefix + handle, "*");
            return handle;
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            channel.port2.postMessage(handle);
            return handle;
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
            return handle;
        };
    }

    function installSetTimeoutImplementation() {
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            setTimeout(partiallyApplied(runIfPresent, handle), 0);
            return handle;
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(new Function("return this")()));


ozpIwc.abacPolicies={};


ozpIwc.abacPolicies.permitWhenObjectHasNoAttributes=function(request) {
    if(request.object && Object.keys(request.object).length===0) {
        return "permit";
    }
    return "undetermined";
};

ozpIwc.abacPolicies.subjectHasAllObjectAttributes=function(request) {
    // if no object permissions, then it's trivially true
    if(!request.object) {
        return "permit";
    }
    var subject = request.subject || {};
    if(ozpIwc.util.objectContainsAll(subject,request.object,this.implies)) {
        return "permit";
    }
    return "deny";
};

ozpIwc.abacPolicies.permitAll=function() {
    return "permit";
};


var ozpIwc=ozpIwc || {};

/** @typedef {string} ozpIwc.security.Role */

/** @typedef {string} ozpIwc.security.Permission */

/** @typedef { ozpIwc.security.Role[] } ozpIwc.security.Subject */

/** 
 * @typedef {object} ozpIwc.security.Actor 
 * @property {ozpIwc.security.Subject} securityAttributes
 */


/** 
 * @class
 */
ozpIwc.BasicAuthentication=function() {
	this.roles={};
    var self = this;
    ozpIwc.metrics.gauge('security.authentication.roles').set(function() {
        return self.getRoleCount();
    });
};

/**
 * Returns the number of roles currently defined
 * @returns {number} the number of roles defined
 */
ozpIwc.BasicAuthentication.prototype.getRoleCount=function() {
    if (!this.roles || !Object.keys(this.roles)) {
        return 0;
    }
    return Object.keys(this.roles).length;
};

/**
 * Returns the authenticated subject for the given credentials.
 * 
 * <p>The preAuthenticatedSubject allows an existing subject to augment their
 * roles using credentials.  For example, PostMessageParticipants are
 * assigned a role equal to their origin, since the browser authoritatively
 * determines that.  The security module can then add additional roles based
 * upon configuration.
 * 
 * @param {ozpIwc.security.Credentials} credentials
 * @param {ozpIwc.security.Subject} [preAuthenticatedSubject] - The pre-authenticated
 *   subject that is presenting these credentials.   
 * @returns {ozpIwc.AsyncAction} If the credentials are authenticated, the success handler receives
 *     the subject.
 */
ozpIwc.BasicAuthentication.prototype.login=function(credentials,preAuthenticatedSubject) {
	if(!credentials) {
		throw "Must supply credentials for login";
	}
	var action=new ozpIwc.AsyncAction();
	
	preAuthenticatedSubject=preAuthenticatedSubject || [];
	return action.resolve("success",preAuthenticatedSubject);
};


var ozpIwc=ozpIwc || {};

/** @typedef {string} ozpIwc.security.Role */

/** @typedef {string} ozpIwc.security.Permission */

/** @typedef { ozpIwc.security.Role[] } ozpIwc.security.Subject */

/** 
 * @typedef {object} ozpIwc.security.Actor 
 * @property {ozpIwc.security.Subject} securityAttributes
 */


/** 
 * A simple Attribute-Based Access Control implementation
 * @todo Permissions are local to each peer.  Does this need to be synced?
 * 
 * @class
 */
ozpIwc.BasicAuthorization=function(config) {
    config=config || {};
	this.roles={};
    this.policies= config.policies || [
//        ozpIwc.abacPolicies.permitAll
        ozpIwc.abacPolicies.permitWhenObjectHasNoAttributes,
        ozpIwc.abacPolicies.subjectHasAllObjectAttributes
    ];

    var self = this;
    ozpIwc.metrics.gauge('security.authorization.roles').set(function() {
        return self.getRoleCount();
    });
};
/**
 * Returns the number of roles currently defined
 * @returns {number} the number of roles defined
 */
ozpIwc.BasicAuthorization.prototype.getRoleCount=function() {
    if (!this.roles || !Object.keys(this.roles)) {
        return 0;
    }
    return Object.keys(this.roles).length;
};


ozpIwc.BasicAuthorization.prototype.implies=function(subjectVal,objectVal) {
    // no object value is trivially true
    if(objectVal===undefined || objectVal === null) {
        return true;
    }
    // no subject value when there is an object value is trivially false
    if(subjectVal===undefined || subjectVal === null) {
        return false;
    }
    
    // convert both to arrays, if necessary
    subjectVal=Array.isArray(subjectVal)?subjectVal:[subjectVal];
    objectVal=Array.isArray(objectVal)?objectVal:[objectVal];

    // confirm that every element in objectVal is also in subjectVal
    return ozpIwc.util.arrayContainsAll(subjectVal,objectVal);
};


/**
 * Confirms that the subject has all of the permissions requested.
 * @param {object} request
 * @returns {ozpIwc.AsyncAction}
 */
ozpIwc.BasicAuthorization.prototype.isPermitted=function(request) {
	var action=new ozpIwc.AsyncAction();
	
    var result=this.policies.some(function(policy) {
        return policy.call(this,request)==="permit";
    },this);
    
    
    if(result) {
        return action.resolve("success");
    } else {
		return action.resolve('failure');
    }
};


ozpIwc.authorization=new ozpIwc.BasicAuthorization();
/** @namespace **/
var ozpIwc = ozpIwc || {};

/**
 * <p>This link connects peers using the HTML5 localstorage API.  It is a second generation version of
 * the localStorageLink that bypasses most of the garbage collection issues.
 *
 * <p> When a packet is sent, this link turns it to a string, creates a key with that value, and
 * immediately deletes it.  This still sends the storage event containing the packet as the key.
 * This completely eliminates the need to garbage collect the localstorage space, with the associated
 * mutex contention and full-buffer issues.
 *
 * @todo Compress the key
 *
 * @class
 * @param {Object} [config] - Configuration for this link
 * @param {ozpIwc.Peer} [config.peer=ozpIwc.defaultPeer] - The peer to connect to.
 * @param {string} [config.prefix='ozpIwc'] - Namespace for communicating, must be the same for all peers on the same network.
 * @param {string} [config.selfId] - Unique name within the peer network.  Defaults to the peer id.
 * @param {Number} [config.maxRetries] - Number of times packet transmission will retry if failed. Defaults to 6.
 * @param {Number} [config.queueSize] - Number of packets allowed to be queued at one time. Defaults to 1024.
 * @param {Number} [config.fragmentSize] - Size in bytes of which any TransportPacket exceeds will be sent in FragmentPackets.
 * @param {Number} [config.fragmentTime] - Time in milliseconds after a fragment is received and additional expected
 *                                         fragments are not received that the message is dropped.
 */
ozpIwc.KeyBroadcastLocalStorageLink = function (config) {
    config = config || {};

    this.prefix = config.prefix || 'ozpIwc';
    this.peer = config.peer || ozpIwc.defaultPeer;
    this.selfId = config.selfId || this.peer.selfId;
    this.myKeysTimeout = config.myKeysTimeout || 5000; // 5 seconds
    this.otherKeysTimeout = config.otherKeysTimeout || 2 * 60000; // 2 minutes
    this.maxRetries = config.maxRetries || 6;
    this.queueSize = config.queueSize || 1024;
    this.sendQueue = this.sendQueue || [];
    this.fragmentSize = config.fragmentSize || (5 * 1024 * 1024) / 2 / 2; //50% of 5mb, divide by 2 for utf-16 characters
    this.fragmentTimeout = config.fragmentTimeout || 1000; // 1 second

    //Add fragmenting capabilities
    String.prototype.chunk = function (size) {
        var res = [];
        for (var i = 0; i < this.length; i += size) {
            res.push(this.slice(i, i + size));
        }
        return res;
    };

    // Hook into the system
    var self = this;
    var packet;
    var receiveStorageEvent = function (event) {
        try {
            packet = JSON.parse(event.key);
        } catch (e) {
            console.log("Parse error on " + event.key);
            ozpIwc.metrics.counter('links.keyBroadcastLocalStorage.packets.parseError').inc();
            return;
        }
        if (packet.data.fragment) {
            self.handleFragment(packet);
        } else {
            self.peer.receive(self.linkId, packet);
            ozpIwc.metrics.counter('links.keyBroadcastLocalStorage.packets.received').inc();
        }
    };
    window.addEventListener('storage', receiveStorageEvent, false);

    this.peer.on("send", function (event) {
        self.send(event.packet);
    });

    this.peer.on("beforeShutdown", function () {
        window.removeEventListener('storage', receiveStorageEvent);
    }, this);

};

/**
 * @typedef ozpIwc.FragmentPacket
 * @property {boolean} fragment - Flag for knowing this is a fragment packet. Should be true.
 * @property {Number} msgId - The msgId from the TransportPacket broken up into fragments.
 * @property {Number} id - The position amongst other fragments of the TransportPacket.
 * @property {Number} total - Total number of fragments of the TransportPacket expected.
 * @property {String} chunk - A segment of the TransportPacket in string form.
 *
 */

/**
 * @typedef ozpIwc.FragmentStore
 * @property {Number} sequence - The sequence of the latest fragment received.
 * @property {Number} total - The total number of fragments expected.
 * @property {String} src_peer - The src_peer of the fragments expected.
 * @property {Array(String)} chunks - String segments of the TransportPacket.
 */

/**
 * Handles fragmented packets received from the router. When all fragments of a message have been received,
 * the resulting packet will be passed on to the registered peer of the KeyBroadcastLocalStorageLink.
 * @param {ozpIwc.NetworkPacket} packet - NetworkPacket containing an ozpIwc.FragmentPacket as its data property
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.handleFragment = function (packet) {
    // Check to make sure the packet is a fragment and we haven't seen it
    if (this.peer.haveSeen(packet)) {
        return;
    }

    var key = packet.data.msgId;

    this.storeFragment(packet);

    var defragmentedPacket = this.defragmentPacket(this.fragments[key]);

    if (defragmentedPacket) {

        // clear the fragment timeout
        window.clearTimeout(this.fragments[key].fragmentTimer);

        // Remove the last sequence from the known packets to reuse it for the defragmented packet
        var packetIndex = this.peer.packetsSeen[defragmentedPacket.src_peer].indexOf(defragmentedPacket.sequence);
        delete this.peer.packetsSeen[defragmentedPacket.src_peer][packetIndex];

        this.peer.receive(this.linkId, defragmentedPacket);
        ozpIwc.metrics.counter('links.keyBroadcastLocalStorage.packets.received').inc();

        delete this.fragments[key];
    }
};

/**
 *  Stores a received fragment. When the first fragment of a message is received, a timer is set to destroy the storage
 *  of the message fragments should not all messages be received.
 * @param {ozpIwc.NetworkPacket} packet - NetworkPacket containing an ozpIwc.FragmentPacket as its data property
 * @returns {boolean} result - true if successful.
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.storeFragment = function (packet) {
    if (!packet.data.fragment) {
        return null;
    }

    this.fragments = this.fragments || [];
    // NetworkPacket properties
    var sequence = packet.sequence;
    var src_peer = packet.src_peer;
    // FragmentPacket Properties
    var key = packet.data.msgId;
    var id = packet.data.id;
    var chunk = packet.data.chunk;
    var total = packet.data.total;

    if (key === undefined || id === undefined) {
        return null;
    }

    // If this is the first fragment of a message, add the storage object
    if (!this.fragments[key]) {
        this.fragments[key] = {};
        this.fragments[key].chunks = [];

        var self = this;
        self.key = key;
        self.total = total ;

        // Add a timeout to destroy the fragment should the whole message not be received.
        this.fragments[key].timeoutFunc = function () {
            ozpIwc.metrics.counter('network.packets.dropped').inc();
            ozpIwc.metrics.counter('network.fragments.dropped').inc(self.total );
            delete self.fragments[self.key];
        };
    }

    // Restart the fragment drop countdown
    window.clearTimeout(this.fragments[key].fragmentTimer);
    this.fragments[key].fragmentTimer = window.setTimeout(this.fragments[key].timeoutFunc, this.fragmentTimeout);

    // keep a copy of properties needed for defragmenting, the last sequence & src_peer received will be
    // reused in the defragmented packet
    this.fragments[key].total = total || this.fragments[key].total ;
    this.fragments[key].sequence = (sequence !== undefined) ? sequence : this.fragments[key].sequence;
    this.fragments[key].src_peer = src_peer || this.fragments[key].src_peer;
    this.fragments[key].chunks[id] = chunk;

    // If the necessary properties for defragmenting aren't set the storage fails
    if (this.fragments[key].total === undefined || this.fragments[key].sequence === undefined ||
        this.fragments[key].src_peer === undefined) {
        return null;
    } else {
        ozpIwc.metrics.counter('links.keyBroadcastLocalStorage.fragments.received').inc();
        return true;
    }
};

/**
 * Rebuilds the original packet sent across the keyBroadcastLocalStorageLink from the fragments it was broken up into.
 * @param {ozpIwc.FragmentStore} fragments - the grouping of fragments to reconstruct
 * @returns {ozpIwc.NetworkPacket} result - the reconstructed NetworkPacket with TransportPacket as its data property.
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.defragmentPacket = function (fragments) {
    if (fragments.total != fragments.chunks.length) {
        return null;
    }
    try {
        var result = JSON.parse(fragments.chunks.join(''));
        return {
            defragmented: true,
            sequence: fragments.sequence,
            src_peer: fragments.src_peer,
            data: result
        };
    } catch (e) {
        return null;
    }
};

/**
 * <p>Publishes a packet to other peers.
 * <p>If the sendQueue is full (KeyBroadcastLocalStorageLink.queueSize) send will not occur.
 * <p>If the TransportPacket is too large (KeyBroadcastLocalStorageLink.fragmentSize) ozpIwc.FragmentPacket's will
 *    be sent instead.
 *
 * @class
 * @param {ozpIwc.NetworkPacket} - packet
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.send = function (packet) {
    var str = JSON.stringify(packet.data);

    if (str.length < this.fragmentSize) {
        this.queueSend(packet);
    } else {
        var fragments = str.chunk(this.fragmentSize);

        // Use the original packet as a template, delete the data and
        // generate new packets.
        var self = this;
        self.data= packet.data;
        delete packet.data;

        var fragmentGen = function (chunk, template) {

            template.sequence = self.peer.sequenceCounter++;
            template.data = {
                fragment: true,
                msgId: self.data.msgId,
                id: i,
                total: fragments.length,
                chunk: chunk
            };
            return template;
        };

        // Generate & queue the fragments
        for (var i = 0; i < fragments.length; i++) {
            this.queueSend(fragmentGen(fragments[i], packet));
        }
    }
};

ozpIwc.KeyBroadcastLocalStorageLink.prototype.queueSend = function (packet) {
    if (this.sendQueue.length < this.queueSize) {
        this.sendQueue = this.sendQueue.concat(packet);
        while (this.sendQueue.length > 0) {
            this.attemptSend(this.sendQueue.shift());
        }
    } else {
        ozpIwc.metrics.counter('links.keyBroadcastLocalStorage.packets.failed').inc();
        ozpIwc.log.error("Failed to write packet(len=" + packet.length + "):" + " Send queue full.");
    }
};

/**
 * <p> Recursively tries sending the packet (KeyBroadcastLocalStorageLink.maxRetries) times
 * The packet is dropped and the send fails after reaching max attempts.
 *
 * @class
 * @param {ozpIwc.NetworkPacket} - packet
 * @param {Number} [attemptCount] - number of times attempted to send packet.
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.attemptSend = function (packet, retryCount) {

    var sendStatus = this.sendImpl(packet);
    if (sendStatus) {
        var self = this;
        retryCount = retryCount || 0;
        var timeOut = Math.max(1, Math.pow(2, (retryCount - 1))) - 1;

        if (retryCount < self.maxRetries) {
            retryCount++;
            // Call again but back off for an exponential amount of time.
            window.setTimeout(function () {
                self.attemptSend(packet, retryCount);
            }, timeOut);
        } else {
            ozpIwc.metrics.counter('links.keyBroadcastLocalStorage.packets.failed').inc();
            ozpIwc.log.error("Failed to write packet(len=" + packet.length + "):" + sendStatus);
            return sendStatus;
        }
    }
};

/**
 * <p>Implementation of publishing packets to peers through localStorage.
 * <p>If the localStorage is full or a write collision occurs, the send will not occur.
 * <p>Returns status of localStorage write, null if success.
 *
 * @todo move counter.inc() out of the impl and handle in attemptSend?
 *
 * @class
 * @param {ozpIwc.NetworkPacket} - packet
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.sendImpl = function (packet) {
    var sendStatus;
    try {
        var p = JSON.stringify(packet);
        localStorage.setItem(p, "");
        ozpIwc.metrics.counter('links.keyBroadcastLocalStorage.packets.sent').inc();
        localStorage.removeItem(p);
        sendStatus = null;
    }
    catch (e) {
        sendStatus = e;
    }
    finally {
        return sendStatus;
    }
};

/** @namespace **/
var ozpIwc = ozpIwc || {};

/**
 * <p>This link connects peers using the HTML5 localstorage API.  It handles cleaning up
 * the buffer, depduplication of sends, and other trivia.
 * 
 * <p>Individual local storage operations are atomic, but there are no consistency
 * gaurantees between multiple calls.  This means a read, modify, write operation may
 * create race conditions.  The LocalStorageLink addresses the concurrency problem without
 * locks by only allowing creation, read, and delete operations.
 * 
 * <p>Each packet is written to it's own key/value pair in local storage.  The key is the
 * of the form "${prefix}|${selfId}|${timestamp}".  Each LocalStorageLink owns the lifecycle
 * of packets it creates.
 * 
 * For senders:
 * <ol>
 *   <li> Write a new packet.
 *   <li> Wait config.myKeysTimeout milliseconds.
 *   <li> Delete own packets where the timestamp is expired.
 * </ol>
 * 
 * For receivers:
 * <ol>
 *   <li> Receive a "storage" event containing the new key.
 *   <li> Reads the packets from local storage.
 * </ol>
 * 
 * <p>The potential race condition is if the packet is deleted before the receiver
 * can read it.  In this case, the packet is simply considered lost, but no inconsistent
 * data will be read.
 * 
 * <p>Links are responsible for their own packets, but each will clean up other link's packets
 * on a much larger expiration window (config.otherKeysTimeout).  Race conditions between
 * multiple links interleaving the lockless "list keys" and "delete item" sequence generates
 * a consistent postcondition-- the key will not exist.
 * 
 * @class
 * @param {Object} [config] - Configuration for this link
 * @param {ozpIwc.Peer} [config.peer=ozpIwc.defaultPeer] - The peer to connect to.
 * @param {Number} [config.myKeysTimeout=5000] - Milliseconds to wait before deleting this link's keys.
 * @param {Number} [config.otherKeysTimeout=120000] - Milliseconds to wait before cleaning up other link's keys
 * @param {string} [config.prefix='ozpIwc'] - Namespace for communicating, must be the same for all peers on the same network.
 * @param {string} [config.selfId] - Unique name within the peer network.  Defaults to the peer id.
 */
ozpIwc.LocalStorageLink = function(config) {
	config=config || {};

	this.prefix=config.prefix || 'ozpIwc';
	this.peer=config.peer || ozpIwc.defaultPeer;
	this.selfId=config.selfId || this.peer.selfId;
	this.myKeysTimeout = config.myKeysTimeout || 5000; // 5 seconds
	this.otherKeysTimeout = config.otherKeysTimeout || 2*60000; // 2 minutes

  // Hook into the system
	var self=this;
	
	var receiveStorageEvent=function(event) {
		var key=self.splitKey(event.key);
		if(key) {
			var packet=JSON.parse(localStorage.getItem(event.key));

			if(!packet) {
				ozpIwc.metrics.counter('links.localStorage.packets.vanished').inc();
			} else if(typeof(packet) !== "object") {
				ozpIwc.metrics.counter('links.localStorage.packets.notAnObject').inc();
			} else {
				ozpIwc.metrics.counter('links.localStorage.packets.receive').inc();
				self.peer.receive(self.linkId,packet);
			} 
		};
	};
	window.addEventListener('storage',receiveStorageEvent , false); 
	
	this.peer.on("send",function(event) { 
		self.send(event.packet); 
	});
	
	this.peer.on("beforeShutdown",function() {
		self.cleanKeys();
		window.removeEventListener('storage',receiveStorageEvent);
	},this);
	
	window.setInterval(function() {
		self.cleanKeys();
	},250); 


	// METRICS
	ozpIwc.metrics.gauge('links.localStorage.buffer').set(function() {
		var	stats= {
					used: 0,
					max: 5 *1024 * 1024,
					bufferLen: 0,
					peerUsage: {},
					peerPackets: {}
					
		};
		for(var i=0; i < localStorage.length;++i) {
			var k=localStorage.key(i);
			var v=localStorage.getItem(k);
			
			var size=v.length*2;
			var oldKeyTime = ozpIwc.util.now() - this.myKeysTimeout;

			stats.used+=size;
			
			var key=self.splitKey(k);
			if(key) {
				stats.peerUsage[key.id] = stats.peerUsage[key.id]?(stats.peerUsage[key.id]+size):size;
				stats.peerPackets[key.id] = stats.peerPackets[key.id]?(stats.peerPackets[key.id]+1):1;
				stats.bufferLen++;
				if(key.createdAt < oldKeyTime) {
					stats.oldKeysCount++;
					stats.oldKeysSize+=size;
				}
			}
		}
			
		return stats;
	});
};

/**
 * Creates a key for the message in localStorage
 * @todo Is timestamp granular enough that no two packets can come in at the same time?
 * @returns {string} a new key
 */
ozpIwc.LocalStorageLink.prototype.makeKey=function(sequence) { 
	return [this.prefix,this.selfId,ozpIwc.util.now(),sequence].join('|');
};

/**
 * If it's a key for a buffered message, split it into the id of the 
 * link that put it here and the time it was created at.
 * @param {type} k The key to split
 * @returns {object} The id and createdAt for the key if it's valid, otherwise null.
 */
ozpIwc.LocalStorageLink.prototype.splitKey=function(k) { 
	var parts=k.split("|");
	if(parts.length===4 && parts[0]===this.prefix) {
		return { id: parts[1], createdAt: parseInt(parts[2]) };
	}	
	return null;
};

/**
 * Goes through localStorage and looks for expired packets.  Packets owned
 * by this link are removed if they are older than myKeysTimeout.  Other
 * keys are cleaned if they are older than otherKeysTimeout.
 * @todo Coordinate expiration windows.
 * @returns {undefined}
 */
ozpIwc.LocalStorageLink.prototype.cleanKeys=function() {
	var now=ozpIwc.util.now();
	var myKeyExpiration = now - this.myKeysTimeout;
	var otherKeyExpiration = now - this.otherKeysTimeout;

	for(var i=0; i < localStorage.length;++i) {
		var keyName=localStorage.key(i);
		var k=this.splitKey(keyName);
		if(k) {
			if((k.id===this.selfId && k.createdAt <= myKeyExpiration) 
					|| (k.createdAt <= otherKeyExpiration)) {
				localStorage.removeItem(keyName);
			}				
		}
	};


};
/**
 * Publishes a packet to other peers.
 * @todo Handle local storage being full.
 * @param {ozpIwc.NetworkPacket} packet
 */
ozpIwc.LocalStorageLink.prototype.send=function(packet) { 
	localStorage.setItem(this.makeKey(packet.sequence),JSON.stringify(packet));
	ozpIwc.metrics.counter('links.localStorage.packets.sent').inc();
	var self=this;

};


var ozpIwc=ozpIwc || {};

/**
 * @typedef ozpIwc.NetworkPacket
 * @property {string} src_peer - The id of the peer who broadcast this packet.
 * @property {string} sequence - A monotonically increasing, unique identifier for this packet.
 * @property {object} data - The payload of this packet.
 */

/**
 * @event ozpIwc.Peer#receive
 * The peer has received a packet from other peers.
 * @property {ozpIwc.NetworkPacket} packet
 * @property {string} linkId
 */


/**
 * @event ozpIwc.Peer#preSend
 * A cancelable event that allows listeners to override the forwarding of
 * a given packet to other peers.
 * @extends ozpIwc.CancelableEvent
 * @property {ozpIwc.NetworkPacket} packet
 */

/**
 * @event ozpIwc.Peer#send
 * Notifies that a packet is being sent to other peers.  Links should use this
 * event to forward packets to other peers.
 * @property {ozpIwc.NetworkPacket} packet
 */

/**
 * @event ozpIwc.Peer#beforeShutdown
 * Fires when the peer is being explicitly or implicitly shut down.
 */

/**
 * The peer handles low-level broadcast communications between multiple browser contexts.
 * Links do the actual work of moving the packet to other browser contexts.  The links
 * call @{link ozpIwc.Peer#receive} when they need to deliver a packet to this peer and hook
 * the @{link event:ozpIwc.Peer#send} event in order to send packets.
 * @class
 */
ozpIwc.Peer=function() {

    // generate a random 4 byte id
    this.selfId=ozpIwc.util.generateId();

    // unique ids for all packets sent by this peer
    this.sequenceCounter=0;

    // track which packets are seen from each peer
    // key is the name of the peer
    // value is an array that contains the last 50 ids seen
    this.packetsSeen={};

    this.knownPeers={};

    this.events=new ozpIwc.Event();
    this.events.mixinOnOff(this);

    var self=this;

    // Shutdown handling
    this.unloadListener=function() {
        self.shutdown();
    };
    window.addEventListener('beforeunload',this.unloadListener);

};

ozpIwc.Peer.maxSeqIdPerSource=500;

/**
 * Helper to determine if we've seen this packet before
 * @param {ozpIwc.NetworkPacket} packet
 * @returns {boolean}
 */
ozpIwc.Peer.prototype.haveSeen=function(packet) {
    // don't forward our own packets
    if (packet.src_peer === this.selfId) {
        ozpIwc.metrics.counter('network.packets.droppedOwnPacket').inc();
        return true;
    }
    var seen = this.packetsSeen[packet.src_peer];
    if (!seen) {
        seen = this.packetsSeen[packet.src_peer] = [];
    }

    // abort if we've seen the packet before
    if (seen.indexOf(packet.sequence) >= 0) {
        return true;
    }

    //remove oldest array members when truncate needed
    seen.unshift(packet.sequence);
    if (seen.length >= ozpIwc.Peer.maxSeqIdPerSource) {
        seen.length = ozpIwc.Peer.maxSeqIdPerSource;
    }
    return false;
};

/**
 * Used by routers to broadcast a packet to network
 * @fires ozpIwc.Peer#preSend
 * @fires ozpIwc.Peer#send
 * @param {ozpIwc.NetworkPacket} packet
 */
ozpIwc.Peer.prototype.send= function(packet) {
    var networkPacket={
        src_peer: this.selfId,
        sequence: this.sequenceCounter++,
        data: packet
    };

    var preSendEvent=new ozpIwc.CancelableEvent({'packet': networkPacket});

    this.events.trigger("preSend",preSendEvent);
    if(!preSendEvent.canceled) {
        ozpIwc.metrics.counter('network.packets.sent').inc();
        this.events.trigger("send",{'packet':networkPacket});
    } else {
        ozpIwc.metrics.counter('network.packets.sendRejected').inc();
    }
};

/**
 * Called by the links when a new packet is recieved.
 * @fires ozpIwc.Peer#receive
 * @param {string} linkId
 * @param {ozpIwc.NetworkPacket} packet
 * @returns {unresolved}
 */
ozpIwc.Peer.prototype.receive=function(linkId,packet) {
    // drop it if we've seen it before
    if(this.haveSeen(packet)) {
        ozpIwc.metrics.counter('network.packets.dropped').inc();
        return;
    }
    ozpIwc.metrics.counter('network.packets.received').inc();
    this.events.trigger("receive",{'packet':packet,'linkId': linkId});
};

/**
 * Explicitly shuts down the peer.
 * @fires ozpIwc.Peer#send
 */
ozpIwc.Peer.prototype.shutdown=function() {
    this.events.trigger("beforeShutdown");
    window.removeEventListener('beforeunload',this.unloadListener);
};

			
var ozpIwc=ozpIwc || {};

/**
 * @class
 * @mixes ozpIwc.security.Actor
 * @property {string} address - The assigned address to this address.
 * @property {ozpIwc.security.Subject} securityAttributes - The security attributes for this participant.
 */
ozpIwc.Participant=function() {
    this.events=new ozpIwc.Event();
	this.events.mixinOnOff(this);
	this.securityAttributes={};
    this.msgId=0;
    var fakeMeter=new ozpIwc.metricTypes.Meter();
    this.sentPacketsMeter=fakeMeter;
    this.receivedPacketsMeter=fakeMeter;
    this.forbiddenPacketsMeter=fakeMeter;
    
    this.participantType=this.constructor.name;
    this.heartBeatContentType="application/ozpIwc-address-v1+json";
    this.heartBeatStatus={
        name: this.name,
        type: this.participantType || this.constructor.name
    };
};

/**
 * @param {ozpIwc.PacketContext} packetContext
 * @returns {boolean} true if this packet could have additional recipients
 */
ozpIwc.Participant.prototype.receiveFromRouter=function(packetContext) {
    var self = this;
    ozpIwc.authorization.isPermitted({
        'subject': this.securityAttributes,
        'object': packetContext.packet.permissions
    })
        .success(function(){
            self.receivedPacketsMeter.mark();

            self.receiveFromRouterImpl(packetContext);
        })
        .failure(function() {
            /** @todo do we send a "denied" message to the destination?  drop?  who knows? */
            self.forbiddenPacketsMeter.mark();
        });
};

/**
 * Overridden by inherited Participants.
 * @override
 * @param packetContext
 * @returns {boolean}
 */
ozpIwc.Participant.prototype.receiveFromRouterImpl = function (packetContext) {
    // doesn't really do anything other than return a bool and prevent "unused param" warnings
    return !packetContext;
};
/**
 * @param {ozpIwc.Router} router
 * @param {string} address
 * @returns {boolean} true if this packet could have additional recipients
 */
ozpIwc.Participant.prototype.connectToRouter=function(router,address) {
    this.address=address;
    this.router=router;
    this.securityAttributes.rawAddress=address;
    this.msgId=0;
    this.metricRoot="participants."+ this.address.split(".").reverse().join(".");
    this.sentPacketsMeter=ozpIwc.metrics.meter(this.metricRoot,"sentPackets").unit("packets");
    this.receivedPacketsMeter=ozpIwc.metrics.meter(this.metricRoot,"receivedPackets").unit("packets");
    this.forbiddenPacketsMeter=ozpIwc.metrics.meter(this.metricRoot,"forbiddenPackets").unit("packets");
    
    this.namesResource="/address/"+this.address;
    this.heartBeatStatus.address=this.address;
    this.heartBeatStatus.name=this.name;
    this.heartBeatStatus.type=this.participantType || this.constructor.name;

    this.events.trigger("connectedToRouter");
};

/**
 * Populates fields relevant to this packet if they aren't already set:
 * src, ver, msgId, and time.
 * @param {ozpIwc.TransportPacket} packet
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.Participant.prototype.fixPacket=function(packet) {
    // clean up the packet a bit on behalf of the sender
    packet.src=packet.src || this.address;
    packet.ver = packet.ver || 1;

    // if the packet doesn't have a msgId, generate one
    packet.msgId = packet.msgId || this.generateMsgId();

    // might as well be helpful and set the time, too
    packet.time = packet.time || ozpIwc.util.now();
    return packet;
};

/**
 * Sends a packet to this participants router.  Calls fixPacket
 * before doing so.
 * @param {ozpIwc.TransportPacket} packet
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.Participant.prototype.send=function(packet) {
    packet=this.fixPacket(packet);
    this.sentPacketsMeter.mark();
    this.router.send(packet,this);
    return packet;
};


ozpIwc.Participant.prototype.generateMsgId=function() {
    return "i:" + this.msgId++;
};

ozpIwc.Participant.prototype.heartbeat=function() {
    if(this.router) {
        this.send({
            'dst': "names.api",
            'resource': this.namesResource,
            'action' : "set",
            'entity' : this.heartBeatStatus,
            'contentType' : this.heartBeatContentType
        },function() {/* eat the response*/});
    }
};

ozpIwc.InternalParticipant=ozpIwc.util.extend(ozpIwc.Participant,function(config) {
    config=config || {};
	ozpIwc.Participant.apply(this,arguments);
	this.replyCallbacks={};
	this.participantType="internal";
	this.name=config.name;

    var self = this;
    this.on("connectedToRouter",function() {
        ozpIwc.metrics.gauge(self.metricRoot,"registeredCallbacks").set(function() {
            return self.getCallbackCount();
        });
    });
});

/**
 * Gets the count of the registered reply callbacks
 * @returns {number} the number of registered callbacks
 */
ozpIwc.InternalParticipant.prototype.getCallbackCount=function() {
    if (!this.replyCallbacks | !Object.keys(this.replyCallbacks)) {
        return 0;
    }
    return Object.keys(this.replyCallbacks).length;
};

/**
 * @param {ozpIwc.PacketContext} packetContext
 * @returns {boolean} true if this packet could have additional recipients
 */
ozpIwc.InternalParticipant.prototype.receiveFromRouterImpl=function(packetContext) {
	var packet=packetContext.packet;
	if(packet.replyTo && this.replyCallbacks[packet.replyTo]) {
		if (!this.replyCallbacks[packet.replyTo](packet)) {
            this.cancelCallback(packet.replyTo);
        }
	} else {
		this.events.trigger("receive",packetContext);
	}
};


ozpIwc.InternalParticipant.prototype.send=function(originalPacket,callback) {
    var packet=this.fixPacket(originalPacket);
	if(callback) {
		this.replyCallbacks[packet.msgId]=callback;
	}
    var self=this;
	ozpIwc.util.setImmediate(function() {
        ozpIwc.Participant.prototype.send.call(self,packet);
    });

	return packet;
};

ozpIwc.InternalParticipant.prototype.cancelCallback=function(msgId) {
    var success=false;
    if (msgId) {
        delete this.replyCallbacks[msgId];
        success=true;
    }
    return success;
};

var ozpIwc=ozpIwc || {};

/**
 * @typedef ozpIwc.TransportPacket
 * @property {string} src - The participant address that sent this packet
 * @property {string} dst - The intended recipient of this packet
 * @property {Number} ver - Protocol Version.  Should be 1
 * @property {Number} msgId - A unique id for this packet.
 * @property {object} entity - The payload of this packet.
 * @property {object} [permissions] - Permissions required to see the payload of this packet.
 * @property {Number} [time] - The time in milliseconds since epoch that this packet was created.
 * @property {Number} [replyTo] - Reference to the msgId that this is in reply to.
 * @property {string} [action] - Action to be performed.
 * @property {string} [resource] - Resource to perform the action upon.
 * @property {boolean} [test] - Marker for test packets.
 */

/**
 * @class
 * @param {object} config
 * @param {ozpIwc.TransportPacket} config.packet
 * @param {ozpIwc.Router} config.router
 * @param {ozpIwc.Participant} [config.srcParticpant]
 * @param {ozpIwc.Participant} [config.dstParticpant]
 * @property {ozpIwc.TransportPacket} packet
 * @property {ozpIwc.Router} router
 * @property {ozpIwc.Participant} [srcParticpant]
 * @property {ozpIwc.Participant} [dstParticpant]
 */
ozpIwc.TransportPacketContext=function(config) {
    for(var i in config) {
        this[i]=config[i];
    }
};

/**
 *
 * @param {ozpIwc.TransportPacket} response
 * @returns {ozpIwc.TransportPacket} the packet that was sent
 */
ozpIwc.TransportPacketContext.prototype.replyTo=function(response) {
    var now=new Date().getTime();
    response.ver = response.ver || 1;
    response.time = response.time || now;
    response.replyTo=response.replyTo || this.packet.msgId;
    response.src=response.src || this.packet.dst;
    response.dst=response.dst || this.packet.src;
    if(this.dstParticipant) {
        this.dstParticipant.send(response);
    } else{
        response.msgId = response.msgId || now;
        this.router.send(response);
    }
    return response;
};

/**
 * @event ozpIwc.Router#preRegisterParticipant
 * @mixes ozpIwc.CancelableEvent
 * @property {ozpIwc.TransportPacket} [packet] - The packet to be delivered
 * @property {object} registration - Information provided by the participant about it's registration
 * @property {ozpIwc.Participant} participant - The participant that will receive the packet
 */

/**
 * @event ozpIwc.Router#preSend
 * @mixes ozpIwc.CancelableEvent
 * @property {ozpIwc.TransportPacket} packet - The packet to be sent
 * @property {ozpIwc.Participant} participant - The participant that sent the packet
 */

/**
 * @event ozpIwc.Router#preDeliver
 * @mixes ozpIwc.CancelableEvent
 * @property {ozpIwc.TransportPacket} packet - The packet to be delivered
 * @property {ozpIwc.Participant} participant - The participant that will receive the packet
 */

/**
 * @event ozpIwc.Router#send
 * @property {ozpIwc.TransportPacket} packet - The packet to be delivered
 */

/**
 * @event ozpIwc.Router#prePeerReceive
 * @mixes ozpIwc.CancelableEvent
 * @property {ozpIwc.TransportPacket} packet
 * @property {ozpIwc.NetworkPacket} rawPacket
 */

/**
 * @class
 * @param {object} [config]
 * @param {ozpIwc.Peer} [config.peer=ozpIwc.defaultPeer]
 */
ozpIwc.Router=function(config) {
    config=config || {};
    this.peer=config.peer || ozpIwc.defaultPeer;

//	this.nobodyAddress="$nobody";
//	this.routerControlAddress='$transport';
	var self=this;

	this.self_id=ozpIwc.util.generateId();
	
	// Stores all local addresses
	this.participants={};
	
	ozpIwc.metrics.gauge("transport.participants").set(function() {
		return Object.keys(self.participants).length;
	});

	this.events=new ozpIwc.Event();
	this.events.mixinOnOff(this);
	
	// Wire up to the peer
	this.peer.on("receive",function(event) {
		self.receiveFromPeer(event.packet);
	});
	
	var checkFormat=function(event) {
		var message=event.packet;
		if(message.ver !== 1) {
			event.cancel("badVersion");
		}
		if(!message.src) {
			event.cancel("nullSource");
		}
		if(!message.dst) {
			event.cancel("nullDestination");
		}
		if(event.canceled) {
			ozpIwc.metrics.counter("transport.packets.invalidFormat").inc();
		}
	};
	this.events.on("preSend",checkFormat);
	this.watchdog=new ozpIwc.RouterWatchdog({router: this});
	this.registerParticipant(this.watchdog);

    ozpIwc.metrics.gauge('transport.router.participants').set(function() {
        return self.getParticipantCount();
    });
};

/**
 * gets the count of participants who have registered with the router
 * @returns {number} the number of registered participants
 */
ozpIwc.Router.prototype.getParticipantCount=function() {
    if (!this.participants || !Object.keys(this.participants)) {
        return 0;
    }
    return Object.keys(this.participants).length;

};

ozpIwc.Router.prototype.shutdown=function() {
    this.watchdog.shutdown();
};

/**
 * Allows a listener to add a new participant.
 * @fires ozpIwc.Router#registerParticipant
 * @param {object} participant the participant object that contains a send() function.
 * @param {object} packet The handshake requesting registration.
 * @returns {string} returns participant id
 */
ozpIwc.Router.prototype.registerParticipant=function(participant,packet) {
    packet = packet || {};
    var address;
    do {
        address=ozpIwc.util.generateId()+"."+this.self_id;
    } while(this.participants.hasOwnProperty(address));

    var registerEvent=new ozpIwc.CancelableEvent({
        'packet': packet,
        'registration': packet.entity,
        'participant': participant
    });
    this.events.trigger("preRegisterParticipant",registerEvent);

    if(registerEvent.canceled){
        // someone vetoed this participant
        ozpIwc.log.log("registeredParticipant[DENIED] origin:"+participant.origin+
            " because " + registerEvent.cancelReason);
        return null;
    }

    this.participants[address] = participant;
    participant.connectToRouter(this,address);
    var registeredEvent=new ozpIwc.CancelableEvent({
        'packet': packet,
        'participant': participant
    });
    this.events.trigger("registeredParticipant",registeredEvent);

//	ozpIwc.log.log("registeredParticipant["+participant_id+"] origin:"+participant.origin);
    return address;
};

/**
 * @fires ozpIwc.Router#preSend
 * @param {ozpIwc.TransportPacket} packet
 * @param {ozpIwc.Participant} sendingParticipant
 */
ozpIwc.Router.prototype.deliverLocal=function(packet,sendingParticipant) {
    if(!packet) {
        throw "Cannot deliver a null packet!";
    }
    var localParticipant=this.participants[packet.dst];
    if(!localParticipant) {
        return;
    }
    var packetContext=new ozpIwc.TransportPacketContext({
        'packet':packet,
        'router': this,
        'srcParticipant': sendingParticipant,
        'dstParticipant': localParticipant
    });

    var preDeliverEvent=new ozpIwc.CancelableEvent({
        'packet': packet,
        'dstParticipant': localParticipant,
        'srcParticipant': sendingParticipant
    });

    if(this.events.trigger("preDeliver",preDeliverEvent).canceled) {
        ozpIwc.metrics.counter("transport.packets.rejected").inc();
        return;
    }

    ozpIwc.authorization.isPermitted({
        'subject':localParticipant.securityAttributes,
        'object': packet.permissions,
        'action': {'action': 'receive'}
    })
        .success(function() {
            ozpIwc.metrics.counter("transport.packets.delivered").inc();
            localParticipant.receiveFromRouter(packetContext);
        })
        .failure(function() {
            /** @todo do we send a "denied" message to the destination?  drop?  who knows? */
            ozpIwc.metrics.counter("transport.packets.forbidden").inc();
        });

};


/**
 * Registers a participant for a multicast group
 * @param {ozpIwc.Participant} participant
 * @param {String[]} multicastGroups
 */
ozpIwc.Router.prototype.registerMulticast=function(participant,multicastGroups) {
    var self=this;
    multicastGroups.forEach(function(groupName) {
        var g=self.participants[groupName];
        if(!g) {
            g=self.participants[groupName]=new ozpIwc.MulticastParticipant(groupName);
        }
        g.addMember(participant);
        if (participant.address) {
            var registeredEvent = new ozpIwc.CancelableEvent({
                'entity': {'group': groupName, 'address': participant.address}
            });
            self.events.trigger("registeredMulticast", registeredEvent);
        } else {
            console.log("no address for " +  participant.participantType + " " + participant.name + "with address " + participant.address + " for group " + groupName);
        }
        //console.log("registered " + participant.participantType + " " + participant.name + "with address " + participant.address + " for group " + groupName);
    });
    return multicastGroups;
};

/**
 * Used by participant listeners to route a message to other participants.
 * @fires ozpIwc.Router#preSend
 * @fires ozpIwc.Router#send
 * @param {ozpIwc.TransportPacket} packet The packet to route.
 * @param {ozpIwc.Participant} sendingParticipant Information about the participant that is attempting to send
 *   the packet.
 * @returns {undefined}
 */
ozpIwc.Router.prototype.send=function(packet,sendingParticipant) {

    var preSendEvent=new ozpIwc.CancelableEvent({
        'packet': packet,
        'participant': sendingParticipant
    });
    this.events.trigger("preSend",preSendEvent);

    if(preSendEvent.canceled) {
        ozpIwc.metrics.counter("transport.packets.sendCanceled");
        return;
    }
    ozpIwc.metrics.counter("transport.packets.sent").inc();
    this.deliverLocal(packet,sendingParticipant);
    this.events.trigger("send",{'packet': packet});
    this.peer.send(packet);
};

/**
 * Receive a packet from the peer
 * @fires ozpIwc.Router#peerReceive
 * @param packet {ozpIwc.TransportPacket} the packet to receive
 */
ozpIwc.Router.prototype.receiveFromPeer=function(packet) {
    ozpIwc.metrics.counter("transport.packets.receivedFromPeer").inc();
    var peerReceiveEvent=new ozpIwc.CancelableEvent({
        'packet' : packet.data,
        'rawPacket' : packet
    });
    this.events.trigger("prePeerReceive",peerReceiveEvent);

    if(!peerReceiveEvent.canceled){
        this.deliverLocal(packet.data);
    }
};


var ozpIwc=ozpIwc || {};

/**
 * Baseclass for APIs that need leader election.  Uses the Bully algorithm for leader election.
 * @class
 * @param {object} config
 * @param {String} config.name 
 *        The name of this API.
 * @param {string} [config.electionAddress=config.name+".election"] 
 *        The multicast channel for running elections.  
 *        The leader will register to receive multicast on this channel.
 * @param {number} [config.priority=Math.Random] 
 *        How strongly this node feels it should be leader.
 * @param {function} [config.priorityLessThan] 
 *        Function that provides a strict total ordering on the priority.  Default is "<".
 * @param {number} [config.electionTimeout=250] 
 *        Number of milliseconds to wait before declaring victory on an election. 
 
 */
ozpIwc.LeaderGroupParticipant=ozpIwc.util.extend(ozpIwc.InternalParticipant,function(config) {
	ozpIwc.InternalParticipant.apply(this,arguments);

	if(!config.name) {
		throw "Config must contain a name value";
	}
	
	// Networking info
	this.name=config.name;
	
	this.electionAddress=config.electionAddress || (this.name + ".election");

	// Election times and how to score them
	this.priority = config.priority || ozpIwc.defaultLeaderPriority || -ozpIwc.util.now();
	this.priorityLessThan = config.priorityLessThan || function(l,r) { return l < r; };
	this.electionTimeout=config.electionTimeout || 250; // quarter second
	this.leaderState="connecting";
	this.electionQueue=[];
	
	// tracking the current leader
	this.leader=null;
	this.leaderPriority=null;

	this.participantType="leaderGroup";
	this.name=config.name;
	
	this.on("startElection",function() {
			this.electionQueue=[];
	},this);
	
	this.on("becameLeader",function() {
		this.electionQueue.forEach(function(p) {
			this.forwardToTarget(p);
		},this);
		this.electionQueue=[];
	},this);

	this.on("newLeader",function() {
		this.electionQueue=[];
	},this);
	var self=this;
	
	// handoff when we shut down
	window.addEventListener("beforeunload",function() {
        //Priority has to be the minimum possible
        self.priority=-Number.MAX_VALUE;
        self.leaderPriority=-Number.MAX_VALUE;
        if(self.leaderState === "leader") {
            self.events.trigger("unloadState");
        }
	});

    ozpIwc.metrics.gauge('transport.leaderGroup.election').set(function() {
        var queue = self.getElectionQueue();
        return {'queue': queue ? queue.length : 0};
    });
	this.on("connectedToRouter",function() {
        this.router.registerMulticast(this,[this.electionAddress,this.name]);
        this.startElection();
    },this);
    this.on("receive",this.routePacket,this);
});

/**
 * Retrieve the election queue. Called by closures which need access to the
 * queue as it grows
 * @returns {Array} the election queue
 */
ozpIwc.LeaderGroupParticipant.prototype.getElectionQueue=function() {
    return this.electionQueue;
};


/**
 * Checks to see if the leadership group is in an election
 * @returns {Boolean} True if in an election state, otherwise false
 */
ozpIwc.LeaderGroupParticipant.prototype.inElection=function() {
	return !!this.electionTimer;
};

/**
 * Checks to see if this instance is the leader of it's group.
 * @returns {Boolean}
 */
ozpIwc.LeaderGroupParticipant.prototype.isLeader=function() {
	return this.leader === this.address;
};

/**
 * Sends a message to the leadership group.
 * @private
 * @param {string} type - the type of message-- "election" or "victory"
 */
ozpIwc.LeaderGroupParticipant.prototype.sendElectionMessage=function(type, config) {
    config = config || {};
    var state = config.state || {};
	this.send({
		'src': this.address,
		'dst': this.electionAddress,
		'action': type,
		'entity': {
			'priority': this.priority,
            'state': state
		}
	});
};

/**
 * Attempt to start a new election.
 * @protected
 * @returns {undefined}
 * @fire ozpIwc.LeaderGroupParticipant#startElection
 * @fire ozpIwc.LeaderGroupParticipant#becameLeader
 */
ozpIwc.LeaderGroupParticipant.prototype.startElection=function(config) {
    config = config || {};
    var state = config.state || {};

	// don't start a new election if we are in one
	if(this.inElection()) {
		return;
	}
	this.leaderState="election";
	this.events.trigger("startElection");

    this.victoryDebounce = null;
	
	var self=this;
	// if no one overrules us, declare victory
	this.electionTimer=window.setTimeout(function() {
		self.cancelElection();
        self.leaderState = "leader";
        self.leader=self.address;
        self.leaderPriority=self.priority;
        self.events.trigger("becameLeader");

        self.sendElectionMessage("victory");

        // Debouncing before setting state.
        self.victoryDebounce = window.setTimeout(function(){
            if (self.leaderState === "leader") {
                if (self.stateStore && Object.keys(self.stateStore).length > 0) {
                    self.events.trigger("acquireState", self.stateStore);
                    self.stateStore = {};
                }
            }
        },100);
	},this.electionTimeout);

	this.sendElectionMessage("election", {state: state});
};

/**
 * Cancels an in-progress election that we started.
 * @protected
 * @fire ozpIwc.LeaderGroupParticipant#endElection
 */
ozpIwc.LeaderGroupParticipant.prototype.cancelElection=function() {
	if(this.electionTimer) {
        window.clearTimeout(this.electionTimer);
        this.electionTimer=null;
        window.clearTimeout(this.victoryDebounce);
        this.victoryDebounce=null;
        this.events.trigger("endElection");
	}
};

/**
 * Receives a packet on the election control group or forwards it to the target implementation
 * that of this leadership group.
 * @param {ozpIwc.TransportPacket} packet
 * @returns {boolean}
 */
ozpIwc.LeaderGroupParticipant.prototype.routePacket=function(packetContext) {
	var packet=packetContext.packet;
	packetContext.leaderState=this.leaderState;
    if(packet.src === this.address) {
        // drop our own packets that found their way here
        return;
    }
    if(packet.dst === this.electionAddress) {
        if(packet.src === this.address) {
			// even if we see our own messages, we shouldn't act upon them
			return;
		} else if(packet.action === "election") {
			this.handleElectionMessage(packet);
		} else if(packet.action === "victory") {
			this.handleVictoryMessage(packet);
		}
    } else {
		this.forwardToTarget(packetContext);
	}		
};

ozpIwc.LeaderGroupParticipant.prototype.forwardToTarget=function(packetContext) {
	if(this.leaderState === "election" || this.leaderState === "connecting") {
		this.electionQueue.push(packetContext);
		return;
	}
	packetContext.leaderState=this.leaderState;
	this.events.trigger("receiveApiPacket",packetContext);
};
	
	
/**
 * Respond to someone else starting an election.
 * @private
 * @param {ozpIwc.TransportPacket} electionMessage
 * @returns {undefined}
 */
ozpIwc.LeaderGroupParticipant.prototype.handleElectionMessage=function(electionMessage) {
    //If a state was received, store it case participant becomes the leader
    if(Object.keys(electionMessage.entity.state).length > 0){
        this.stateStore = electionMessage.entity.state;
    }
	// is the new election lower priority than us?
	if(this.priorityLessThan(electionMessage.entity.priority,this.priority)) {
		// Quell the rebellion!
		this.startElection();
	} else {
		// Abandon dreams of leadership
		this.cancelElection();
	}
};

/**
 * Handle someone else declaring victory.
 * @fire ozpIwc.LeaderGroupParticipant#newLeader
 * @param {ozpIwc.TransportPacket} victoryMessage
 */
ozpIwc.LeaderGroupParticipant.prototype.handleVictoryMessage=function(victoryMessage) {
	if(this.priorityLessThan(victoryMessage.entity.priority,this.priority)) {
		// someone usurped our leadership! start an election!
		this.startElection();
	} else {
		// submit to the bully
		this.leader=victoryMessage.src;
		this.leaderPriority=victoryMessage.entity.priority;
		this.cancelElection();
		this.leaderState="member";
		this.events.trigger("newLeader");
        this.stateStore = {};
	}
};


ozpIwc.LeaderGroupParticipant.prototype.heartbeatStatus=function() {
	var status= ozpIwc.Participant.prototype.heartbeatStatus.apply(this,arguments);
	status.leaderState=this.leaderState;
	status.leaderPriority=this.priority;
	return status;
};
var ozpIwc=ozpIwc || {};




/**
 * @class
 * @extends ozpIwc.Participant
 * @param {string} name
 */
ozpIwc.MulticastParticipant=ozpIwc.util.extend(ozpIwc.Participant,function(name) {
	this.name=name;
	this.participantType="multicast";

    ozpIwc.Participant.apply(this,arguments);
	this.members=[];
    
    this.namesResource="/multicast/"+this.name;
    
    this.heartBeatContentType="application/ozpIwc-multicast-address-v1+json";
    this.heartBeatStatus.members=[];
    this.on("connectedToRouter",function() {
        this.namesResource="/multicast/" + this.name;
    },this);
});

/**
 * Receives a packet on behalf of the multicast group.
 * @param {ozpIwc.TransportPacket} packet
 * @returns {Boolean}
 */
ozpIwc.MulticastParticipant.prototype.receiveFromRouterImpl=function(packet) {
	this.members.forEach(function(m) {
        // as we send to each member, update the context to make it believe that it's the only recipient
        packet.dstParticipant=m;
        m.receiveFromRouter(packet);
    });
	return false;
};

/**
 * 
 * @param {ozpIwc.Participant} participant
 */
ozpIwc.MulticastParticipant.prototype.addMember=function(participant) {
	this.members.push(participant);
    this.heartBeatStatus.members.push(participant.address);
};
/** @namespace */
var ozpIwc=ozpIwc || {};

/**
 * @class ozpIwc.PostMessageParticipant
 * @extends ozpIwc.Participant
 * @param {object} config
 * @param {string} config.origin
 * @param {object} config.sourceWindow
 * @param {object} config.credentials
 */
ozpIwc.PostMessageParticipant=ozpIwc.util.extend(ozpIwc.Participant,function(config) {
	ozpIwc.Participant.apply(this,arguments);
	this.origin=this.name=config.origin;
	this.sourceWindow=config.sourceWindow;
    this.credentials=config.credentials;
	this.participantType="postMessageProxy";
    this.securityAttributes.origin=this.origin;
    this.on("connectedToRouter",function() {
        this.securityAttributes.sendAs=this.address;
        this.securityAttributes.receiveAs=this.address;
    },this);
    
    this.heartBeatStatus.origin=this.origin;
});

/**
 * @override
 * Receives a packet on behalf of this participant and forwards it via PostMessage.
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.PostMessageParticipant.prototype.receiveFromRouterImpl=function(packetContext) {
    var self = this;
    return ozpIwc.authorization.isPermitted({
        'subject': this.securityAttributes,
        'object':  {
            receiveAs: packetContext.packet.dst
        }
    })
        .success(function(){
            self.sendToRecipient(packetContext.packet);
        })
        .failure(function(){
            ozpIwc.metrics.counter("transport.packets.forbidden").inc();
        });
};

/**
 * Sends a message to the other end of our connection.  Wraps any string mangling
 * necessary by the postMessage implementation of the browser.
 * @param {ozpIwc.TransportPacket} packet
 * @todo Only IE requires the packet to be stringified before sending, should use feature detection?
 * @returns {undefined}
 */
ozpIwc.PostMessageParticipant.prototype.sendToRecipient=function(packet) {
    var data=packet;
    if (!ozpIwc.util.structuredCloneSupport()) {
         data=JSON.stringify(packet);
    }
	this.sourceWindow.postMessage(data,this.origin);
};

/**
 * The participant hijacks anything addressed to "$transport" and serves it
 * directly.  This isolates basic connection checking from the router, itself.
 * @param {object} packet
 * @returns {undefined}
 */
ozpIwc.PostMessageParticipant.prototype.handleTransportPacket=function(packet) {
	var reply={
		'ver': 1,
		'dst': this.address,
		'src': '$transport',
		'replyTo': packet.msgId,
		'msgId': this.generateMsgId(),
		'entity': {
			"address": this.address
		}
	};
	this.sendToRecipient(reply);
};


/**
 *
 * @todo track the last used timestamp and make sure we don't send a duplicate messageId
 * @param {ozpIwc.TransportPacket} packet
 * @param {type} event
 * @returns {undefined}
 */
ozpIwc.PostMessageParticipant.prototype.forwardFromPostMessage=function(packet,event) {
	if(typeof(packet) !== "object") {
		ozpIwc.log.error("Unknown packet received: " + JSON.stringify(packet));
		return;
	}
	if(event.origin !== this.origin) {
		/** @todo participant changing origins should set off more alarms, probably */
		ozpIwc.metrics.counter("transport."+this.address+".invalidSenderOrigin").inc();
		return;
	}

	packet=this.fixPacket(packet);

	// if it's addressed to $transport, hijack it
	if(packet.dst === "$transport") {
		this.handleTransportPacket(packet);
	} else {
		this.router.send(packet,this);
	}
};

/**
 * Sends a packet to this participants router.  Calls fixPacket
 * before doing so.
 * @override
 * @param {ozpIwc.TransportPacket} packet
 * @returns {ozpIwc.TransportPacket}
*/
ozpIwc.PostMessageParticipant.prototype.send=function(packet) {
    packet=this.fixPacket(packet);
    var self = this;
    return ozpIwc.authorization.isPermitted({
        'subject': this.securityAttributes,
        'object': {
            sendAs: packet.src
        }
    })
        .success(function(){
            self.router.send(packet,this);
        })
        .failure(function(){
            ozpIwc.metrics.counter("transport.packets.forbidden").inc();
        });
};


/**
 * @class
 * @param {object} config
 * @param {ozpIwc.Router} config.router
 */
ozpIwc.PostMessageParticipantListener=function(config) {
	config = config || {};
	this.participants=[];
	this.router=config.router || ozpIwc.defaultRouter;

	var self=this;

	window.addEventListener("message", function(event) {
		self.receiveFromPostMessage(event);
	}, false);

    ozpIwc.metrics.gauge('transport.postMessageListener.participants').set(function() {
        return self.getParticipantCount();
    });
};

/**
 * gets the count of known participants
 * @returns {number} the number of known participants
 */
ozpIwc.PostMessageParticipantListener.prototype.getParticipantCount=function() {
    if (!this.participants) {
        return 0;
    }
    return this.participants.length;
};

/**
 * Finds the participant associated with the given window.  Unfortunately, this is an
 * o(n) algorithm, since there doesn't seem to be any way to hash, order, or any other way to
 * compare windows other than equality.
 * @param {object} sourceWindow - the participant window handle from message's event.source
 */
ozpIwc.PostMessageParticipantListener.prototype.findParticipant=function(sourceWindow) {
	for(var i=0; i< this.participants.length; ++i) {
		if(this.participants[i].sourceWindow === sourceWindow) {
			return this.participants[i];
		}
	};
};

/**
 * Process a post message that is received from a peer
 * @param {object} event - The event received from the "message" event handler
 * @param {string} event.origin
 * @param {object} event.source
 * @param {ozpIwc.TransportPacket} event.data
 */
ozpIwc.PostMessageParticipantListener.prototype.receiveFromPostMessage=function(event) {
	var participant=this.findParticipant(event.source);
	var packet=event.data;

	if(typeof(event.data)==="string") {
		try {
            packet=JSON.parse(event.data);
        } catch(e) {
            // assume that it's some other library using the bus and let it go
            return;
        }
	}
	// if this is a window who hasn't talked to us before, sign them up
	if(!participant) {
		participant=new ozpIwc.PostMessageParticipant({
			'origin': event.origin,
			'sourceWindow': event.source,
			'credentials': packet.entity
		});
		this.router.registerParticipant(participant,packet);
		this.participants.push(participant);
	}
	participant.forwardFromPostMessage(packet,event);
};

/**
 * @class
 */
ozpIwc.RouterWatchdog = ozpIwc.util.extend(ozpIwc.InternalParticipant, function(config) {
    ozpIwc.InternalParticipant.apply(this, arguments);

    this.participantType = "routerWatchdog";
    var self = this;
    this.on("connected", function() {
        this.name = this.router.self_id;
    }, this);

    this.heartbeatFrequency = config.heartbeatFrequency || 10000;

    this.on("connectedToRouter", this.setupWatches, this);
});

ozpIwc.RouterWatchdog.prototype.setupWatches = function() {
    this.name = this.router.self_id;
    var self=this;
    var heartbeat=function() {
        self.send({
            dst: "names.api",
            action: "set",
            resource: "/router/" + self.router.self_id,
            contentType: "application/ozpIwc-router-v1+json",
            entity: {
                'address': self.router.self_id,
                'participants': self.router.getParticipantCount()
            }
        });

        for (var k in self.router.participants) {
            var participant=self.router.participants[k];
            if(participant instanceof ozpIwc.MulticastParticipant) {
                self.send({
                    'dst': "names.api",
                    'resource': participant.namesResource,
                    'action' : "set",
                    'entity' : participant.heartBeatStatus,
                    'contentType' : participant.heartBeatContentType              
                });
            } else {
                participant.heartbeat();
            }            
        }

    };
//    heartbeat();
    
    this.timer = window.setInterval(heartbeat, this.heartbeatFrequency);
};

ozpIwc.RouterWatchdog.prototype.shutdown = function() {
    window.clearInterval(this.timer);
};



/**
 * The base class for values in the various APIs.  Designed to be extended with API-specific
 * concerns and validation.
 * @class
 * @param {object} config
 * @param {string} config.name - the name of this resource
 */
ozpIwc.CommonApiValue = function(config) {
	config = config || {};
	this.watchers= config.watchers || [];
	this.resource=config.resource;
    this.allowedContentTypes=config.allowedContentTypes;
    this.entity=config.entity;
	this.contentType=config.contentType;
	this.permissions=config.permissions || {};
	this.version=config.version || 0;
    
    this.persist=true;
    this.deleted=true;
};

/**
 * Sets a data based upon the content of the packet.  Automatically updates the content type,
 * permissions, entity, and updates the version.
 * 
 * @param {ozpIwc.TransportPacket} packet
 * @returns {undefined}
 */
ozpIwc.CommonApiValue.prototype.set=function(packet) {
	if(this.isValidContentType(packet.contentType)) {
		this.permissions=packet.permissions || this.permissions;
		this.contentType=packet.contentType;
		this.entity=packet.entity;
		this.version++;
	}
};
/**
 * Adds a new watcher based upon the contents of the packet.
 * @param {ozpIwc.TransportPacket} packet
 * @returns {undefined}
 */
ozpIwc.CommonApiValue.prototype.watch=function(packet) {
	this.watchers.push({
		src: packet.src,
		msgId: packet.msgId
	});
};

/**
 * Removes a previously registered watcher.  An unwatch on
 * someone who isn't actually watching is not an error-- 
 * the post condition is satisfied.
 * 
 * @param {ozpIwc.TransportPacket} packet
 * @returns {undefined}
 */
ozpIwc.CommonApiValue.prototype.unwatch=function(packet) {
	this.watchers=this.watchers.filter(function(w) {
		return packet.replyTo !== w.msgId && packet.src !==w.src;
	});
};

/**
 * Invokes the callback on each watcher.
 * @param {function} callback
 * @param {object} [self] - Used as 'this' for the callback.  Defaults to the Value object.
 * @returns {undefined}
 */
ozpIwc.CommonApiValue.prototype.eachWatcher=function(callback,self) {
	self=self || this;
	return this.watchers.map(callback,self);
};

/**
 * Resets the data to an empy state-- undefined entity and contentType, no permissions,
 * and version of 0.  It does NOT remove watchers.  This allows for watches on values
 * that do not exist yet, or will be created in the future.
 * 
 * @returns {undefined}
 */
ozpIwc.CommonApiValue.prototype.deleteData=function() {
	this.entity=undefined;
	this.contentType=undefined;
	this.permissions=[];
	this.version=0;
    this.deleted=true;
};

/**
 * Turns this value into a packet.
 * 
 * @param {ozpIwc.TransportPacket} base - Fields to be merged into the packet.
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.CommonApiValue.prototype.toPacket=function(base) {
	base = base || {};
	base.entity=ozpIwc.util.clone(this.entity);
	base.contentType=this.contentType;
	base.permissions=ozpIwc.util.clone(this.permissions);
	base.eTag=this.version;
	base.resource=this.resource;
	return base;
};

/**
 * Determines if the contentType is acceptable to this value.  Intended to be
 * overriden by subclasses.
 * @param {string} contentType
 * @returns {Boolean}
 */
ozpIwc.CommonApiValue.prototype.isValidContentType=function(contentType) {
    if(this.allowedContentTypes && this.allowedContentTypes.indexOf(contentType) < 0) {
        throw new ozpIwc.ApiError("badContent",
                "Bad contentType " + contentType +", expected " + this.allowedContentTypes.join(","));
     } else {
        return true;
    }
};

/**
 * Generates a point-in-time snapshot of this value that can later be sent to
 * {@link ozpIwc.CommonApiValue#changesSince} to determine the changes made to the value.
 * This value should be considered opaque to consumers.
 * 
 * <p> For API subclasses, the default behavior is to simply call toPacket().  Subclasses
 * can override this, but should likely override {@link ozpIwc.CommonApiValue#changesSince}
 * as well.
 * 
 * @returns {object}
 */
ozpIwc.CommonApiValue.prototype.snapshot=function() {
	return this.toPacket();
};

/**
 * From a given snapshot, create a change notifications.  This is not a delta, rather it's
 * change structure.
 * <p> API subclasses can override if there are additional change notifications (e.g. children in DataApi).

 * @param {object} snapshot
 * @returns {ozpIwc.CommonApiValue.prototype.changesSince.Anonym$1}
 */
ozpIwc.CommonApiValue.prototype.changesSince=function(snapshot) {
	if(snapshot.eTag === this.version) {
        return null;
    }
	return {
			'newValue': ozpIwc.util.clone(this.entity),
			'oldValue': snapshot.entity
	};
};

/**
 * Returns true if the value of this is impacted by the value of node.
 * For nodes that base their value off of other nodes, override this function.
 * @param {type} node 
 * @returns boolean
 */
ozpIwc.CommonApiValue.prototype.isUpdateNeeded=function(node) {
    return false;
};

/**
 * Update this node based upon the changes made to changedNodes.
 * @param {ozpIwc.CommonApiValue[]} changedNodes - Array of all nodes for which isUpdatedNeeded returned true.
 * @returns {ozpIwc.CommonApiValue.changes}
 */
ozpIwc.CommonApiValue.prototype.updateContent=function(changedNodes) {
    return null;
};

ozpIwc.CommonApiValue.prototype.deserialize=function(serverData) {
};


ozpIwc.CommonApiCollectionValue = ozpIwc.util.extend(ozpIwc.CommonApiValue,function(config) {
	ozpIwc.CommonApiValue.apply(this,arguments);
    this.persist=false;    
    this.pattern=config.pattern;
    this.entity=[];
});

ozpIwc.CommonApiCollectionValue.prototype.isUpdateNeeded=function(node) {
    return node.resource.match(this.pattern);
};

ozpIwc.CommonApiCollectionValue.prototype.updateContent=function(changedNodes) {
    this.version++;
    this.entity=changedNodes.map(function(changedNode) { return changedNode.resource; });
};

ozpIwc.CommonApiCollectionValue.prototype.set=function() {
    throw new ozpIwc.ApiError("noPermission","This resource cannot be modified.");
};

ozpIwc.ApiError=ozpIwc.util.extend(Error,function(action,message) {
    Error.call(this,message);
    this.name="ApiError";
    this.errorAction=action;
    this.message=message;
});
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
ozpIwc.DataApi = ozpIwc.util.extend(ozpIwc.CommonApiBase,function(config) {
	ozpIwc.CommonApiBase.apply(this,arguments);
    this.endpointName="data";
    this.loadFromServer();
});

ozpIwc.DataApi.prototype.makeValue = function(packet){
    return new ozpIwc.DataApiValue(packet);
};

ozpIwc.DataApi.prototype.createChild=function(node,packetContext) {
	var key=this.createKey(node.resource+"/");

	// save the new child
	var childNode=this.findOrMakeValue({'resource':key});
	childNode.set(packetContext.packet);
	return childNode;
};

ozpIwc.DataApi.prototype.handleList=function(node,packetContext) {
	packetContext.replyTo({
        'response': 'ok',
        'entity': node.listChildren()
    });
};

/**
 * @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.DataApi.prototype.handleAddchild=function(node,packetContext) {
	var childNode=this.createChild(node,packetContext);

	node.addChild(childNode.resource);
	
	packetContext.replyTo({
        'response':'ok',
        'entity' : {
            'resource': childNode.resource
        }
    });
};

/**
 * @param {ozpIwc.CommonApiValue} node
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.DataApi.prototype.handleRemovechild=function(node,packetContext) {
    node.removeChild(packetContext.packet.entity.resource);
	// delegate to the handleGet call
	packetContext.replyTo({
        'response':'ok'
    });
};


ozpIwc.DataApiValue = ozpIwc.util.extend(ozpIwc.CommonApiValue,function(config) {
	ozpIwc.CommonApiValue.apply(this,arguments);
    config = config || {};
	this.children=config.children || [];
});

/**
 * 
 * @param {string} child - name of the child record of this
 * @returns {undefined}
 */
ozpIwc.DataApiValue.prototype.addChild=function(child) {
    if(this.children.indexOf(child) < 0) {
        this.children.push(child);
    	this.version++;
    }
};

/**
 * 
 * @param {string} child - name of the child record of this
 * @returns {undefined}
 */
ozpIwc.DataApiValue.prototype.removeChild=function(child) {
    var originalLen=this.children.length;
    this.children=this.children.filter(function(c) {
        return c !== child;
    });
    if(originalLen !== this.children.length) {
     	this.version++;
    }
};

/**
 * 
 * @param {string} child - name of the child record of this
 * @returns {undefined}
 */
ozpIwc.DataApiValue.prototype.listChildren=function() {
    return ozpIwc.util.clone(this.children);
};

/**
 * 
 * @param {string} child - name of the child record of this
 * @returns {undefined}
 */
ozpIwc.DataApiValue.prototype.toPacket=function() {
	var packet=ozpIwc.CommonApiValue.prototype.toPacket.apply(this,arguments);
	packet.links=packet.links || {};
	packet.links.children=this.listChildren();
	return packet;
};

ozpIwc.DataApiValue.prototype.changesSince=function(snapshot) {
    var changes=ozpIwc.CommonApiValue.prototype.changesSince.apply(this,arguments);
	if(changes) {
        changes.removedChildren=snapshot.links.children.filter(function(f) {
            return this.indexOf(f) < 0;
        },this.children);
        changes.addedChildren=this.children.filter(function(f) {
            return this.indexOf(f) < 0;
        },snapshot.links.children);
	}
    return changes;
};


ozpIwc.DataApiValue.prototype.deserialize=function(serverData) {
    this.entity=serverData.entity;
    this.contentType=serverData.contentType || this.contentType;
	this.permissions=serverData.permissions || this.permissions;
	this.version=serverData.version || this.version;
};

/**
 * The Intents API. Subclasses The Common Api Base.
 * @class
 * @params config {Object}
 * @params config.href {String} - URI of the server side Data storage to load the Intents Api with
 * @params config.loadServerData {Boolean} - Flag to load server side data.
 * @params config.loadServerDataEmbedded {Boolean} - Flag to load embedded version of server side data.
 *                                                  Takes precedence over config.loadServerData
 */
ozpIwc.IntentsApi = ozpIwc.util.extend(ozpIwc.CommonApiBase, function (config) {
    ozpIwc.CommonApiBase.apply(this, arguments);
    this.events.on("receive", ozpIwc.IntentsApi.prototype.parseResource, this);
    var self = this;
    if (config.href && config.loadServerDataEmbedded) {
        this.loadServerDataEmbedded({href: config.href})
            .success(function () {
                //Add on load code here
            });
    } else if (config.href && config.loadServerData) {
        this.loadServerData({href: config.href})
            .success(function () {
                //Add on load code here
            });
    }


});

/**
 * Internal method, not intended for API use. Used for handling resource path parsing.
 * @param  {string} resource - the resource path to be evaluated.
 * @returns {object} parsedResource
 * @returns {string} parsedResource.type - the type of the resource
 * @returns {string} parsedResource.subtype - the subtype of the resource
 * @returns {string} parsedResource.verb - the verb (action) of the resource
 * @returns {string} parsedResource.handler - the handler of the resource
 * @returns {string} parsedResource.capabilityRes - the resource path of this resource's capability
 * @returns {string} parsedResource.definitionRes - the resource path of this resource's definition
 * @returns {string} parsedResource.handlerRes - the resource path of this resource's handler
 * @returns {string} parsedResource.intentValueType - returns the value type given the resource path (capability, definition, handler)
 */
ozpIwc.IntentsApi.prototype.parseResource = function (packetContext) {
    if(!packetContext.packet.resource) {
        return;
    }
    var resourceSplit = packetContext.packet.resource.split('/');
    var result = {
        type: resourceSplit[1],
        subtype: resourceSplit[2],
        verb: resourceSplit[3],
        handler: resourceSplit[4]
    };
    if (result.type && result.subtype) {
        if (result.verb) {
            if (result.handler) {
                result.intentValueType = 'handler';
                result.handlerRes = '/' + resourceSplit[1] + '/' + resourceSplit[2] + '/' + resourceSplit[3] + '/' + resourceSplit[4];
                result.definitionRes = '/' + resourceSplit[1] + '/' + resourceSplit[2] + '/' + resourceSplit[3];
                result.capabilityRes = '/' + resourceSplit[1] + '/' + resourceSplit[2];
            } else {
                result.intentValueType = 'definition';
                result.definitionRes = '/' + resourceSplit[1] + '/' + resourceSplit[2] + '/' + resourceSplit[3];
                result.capabilityRes = '/' + resourceSplit[1] + '/' + resourceSplit[2];
            }
        } else {
            result.intentValueType = 'capabilities';
            result.capabilityRes = '/' + resourceSplit[1] + '/' + resourceSplit[2];
        }
        packetContext.packet.parsedResource = result;
    }
    return packetContext;
};

/**
 * Takes the resource of the given packet and creates an empty value in the IntentsApi. Chaining of creation is
 * accounted for (A handler requires a definition, which requires a capability).
 * @param {object} packet
 * @returns {IntentsApiHandlerValue|IntentsAPiDefinitionValue|IntentsApiCapabilityValue}
 */
ozpIwc.IntentsApi.prototype.makeValue = function (packet) {
    if (!packet.packetResource) {
        packet = ozpIwc.IntentsApi.prototype.parseResource({packet: packet}).packet;
    }
    switch (packet.parsedResource.intentValueType) {
        case 'handler':
            return this.getHandler(packet);
        case 'definition':
            return this.getDefinition(packet);
        case 'capabilities':
            return this.getCapability(packet);
        default:
            return null;
    }
};

/**
 * Internal method, not intended for API use. Uses constructor parameter to determine what is constructed if the
 * resource does not exist.
 * @param {string} resource - the resource path of the desired value.
 * @param {Function} constructor - constructor function to be used if value does not exist.
 * @returns {IntentsApiHandlerValue|IntentsAPiDefinitionValue|IntentsApiCapabilityValue} node - node has only the resource parameter initialized.
 */
ozpIwc.IntentsApi.prototype.getGeneric = function (resource, constructor) {
    var node = this.data[resource];
    if (!node) {
        node = this.data[resource] = new constructor({resource: resource});
    }
    return node;
};

/**
 * Returns the given capability in the IntentsApi. Constructs a new one if it does not exist.
 * @param {object} parsedResource - the  parsed resource of the desired value. Created from parsedResource().
 * @returns {IntentsApiCapabilityValue} value - the capability value requested.
 */
ozpIwc.IntentsApi.prototype.getCapability = function (packet) {
    return this.getGeneric(packet.parsedResource.capabilityRes, ozpIwc.IntentsApiCapabilityValue);
};

/**
 * Returns the given definition in the IntentsApi. Constructs a new one if it does not exist. Constructs a capability
 * if necessary.
 * @param {object} parsedResource - the  parsed resource of the desired value. Created from parsedResource().
 * @returns {IntentsAPiDefinitionValue} value - the definition value requested.
 */
ozpIwc.IntentsApi.prototype.getDefinition = function (packet) {
    var capability = this.getCapability(packet);
    capability.entity = capability.entity || {};
    capability.entity.definitions = capability.entity.definitions || [];

    var definitionIndex = capability.entity.definitions.indexOf(packet.parsedResource.definitionRes);
    if (definitionIndex === -1) {
        capability.pushDefinition(packet.parsedResource.definitionRes);
    }

    return this.getGeneric(packet.parsedResource.definitionRes, ozpIwc.IntentsApiDefinitionValue);
};

/**
 * Returns the given handler in the IntentsApi. Constructs a new one if it does not exist. Constructs a definition
 * and capability if necessary.
 * @param {object} parsedResource - the  parsed resource of the desired value. Created from parsedResource().
 * @returns {IntentsApiHandlerValue} value - the handler value requested.
 */
ozpIwc.IntentsApi.prototype.getHandler = function (packet) {
    var definition = this.getDefinition(packet);
    definition.entity = definition.entity || {};
    definition.entity.handlers = definition.entity.handlers || [];

    var handlerIndex = definition.entity.handlers.indexOf(packet.parsedResource.handlerRes);
    if (handlerIndex === -1) {
        definition.pushHandler(packet.parsedResource.handlerRes);
    }

    return this.getGeneric(packet.parsedResource.handlerRes, ozpIwc.IntentsApiHandlerValue);
};

/**
 * Creates and registers a handler to the given definition resource path.
 * @param {object} node - the handler value to register, or the definition value the handler will register to
 * (handler will receive a generated key if definition value is provided).
 * @param {ozpIwc.TransportPacketContext} packetContext - the packet received by the router.
 */
ozpIwc.IntentsApi.prototype.handleRegister = function (node, packetContext) {
    if (packetContext.packet.parsedResource.intentValueType === 'definition') {
        packetContext.packet.parsedResource.handlerRes = this.createKey(packetContext.packet.resource + '/');
    } else if (packetContext.packet.parsedResource.intentValueType !== 'handler') {
        packetContext.replyTo({
            'response': 'badResource'
        });
        return null;
    }

    var handler = this.getHandler(packetContext.packet);
    handler.set(packetContext);

    packetContext.replyTo({
        'response': 'ok',
        'entity': handler.resource
    });
};

/**
 * Unregisters and destroys the handler assigned to the given handler resource path.
 * @param {object} node - the handler value to unregister from its definition.
 * @param {ozpIwc.TransportPacketContext} packetContext - the packet received by the router.
 */
ozpIwc.IntentsApi.prototype.handleUnregister = function (node, packetContext) {
    var definitionPath = packetContext.packet.parsedResource.definitionRes;
    var handlerPath = packetContext.packet.parsedResource.handlerRes;

    var index = this.data[definitionPath].entity.handlers.indexOf(handlerPath);

    if (index > -1) {
        this.data[definitionPath].entity.handlers.splice(index, 1);
    }
    delete this.data[handlerPath];
    packetContext.replyTo({'response': 'ok'});
};

/**
 * Invokes the appropriate handler for the intent from one of the following methods:
 *  <li> user preference specifies which handler to use. </li>
 *  <li> by prompting the user to select which handler to use. </li>
 *  <li> by receiving a handler resource instead of a definition resource </li>
 *  @todo <li> user preference specifies which handler to use. </li>
 *  @todo <li> by prompting the user to select which handler to use. </li>
 * @param {object} node - the definition or handler value used to invoke the intent.
 * @param {ozpIwc.TransportPacketContext} packetContext - the packet received by the router.
 */
ozpIwc.IntentsApi.prototype.handleInvoke = function (node, packetContext) {
    switch (packetContext.packet.parsedResource.intentValueType) {
        case 'handler':
            node.invoke(packetContext.packet);
            break;

        case 'definition':
            //TODO get user preference of which handler to use?
            var handlerPreference = 0;
            if (node.handlers.length > 0) {
                var handler = node.handlers[handlerPreference];
                this.data[handler].invoke(packet);
            } else {
                packetContext.replyTo({'response': 'badResource'});
            }
            break;

        default:
            packetContext.replyTo({'response': 'badResource'});
            break;
    }
};

/**
 * Listen for broadcast intents.
 * @todo unimplemented
 * @param {object} node - ?
 * @param {ozpIwc.TransportPacketContext} packetContext - the packet received by the router.
 */
ozpIwc.IntentsApi.prototype.handleListen = function (node, packetContext) {
    //TODO handleListen()
//    var parse = this.parseResource(packetContext.packet.resource);
//    if (parse.intentValueType !== 'definition') {
//        return packetContext.replyTo({
//            'response': 'badResource'
//        });
//    }
};

/**
 * Handle a broadcast intent.
 * @todo unimplemented
 * @param {object} node - ?
 * @param {ozpIwc.TransportPacketContext} packetContext - the packet received by the router.
 */
ozpIwc.IntentsApi.prototype.handleBroadcast = function (node, packetContext) {
    //TODO handleBroadcast()
//    var parse = this.parseResource(packetContext.packet.resource);
//    if (parse.intentValueType !== 'definition') {
//        return packetContext.replyTo({
//            'response': 'badResource'
//        });
//    }
//    for (var i in node.handlers) {
//        this.data[node.handlers[i]].invoke(packetContext.packet);
//    }
};


/**
 * Expects a complete Intents data store tree returned from the specified href. Data must be of hal/json type and the
 * stored tree must be in the '_embedded' property.
 *
 * @param config {Object}
 * @param config.href {String}
 * @returns {ozpIwc.AsyncAction}
 */
ozpIwc.IntentsApi.prototype.loadServerDataEmbedded = function (config) {
    var self = this;
    var asyncResponse = new ozpIwc.AsyncAction();
    ozpIwc.util.ajax({
        href: config.href,
        method: "GET"
    })
        .success(function (data) {
            // Take the root path from where the intent data is stored so that we can remove it from each object that
            // becomes a intent value.
            var rootPath = data._links.self.href;
            for (var i in data._embedded['ozp:intentTypes']) {
                var type = data._embedded['ozp:intentTypes'][i];
                for (var j in type._embedded['ozp:intentSubTypes']) {
                    var subType = type._embedded['ozp:intentSubTypes'][j];
                    for (var k in subType._embedded['ozp:intentActions']) {
                        var action = subType._embedded['ozp:intentActions'][k];
                        var loadPacket = {
                            packet: {
                                resource: action._links.self.href.replace(rootPath, ''),
                                entity: action
                            }
                        };

                        self.parseResource(loadPacket);
                        var def = self.getDefinition(loadPacket.packet);
                        def.set(loadPacket.packet);
                    }
                }
            }
            asyncResponse.resolve("success");
        });

    return asyncResponse;
};

/**
 * Expects the root of an intents data store to be returned from the specified href. Data must be of hal/json
 * type and the stored tree is gathered through the '_links' property.
 *
 * @param config {Object}
 * @param config.href {String}
 * @returns {ozpIwc.AsyncAction}
 */
ozpIwc.IntentsApi.prototype.loadServerData = function (config) {
    var self = this;
    var asyncResponse = new ozpIwc.AsyncAction();
    var counter = {
        types: {
            total: 0,
            received: 0
        },
        subTypes: {
            total: 0,
            received: 0
        },
        actions: {
            total: 0,
            received: 0
        }
    };
    // Get API root
    ozpIwc.util.ajax({
        href: config.href,
        method: "GET"
    })
        .success(function (data) {
            // Take the root path from where the intent data is stored so that we can remove it from each object that
            // becomes a intent value.
            var rootPath = data._links.self.href;

            counter.types.total += data._links['ozp:intentTypes'].length;
            for (var i in data._links['ozp:intentTypes']) {
                ozpIwc.util.ajax({
                    href: data._links['ozp:intentTypes'][i].href,
                    method: "GET"
                })
                    .success(function (data) {
                        counter.types.received++;
                        // Get subTypes
                        counter.subTypes.total += data._links['ozp:intentSubTypes'].length;
                        for (var j in data._links['ozp:intentSubTypes']) {
                            ozpIwc.util.ajax({
                                href: data._links['ozp:intentSubTypes'][j].href,
                                method: "GET"
                            })
                                .success(function (data) {
                                    counter.subTypes.received++;
                                    //Get Actions
                                    counter.actions.total += data._links['ozp:intentActions'].length;
                                    for (var k in data._links['ozp:intentActions']) {
                                        ozpIwc.util.ajax({
                                            href: data._links['ozp:intentActions'][k].href,
                                            method: "GET"
                                        })
                                            .success(function (data) {

                                                counter.actions.received++;
                                                //Build out the API with the retrieved values
                                                var loadPacket = {
                                                    packet: {
                                                        resource: data._links.self.href.replace(rootPath, ''),
                                                        entity: data
                                                    }
                                                };
                                                self.parseResource(loadPacket);
                                                var def = self.getDefinition(loadPacket.packet);
                                                def.set(loadPacket.packet);
                                                if (counter.actions.received === counter.actions.total &&
                                                    counter.subTypes.received === counter.subTypes.total &&
                                                    counter.types.received == counter.types.total) {
                                                    asyncResponse.resolve("success");
                                                }
                                            });
                                    }
                                });
                        }
                    });
            }
        });
    return asyncResponse;
};

/**
 * The capability value for an intent. adheres to the ozp-intents-type-capabilities-v1+json content type.
 * @class
 * @param {object} config
 *@param {object} config.entity
 * @param {string} config.entity.definitions - the list of definitions in this intent capability.
 */
ozpIwc.IntentsApiCapabilityValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
});

/**
 * Adds a definition to the end of the capability's list of definitions.
 * @param {string} definition - name of the definition added to this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.pushDefinition = function (definition) {
    this.entity.definitions = this.entity.definitions || [];
    this.entity.definitions.push(definition);
    this.version++;
};

/**
 * Adds a definition to the beginning of the capability's list of definitions.
 * @param {string} definition - name of the definition added to this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.unshiftDefinition = function (definition) {
    this.entity.definitions = this.entity.definitions || [];
    this.entity.definitions.unshift(definition);
    this.version++;
};

/**
 * Removes a definition from the end of the capability's list of definitions.
 * @returns {string} definition - name of the definition removed from this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.popDefinition = function () {
    if (this.entity.definitions && this.entity.definitions.length > 0) {
        this.version++;
        return this.entity.definitions.pop();
    }
};

/**
 * Removes a definition from the beginning of the capability's list of definitions.
 * @returns {string} definition - name of the definition removed from this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.shiftDefinition = function () {
    if (this.entity.definitions && this.entity.definitions.length > 0) {
        this.version++;
        return this.entity.definitions.shift();
    }
};

/**
 * Lists all definitions of the given capability.
 * @returns {Array} definitions - list of definitions in this capability.
 */
ozpIwc.IntentsApiCapabilityValue.prototype.listDefinitions = function () {
    return this.entity.definitions;
};
/**
 * The definition value for an intent. adheres to the ozp-intents-definition-v1+json content type.
 * @class
 * @param {object} config
 * @param {object} config.entity
 * @param {string} config.entity.type - the type of this intent definition.
 * @param {string} config.entity.action - the action of this intent definition.
 * @param {string} config.entity.icon - the icon for this intent definition.
 * @param {string} config.entity.label - the label for this intent definition.
 * @param {string} config.entity.handlers - the list of handlers for the definition.
 */
ozpIwc.IntentsApiDefinitionValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
});

/**
 *
 * Adds a handler to the end of the definition's list of handler.
 * @param {string} definition - name of the handler added to this definition.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.pushHandler = function (handler) {
    this.entity.handlers = this.entity.handlers || [];
    this.entity.handlers.push(handler);
    this.version++;
};

/**
 * Adds a handler to the beginning of the definition's list of handler.
 * @param {string} definition - name of the handler added to this definition.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.unshiftHandler = function (handler) {
    this.entity.handlers = this.entity.handlers || [];
    this.entity.handlers.unshift(handler);
    this.version++;
};

/**
 * Removes a handler from the end of the definition's list of handlers.
 * @returns {string} handler - name of the handler removed from this definition.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.popHandler = function () {
    if (this.entity.handlers && this.entity.handlers.length > 0) {
        this.version++;
        return this.entity.handlers.pop();
    }
};

/**
 * Removes a handler from the beginning of the definition's list of handlers.
 * @returns {string} handler - name of the handler removed from this definition.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.shiftHandler = function () {
    if (this.entity.handlers && this.entity.handlers.length > 0) {
        this.version++;
        return this.entity.handlers.shift();
    }
};

/**
 * Lists all handlers of the given intent definition.
 * @returns {Array} handlers - list of handlers in this capability.
 */
ozpIwc.IntentsApiDefinitionValue.prototype.listHandlers = function () {
    return this.entity.handlers;
};
/**
 * The handler value for an intent. adheres to the ozp-intents-handler-v1+json content type.
 * @class
 * @param {object} config
 * @param {object} config.entity
 * @param {string} config.entity.type - the type of this intent handler.
 * @param {string} config.entity.action - the action of this intent handler.
 * @param {string} config.entity.icon - the icon for this intent handler.
 * @param {string} config.entity.label - the label for this intent handler.
 * @param {string} config.entity.invokeIntent - the resource that will be called when handling an invoked intent.
 */
ozpIwc.IntentsApiHandlerValue = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    ozpIwc.CommonApiValue.apply(this, arguments);
});

/**
 * Invokes the handler with the given packet information.
 * @param {object} packet - information passed to the activity receiving the intent.
 */
ozpIwc.IntentsApiHandlerValue.prototype.invoke = function (packet) {
    this.set(packet);
//    console.error('Invoking of intents.api handlers is not implemented.' +
//        'Override ozpIwc.IntentsApiHandlerValue.invoke to implement');
};

ozpIwc.NamesApi = ozpIwc.util.extend(ozpIwc.CommonApiBase, function() {
    ozpIwc.CommonApiBase.apply(this, arguments);
    
    // map the alias "/me" to "/address/{packet.src}" upon receiving the packet
    this.on("receive", function(packetContext) {
        var packet = packetContext.packet;
        if (packet.resource) {
            packet.resource = packet.resource.replace(/\/me/, packetContext.packet.src);
        }
    });
    
    this.addDynamicNode("/address",new ozpIwc.CommonApiCollectionValue({
        pattern: /^\/address\/.*$/,
        contentType: "application/ozpIwc-address-v1+json"
    }));
    this.addDynamicNode("/multicast",new ozpIwc.CommonApiCollectionValue({
        pattern: /^\/multicast\/.*$/,
        contentType: "application/ozpIwc-multicast-address-v1+json"        
    }));
    this.addDynamicNode("/router",new ozpIwc.CommonApiCollectionValue({
        pattern: /^\/router\/.*$/,
        contentType: "application/ozpIwc-router-v1+json"        
    }));
    this.addDynamicNode("/api",new ozpIwc.CommonApiCollectionValue({
        pattern: /^\/api\/.*$/,
        contentType: "application/ozpIwc-api-descriptor-v1+json"        
    }));

});

ozpIwc.NamesApi.prototype.validateResource=function(node,packetContext) {
    if(packetContext.packet.resource && !packetContext.packet.resource.match(/^\/(api|address|multicast|router|me)/)){
        throw new ozpIwc.ApiError('badResource',"Invalide resource for name.api: " + packetContext.packet.resource);
    }
};

ozpIwc.NamesApi.prototype.makeValue = function(packet) {
    
    var path=packet.resource.split("/");
    var config={
        resource: packet.resource,
        contentType: packet.contentType
    };
    
    // only handle the root elements for now...
    switch(path[1]) {
        case "api": config.allowedContentTypes=["application/ozpIwc-api-descriptor-v1+json"]; break;
        case "address": config.allowedContentTypes=["application/ozpIwc-address-v1+json"]; break;
        case "multicast": config.allowedContentTypes=["application/ozpIwc-multicast-address-v1+json"]; break;
        case "router": config.allowedContentTypes=["application/ozpIwc-router-v1+json"]; break;

        default:
            throw new ozpIwc.ApiError("badResource","Not a valid path of names.api: " + path[1] + " in " + packet.resource);
    }
    return new ozpIwc.NamesApiValue(config);            
};

ozpIwc.NamesApiValue = ozpIwc.util.extend(ozpIwc.CommonApiValue,function(config) {
    if(!config || !config.allowedContentTypes) {
        throw new Error("NamesAPIValue must be configured with allowedContentTypes.");
    }
	ozpIwc.CommonApiValue.apply(this,arguments);
});

var ozpIwc=ozpIwc || {};

ozpIwc.SystemApi = ozpIwc.util.extend(ozpIwc.CommonApiBase,function(config) {
    ozpIwc.CommonApiBase.apply(this,arguments);
//    this.participant.securityAttributes=config.securityAttributes;
    if (config.userHref) {
        this.loadServerDataEmbedded({href: config.userHref, resource: '/user'})
            .success(function () {
                //Add on load code here
            });
    }
    if (config.systemHref) {
        this.loadServerDataEmbedded({href: config.systemHref, resource: '/system'})
            .success(function () {
                //Add on load code here
            });
    }
});

ozpIwc.SystemApi.prototype.makeValue = function(packet){
    return new ozpIwc.SystemApiValue({resource: packet.resource, entity: packet.entity, contentType: packet.contentType, systemApi: this});
};

ozpIwc.SystemApi.prototype.isPermitted=function(node,packetContext) {
    var originalNode=node;
    var originalPacketContext=packetContext;
    if (packetContext.packet.action==='set' || packetContext.packet.action==='delete') {
        node.permissions.modifyAuthority='apiLoader';
        if (packetContext.packet.securityAttributes) {
            packetContext.srcSubject=packetContext.srcSubject || {};
            Object.keys(packetContext.packet.securityAttributes).forEach(function(key) {
                packetContext.srcSubject[key]=packetContext.packet.securityAttributes[key];
            });
        }
    } else {
        delete node.permissions.modifyAuthority;
    }
    for (var i in arguments) {
        if (arguments[i] === originalNode) {
            arguments[i]=node;
        } else if (arguments[i] === originalPacketContext) {
            arguments[i]=packetContext;
        }
    }
    var retVal=ozpIwc.CommonApiBase.prototype.isPermitted.apply(this,arguments);
    delete node.permissions.modifyAuthority;
    return retVal
}

/**
 * Loads the user and system data from the specified href. Data must be of hal/json type and
 * the keys 'user' and 'system' in the '_embedded' property must have object values that
 * correspond to user and system, respectively.
 *
 * @param config {Object}
 * @param config.href {String}
 * @returns {ozpIwc.AsyncAction}
 */
ozpIwc.SystemApi.prototype.loadServerDataEmbedded = function (config) {
    var self = this;
    var asyncResponse = new ozpIwc.AsyncAction();
    ozpIwc.util.ajax({
        href: config.href,
        method: "GET"
    })
        .success(function (data) {
            var value=self.findOrMakeValue({'resource': config.resource});
            value.set({entity: data});
            asyncResponse.resolve("success");
        })
        .failure(function(data) {
            console.log("AJAX failure response: " + data)
            asyncResponse.resolve("failure",data);
        });

    return asyncResponse;
};

ozpIwc.SystemApiValue = ozpIwc.util.extend(ozpIwc.CommonApiValue,function(config) {
    ozpIwc.CommonApiValue.apply(this,arguments);
    config=config || {};
    this.systemApi=config.systemApi || ozpIwc.systemApi;
});

ozpIwc.SystemApiValue.prototype.set=function(packet) {
    if(this.isValidContentType(packet.contentType)) {
        this.permissions=packet.permissions || this.permissions;
        this.contentType=packet.contentType;
        if (this.resource) {
            if (this.resource.indexOf('/application') === 0) {
                var id = this.applicationId();
                if (id) {
                    this.entity = packet.entity;
                    var node = this.systemApi.findOrMakeValue({resource: '/application'});
                    node.set({entity: id});
                } else {
                    this.entity = this.entity || [];
                    if (this.entity.indexOf(packet.entity) < 0) {
                        this.entity.push(packet.entity);
                    }
                }
            } else {
                this.entity = packet.entity;
            }
            this.version++;
        }
    }
}

ozpIwc.SystemApiValue.prototype.deleteData=function(packet) {
    if (this.resource) {
        if (this.resource.indexOf('/application') === 0) {
            var id = this.applicationId();
            if (id) {
                var originalEntity=this.entity;
                ozpIwc.CommonApiValue.prototype.deleteData.apply(this,arguments);
                if (originalEntity) {
                    var node = this.systemApi.findOrMakeValue({resource: '/application'});
                    node.deleteData({entity: id})
                }
            } else {
                if (!this.entity) {
                    return;
                }
                var elementRemoved=false;
                this.entity=this.entity.filter(function(element) {
                    var keep=element !== packet.entity;
                    if (!keep) {
                        elementRemoved=true;
                    }
                    this.version=0;
                    return keep;
                });
                if (elementRemoved){
                    var node = this.systemApi.findOrMakeValue({resource: '/application/'+packet.entity});
                    node.deleteData();
                }
            }
        } else {
            ozpIwc.CommonApiValue.prototype.deleteData.apply(this,arguments);
        }
        this.version=0;
    }
};

ozpIwc.SystemApiValue.prototype.applicationId=function() {
    var regexp=/\/application\/(.*)/;
    var res=regexp.exec(this.resource);
    if (res && res.length > 1) {
        return res[1];
    }
    return null;
};


//# sourceMappingURL=ozpIwc-bus.js.map