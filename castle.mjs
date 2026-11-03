var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/react/cjs/react.production.js
var require_react_production = __commonJS({
  "node_modules/react/cjs/react.production.js"(exports) {
    "use strict";
    var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element");
    var REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal");
    var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
    var REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode");
    var REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler");
    var REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer");
    var REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context");
    var REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref");
    var REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense");
    var REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo");
    var REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
    var REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity");
    var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
    function getIteratorFn(maybeIterable) {
      if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
      maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
      return "function" === typeof maybeIterable ? maybeIterable : null;
    }
    var ReactNoopUpdateQueue = {
      isMounted: function() {
        return false;
      },
      enqueueForceUpdate: function() {
      },
      enqueueReplaceState: function() {
      },
      enqueueSetState: function() {
      }
    };
    var assign = Object.assign;
    var emptyObject = {};
    function Component(props, context, updater) {
      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }
    Component.prototype.isReactComponent = {};
    Component.prototype.setState = function(partialState, callback) {
      if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
        throw Error(
          "takes an object of state variables to update or a function which returns an object of state variables."
        );
      this.updater.enqueueSetState(this, partialState, callback, "setState");
    };
    Component.prototype.forceUpdate = function(callback) {
      this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
    };
    function ComponentDummy() {
    }
    ComponentDummy.prototype = Component.prototype;
    function PureComponent(props, context, updater) {
      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }
    var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
    pureComponentPrototype.constructor = PureComponent;
    assign(pureComponentPrototype, Component.prototype);
    pureComponentPrototype.isPureReactComponent = true;
    var isArrayImpl = Array.isArray;
    function noop() {
    }
    var ReactSharedInternals = { H: null, A: null, T: null, S: null };
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function ReactElement(type, key, props) {
      var refProp = props.ref;
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        ref: void 0 !== refProp ? refProp : null,
        props
      };
    }
    function cloneAndReplaceKey(oldElement, newKey) {
      return ReactElement(oldElement.type, newKey, oldElement.props);
    }
    function isValidElement(object) {
      return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    function escape(key) {
      var escaperLookup = { "=": "=0", ":": "=2" };
      return "$" + key.replace(/[=:]/g, function(match) {
        return escaperLookup[match];
      });
    }
    var userProvidedKeyEscapeRegex = /\/+/g;
    function getElementKey(element, index) {
      return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
    }
    function resolveThenable(thenable) {
      switch (thenable.status) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw thenable.reason;
        default:
          switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
            function(fulfilledValue) {
              "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
            },
            function(error) {
              "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
            }
          )), thenable.status) {
            case "fulfilled":
              return thenable.value;
            case "rejected":
              throw thenable.reason;
          }
      }
      throw thenable;
    }
    function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
      var type = typeof children;
      if ("undefined" === type || "boolean" === type) children = null;
      var invokeCallback = false;
      if (null === children) invokeCallback = true;
      else
        switch (type) {
          case "bigint":
          case "string":
          case "number":
            invokeCallback = true;
            break;
          case "object":
            switch (children.$$typeof) {
              case REACT_ELEMENT_TYPE:
              case REACT_PORTAL_TYPE:
                invokeCallback = true;
                break;
              case REACT_LAZY_TYPE:
                return invokeCallback = children._init, mapIntoArray(
                  invokeCallback(children._payload),
                  array,
                  escapedPrefix,
                  nameSoFar,
                  callback
                );
            }
        }
      if (invokeCallback)
        return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
          return c;
        })) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(
          callback,
          escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(
            userProvidedKeyEscapeRegex,
            "$&/"
          ) + "/") + invokeCallback
        )), array.push(callback)), 1;
      invokeCallback = 0;
      var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
      if (isArrayImpl(children))
        for (var i = 0; i < children.length; i++)
          nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
            nameSoFar,
            array,
            escapedPrefix,
            type,
            callback
          );
      else if (i = getIteratorFn(children), "function" === typeof i)
        for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
          nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
            nameSoFar,
            array,
            escapedPrefix,
            type,
            callback
          );
      else if ("object" === type) {
        if ("function" === typeof children.then)
          return mapIntoArray(
            resolveThenable(children),
            array,
            escapedPrefix,
            nameSoFar,
            callback
          );
        array = String(children);
        throw Error(
          "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
        );
      }
      return invokeCallback;
    }
    function mapChildren(children, func, context) {
      if (null == children) return children;
      var result = [], count = 0;
      mapIntoArray(children, result, "", "", function(child) {
        return func.call(context, child, count++);
      });
      return result;
    }
    function lazyInitializer(payload) {
      if (-1 === payload._status) {
        var ctor = payload._result;
        ctor = ctor();
        ctor.then(
          function(moduleObject) {
            if (0 === payload._status || -1 === payload._status)
              payload._status = 1, payload._result = moduleObject;
          },
          function(error) {
            if (0 === payload._status || -1 === payload._status)
              payload._status = 2, payload._result = error;
          }
        );
        -1 === payload._status && (payload._status = 0, payload._result = ctor);
      }
      if (1 === payload._status) return payload._result.default;
      throw payload._result;
    }
    var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
      if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
        var event = new window.ErrorEvent("error", {
          bubbles: true,
          cancelable: true,
          message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
          error
        });
        if (!window.dispatchEvent(event)) return;
      } else if ("object" === typeof process && "function" === typeof process.emit) {
        process.emit("uncaughtException", error);
        return;
      }
      console.error(error);
    };
    var Children = {
      map: mapChildren,
      forEach: function(children, forEachFunc, forEachContext) {
        mapChildren(
          children,
          function() {
            forEachFunc.apply(this, arguments);
          },
          forEachContext
        );
      },
      count: function(children) {
        var n = 0;
        mapChildren(children, function() {
          n++;
        });
        return n;
      },
      toArray: function(children) {
        return mapChildren(children, function(child) {
          return child;
        }) || [];
      },
      only: function(children) {
        if (!isValidElement(children))
          throw Error(
            "React.Children.only expected to receive a single React element child."
          );
        return children;
      }
    };
    exports.Activity = REACT_ACTIVITY_TYPE;
    exports.Children = Children;
    exports.Component = Component;
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.Profiler = REACT_PROFILER_TYPE;
    exports.PureComponent = PureComponent;
    exports.StrictMode = REACT_STRICT_MODE_TYPE;
    exports.Suspense = REACT_SUSPENSE_TYPE;
    exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
    exports.__COMPILER_RUNTIME = {
      __proto__: null,
      c: function(size) {
        return ReactSharedInternals.H.useMemoCache(size);
      }
    };
    exports.cache = function(fn) {
      return function() {
        return fn.apply(null, arguments);
      };
    };
    exports.cacheSignal = function() {
      return null;
    };
    exports.cloneElement = function(element, config, children) {
      if (null === element || void 0 === element)
        throw Error(
          "The argument must be a React element, but you passed " + element + "."
        );
      var props = assign({}, element.props), key = element.key;
      if (null != config)
        for (propName in void 0 !== config.key && (key = "" + config.key), config)
          !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
      var propName = arguments.length - 2;
      if (1 === propName) props.children = children;
      else if (1 < propName) {
        for (var childArray = Array(propName), i = 0; i < propName; i++)
          childArray[i] = arguments[i + 2];
        props.children = childArray;
      }
      return ReactElement(element.type, key, props);
    };
    exports.createContext = function(defaultValue) {
      defaultValue = {
        $$typeof: REACT_CONTEXT_TYPE,
        _currentValue: defaultValue,
        _currentValue2: defaultValue,
        _threadCount: 0,
        Provider: null,
        Consumer: null
      };
      defaultValue.Provider = defaultValue;
      defaultValue.Consumer = {
        $$typeof: REACT_CONSUMER_TYPE,
        _context: defaultValue
      };
      return defaultValue;
    };
    exports.createElement = function(type, config, children) {
      var propName, props = {}, key = null;
      if (null != config)
        for (propName in void 0 !== config.key && (key = "" + config.key), config)
          hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
      var childrenLength = arguments.length - 2;
      if (1 === childrenLength) props.children = children;
      else if (1 < childrenLength) {
        for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++)
          childArray[i] = arguments[i + 2];
        props.children = childArray;
      }
      if (type && type.defaultProps)
        for (propName in childrenLength = type.defaultProps, childrenLength)
          void 0 === props[propName] && (props[propName] = childrenLength[propName]);
      return ReactElement(type, key, props);
    };
    exports.createRef = function() {
      return { current: null };
    };
    exports.forwardRef = function(render) {
      return { $$typeof: REACT_FORWARD_REF_TYPE, render };
    };
    exports.isValidElement = isValidElement;
    exports.lazy = function(ctor) {
      return {
        $$typeof: REACT_LAZY_TYPE,
        _payload: { _status: -1, _result: ctor },
        _init: lazyInitializer
      };
    };
    exports.memo = function(type, compare) {
      return {
        $$typeof: REACT_MEMO_TYPE,
        type,
        compare: void 0 === compare ? null : compare
      };
    };
    exports.startTransition = function(scope) {
      var prevTransition = ReactSharedInternals.T, currentTransition = {};
      ReactSharedInternals.T = currentTransition;
      try {
        var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
        null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
        "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop, reportGlobalError);
      } catch (error) {
        reportGlobalError(error);
      } finally {
        null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
      }
    };
    exports.unstable_useCacheRefresh = function() {
      return ReactSharedInternals.H.useCacheRefresh();
    };
    exports.use = function(usable) {
      return ReactSharedInternals.H.use(usable);
    };
    exports.useActionState = function(action, initialState, permalink) {
      return ReactSharedInternals.H.useActionState(action, initialState, permalink);
    };
    exports.useCallback = function(callback, deps) {
      return ReactSharedInternals.H.useCallback(callback, deps);
    };
    exports.useContext = function(Context) {
      return ReactSharedInternals.H.useContext(Context);
    };
    exports.useDebugValue = function() {
    };
    exports.useDeferredValue = function(value, initialValue) {
      return ReactSharedInternals.H.useDeferredValue(value, initialValue);
    };
    exports.useEffect = function(create, deps) {
      return ReactSharedInternals.H.useEffect(create, deps);
    };
    exports.useEffectEvent = function(callback) {
      return ReactSharedInternals.H.useEffectEvent(callback);
    };
    exports.useId = function() {
      return ReactSharedInternals.H.useId();
    };
    exports.useImperativeHandle = function(ref, create, deps) {
      return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
    };
    exports.useInsertionEffect = function(create, deps) {
      return ReactSharedInternals.H.useInsertionEffect(create, deps);
    };
    exports.useLayoutEffect = function(create, deps) {
      return ReactSharedInternals.H.useLayoutEffect(create, deps);
    };
    exports.useMemo = function(create, deps) {
      return ReactSharedInternals.H.useMemo(create, deps);
    };
    exports.useOptimistic = function(passthrough, reducer) {
      return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
    };
    exports.useReducer = function(reducer, initialArg, init) {
      return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
    };
    exports.useRef = function(initialValue) {
      return ReactSharedInternals.H.useRef(initialValue);
    };
    exports.useState = function(initialState) {
      return ReactSharedInternals.H.useState(initialState);
    };
    exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
      return ReactSharedInternals.H.useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
      );
    };
    exports.useTransition = function() {
      return ReactSharedInternals.H.useTransition();
    };
    exports.version = "19.2.6";
  }
});

// node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "node_modules/react/cjs/react.development.js"(exports, module) {
    "use strict";
    "production" !== process.env.NODE_ENV && (function() {
      function defineDeprecationWarning(methodName, info) {
        Object.defineProperty(Component.prototype, methodName, {
          get: function() {
            console.warn(
              "%s(...) is deprecated in plain JavaScript React classes. %s",
              info[0],
              info[1]
            );
          }
        });
      }
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable)
          return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      function warnNoop(publicInstance, callerName) {
        publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
        var warningKey = publicInstance + "." + callerName;
        didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
          "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
          callerName,
          publicInstance
        ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
      }
      function Component(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function ComponentDummy() {
      }
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function noop() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        newKey = ReactElement(
          oldElement.type,
          newKey,
          oldElement.props,
          oldElement._owner,
          oldElement._debugStack,
          oldElement._debugTask
        );
        oldElement._store && (newKey._store.validated = oldElement._store.validated);
        return newKey;
      }
      function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = true;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback) {
          invokeCallback = children;
          callback = callback(invokeCallback);
          var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
          isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          })) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
            callback,
            escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + childKey
          ), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
          return 1;
        }
        invokeCallback = 0;
        childKey = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), "function" === typeof i)
          for (i === children.entries && (didWarnAboutMaps || console.warn(
            "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
          ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if ("object" === type) {
          if ("function" === typeof children.then)
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          array = String(children);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var ioInfo = payload._ioInfo;
          null != ioInfo && (ioInfo.start = ioInfo.end = performance.now());
          ioInfo = payload._result;
          var thenable = ioInfo();
          thenable.then(
            function(moduleObject) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 1;
                payload._result = moduleObject;
                var _ioInfo = payload._ioInfo;
                null != _ioInfo && (_ioInfo.end = performance.now());
                void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
              }
            },
            function(error) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 2;
                payload._result = error;
                var _ioInfo2 = payload._ioInfo;
                null != _ioInfo2 && (_ioInfo2.end = performance.now());
                void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            }
          );
          ioInfo = payload._ioInfo;
          if (null != ioInfo) {
            ioInfo.value = thenable;
            var displayName = thenable.displayName;
            "string" === typeof displayName && (ioInfo.name = displayName);
          }
          -1 === payload._status && (payload._status = 0, payload._result = thenable);
        }
        if (1 === payload._status)
          return ioInfo = payload._result, void 0 === ioInfo && console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
            ioInfo
          ), "default" in ioInfo || console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
            ioInfo
          ), ioInfo.default;
        throw payload._result;
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
        );
        return dispatcher;
      }
      function releaseAsyncTransition() {
        ReactSharedInternals.asyncTransitions--;
      }
      function enqueueTask(task) {
        if (null === enqueueTaskImpl)
          try {
            var requireString = ("require" + Math.random()).slice(0, 7);
            enqueueTaskImpl = (module && module[requireString]).call(
              module,
              "timers"
            ).setImmediate;
          } catch (_err) {
            enqueueTaskImpl = function(callback) {
              false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
              ));
              var channel = new MessageChannel();
              channel.port1.onmessage = callback;
              channel.port2.postMessage(void 0);
            };
          }
        return enqueueTaskImpl(task);
      }
      function aggregateErrors(errors) {
        return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
      }
      function popActScope(prevActQueue, prevActScopeDepth) {
        prevActScopeDepth !== actScopeDepth - 1 && console.error(
          "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
        );
        actScopeDepth = prevActScopeDepth;
      }
      function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
        var queue = ReactSharedInternals.actQueue;
        if (null !== queue)
          if (0 !== queue.length)
            try {
              flushActQueue(queue);
              enqueueTask(function() {
                return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
              });
              return;
            } catch (error) {
              ReactSharedInternals.thrownErrors.push(error);
            }
          else ReactSharedInternals.actQueue = null;
        0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
      }
      function flushActQueue(queue) {
        if (!isFlushing) {
          isFlushing = true;
          var i = 0;
          try {
            for (; i < queue.length; i++) {
              var callback = queue[i];
              do {
                ReactSharedInternals.didUsePromise = false;
                var continuation = callback(false);
                if (null !== continuation) {
                  if (ReactSharedInternals.didUsePromise) {
                    queue[i] = callback;
                    queue.splice(0, i);
                    return;
                  }
                  callback = continuation;
                } else break;
              } while (1);
            }
            queue.length = 0;
          } catch (error) {
            queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
          } finally {
            isFlushing = false;
          }
        }
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function(publicInstance) {
          warnNoop(publicInstance, "forceUpdate");
        },
        enqueueReplaceState: function(publicInstance) {
          warnNoop(publicInstance, "replaceState");
        },
        enqueueSetState: function(publicInstance) {
          warnNoop(publicInstance, "setState");
        }
      }, assign = Object.assign, emptyObject = {};
      Object.freeze(emptyObject);
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      var deprecatedAPIs = {
        isMounted: [
          "isMounted",
          "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
        ],
        replaceState: [
          "replaceState",
          "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
        ]
      };
      for (fnName in deprecatedAPIs)
        deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
      ComponentDummy.prototype = Component.prototype;
      deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
      deprecatedAPIs.constructor = PureComponent;
      assign(deprecatedAPIs, Component.prototype);
      deprecatedAPIs.isPureReactComponent = true;
      var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = {
        H: null,
        A: null,
        T: null,
        S: null,
        actQueue: null,
        asyncTransitions: 0,
        isBatchingLegacy: false,
        didScheduleLegacyUpdate: false,
        didUsePromise: false,
        thrownErrors: [],
        getCurrentStack: null,
        recentlyCreatedOwnerStacks: 0
      }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      deprecatedAPIs = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(
        deprecatedAPIs,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
        queueMicrotask(function() {
          return queueMicrotask(callback);
        });
      } : enqueueTask;
      deprecatedAPIs = Object.freeze({
        __proto__: null,
        c: function(size) {
          return resolveDispatcher().useMemoCache(size);
        }
      });
      var fnName = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports.Activity = REACT_ACTIVITY_TYPE;
      exports.Children = fnName;
      exports.Component = Component;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports.__COMPILER_RUNTIME = deprecatedAPIs;
      exports.act = function(callback) {
        var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
        actScopeDepth++;
        var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
        try {
          var result = callback();
        } catch (error) {
          ReactSharedInternals.thrownErrors.push(error);
        }
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        if (null !== result && "object" === typeof result && "function" === typeof result.then) {
          var thenable = result;
          queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
            ));
          });
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              thenable.then(
                function(returnValue) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  if (0 === prevActScopeDepth) {
                    try {
                      flushActQueue(queue), enqueueTask(function() {
                        return recursivelyFlushAsyncActWork(
                          returnValue,
                          resolve,
                          reject
                        );
                      });
                    } catch (error$0) {
                      ReactSharedInternals.thrownErrors.push(error$0);
                    }
                    if (0 < ReactSharedInternals.thrownErrors.length) {
                      var _thrownError = aggregateErrors(
                        ReactSharedInternals.thrownErrors
                      );
                      ReactSharedInternals.thrownErrors.length = 0;
                      reject(_thrownError);
                    }
                  } else resolve(returnValue);
                },
                function(error) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(
                    ReactSharedInternals.thrownErrors
                  ), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
                }
              );
            }
          };
        }
        var returnValue$jscomp$0 = result;
        popActScope(prevActQueue, prevActScopeDepth);
        0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
          didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
            "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
          ));
        }), ReactSharedInternals.actQueue = null);
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        return {
          then: function(resolve, reject) {
            didAwaitActCall = true;
            0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
              return recursivelyFlushAsyncActWork(
                returnValue$jscomp$0,
                resolve,
                reject
              );
            })) : resolve(returnValue$jscomp$0);
          }
        };
      };
      exports.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports.cacheSignal = function() {
        return null;
      };
      exports.captureOwnerStack = function() {
        var getCurrentStack = ReactSharedInternals.getCurrentStack;
        return null === getCurrentStack ? null : getCurrentStack();
      };
      exports.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key = element.key, owner = element._owner;
        if (null != config) {
          var JSCompiler_inline_result;
          a: {
            if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
              config,
              "ref"
            ).get) && JSCompiler_inline_result.isReactWarning) {
              JSCompiler_inline_result = false;
              break a;
            }
            JSCompiler_inline_result = void 0 !== config.ref;
          }
          JSCompiler_inline_result && (owner = getOwner());
          hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
          for (propName in config)
            !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        }
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          JSCompiler_inline_result = Array(propName);
          for (var i = 0; i < propName; i++)
            JSCompiler_inline_result[i] = arguments[i + 2];
          props.children = JSCompiler_inline_result;
        }
        props = ReactElement(
          element.type,
          key,
          props,
          owner,
          element._debugStack,
          element._debugTask
        );
        for (key = 2; key < arguments.length; key++)
          validateChildKeys(arguments[key]);
        return props;
      };
      exports.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        defaultValue._currentRenderer = null;
        defaultValue._currentRenderer2 = null;
        return defaultValue;
      };
      exports.createElement = function(type, config, children) {
        for (var i = 2; i < arguments.length; i++)
          validateChildKeys(arguments[i]);
        i = {};
        var key = null;
        if (null != config)
          for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
            "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
          )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
            hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) i.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
            childArray[_i] = arguments[_i + 2];
          Object.freeze && Object.freeze(childArray);
          i.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            void 0 === i[propName] && (i[propName] = childrenLength[propName]);
        key && defineKeyPropWarningGetter(
          i,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        var propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return ReactElement(
          type,
          key,
          i,
          getOwner(),
          propName ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports.createRef = function() {
        var refObject = { current: null };
        Object.seal(refObject);
        return refObject;
      };
      exports.forwardRef = function(render) {
        null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error(
          "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
        ) : "function" !== typeof render ? console.error(
          "forwardRef requires a render function but was given %s.",
          null === render ? "null" : typeof render
        ) : 0 !== render.length && 2 !== render.length && console.error(
          "forwardRef render functions accept exactly two parameters: props and ref. %s",
          1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
        );
        null != render && null != render.defaultProps && console.error(
          "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
        );
        var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
        Object.defineProperty(elementType, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
          }
        });
        return elementType;
      };
      exports.isValidElement = isValidElement;
      exports.lazy = function(ctor) {
        ctor = { _status: -1, _result: ctor };
        var lazyType = {
          $$typeof: REACT_LAZY_TYPE,
          _payload: ctor,
          _init: lazyInitializer
        }, ioInfo = {
          name: "lazy",
          start: -1,
          end: -1,
          value: null,
          owner: null,
          debugStack: Error("react-stack-top-frame"),
          debugTask: console.createTask ? console.createTask("lazy()") : null
        };
        ctor._ioInfo = ioInfo;
        lazyType._debugInfo = [{ awaited: ioInfo }];
        return lazyType;
      };
      exports.memo = function(type, compare) {
        null == type && console.error(
          "memo: The first argument must be a component. Instead received: %s",
          null === type ? "null" : typeof type
        );
        compare = {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
        var ownName;
        Object.defineProperty(compare, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
          }
        });
        return compare;
      };
      exports.startTransition = function(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition._updatedFibers = /* @__PURE__ */ new Set();
        ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
        } catch (error) {
          reportGlobalError(error);
        } finally {
          null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
            "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
          )), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
            "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
          ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      };
      exports.unstable_useCacheRefresh = function() {
        return resolveDispatcher().useCacheRefresh();
      };
      exports.use = function(usable) {
        return resolveDispatcher().use(usable);
      };
      exports.useActionState = function(action, initialState, permalink) {
        return resolveDispatcher().useActionState(
          action,
          initialState,
          permalink
        );
      };
      exports.useCallback = function(callback, deps) {
        return resolveDispatcher().useCallback(callback, deps);
      };
      exports.useContext = function(Context) {
        var dispatcher = resolveDispatcher();
        Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
          "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
        );
        return dispatcher.useContext(Context);
      };
      exports.useDebugValue = function(value, formatterFn) {
        return resolveDispatcher().useDebugValue(value, formatterFn);
      };
      exports.useDeferredValue = function(value, initialValue) {
        return resolveDispatcher().useDeferredValue(value, initialValue);
      };
      exports.useEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useEffect(create, deps);
      };
      exports.useEffectEvent = function(callback) {
        return resolveDispatcher().useEffectEvent(callback);
      };
      exports.useId = function() {
        return resolveDispatcher().useId();
      };
      exports.useImperativeHandle = function(ref, create, deps) {
        return resolveDispatcher().useImperativeHandle(ref, create, deps);
      };
      exports.useInsertionEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useInsertionEffect(create, deps);
      };
      exports.useLayoutEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useLayoutEffect(create, deps);
      };
      exports.useMemo = function(create, deps) {
        return resolveDispatcher().useMemo(create, deps);
      };
      exports.useOptimistic = function(passthrough, reducer) {
        return resolveDispatcher().useOptimistic(passthrough, reducer);
      };
      exports.useReducer = function(reducer, initialArg, init) {
        return resolveDispatcher().useReducer(reducer, initialArg, init);
      };
      exports.useRef = function(initialValue) {
        return resolveDispatcher().useRef(initialValue);
      };
      exports.useState = function(initialState) {
        return resolveDispatcher().useState(initialState);
      };
      exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return resolveDispatcher().useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports.useTransition = function() {
        return resolveDispatcher().useTransition();
      };
      exports.version = "19.2.6";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// node_modules/react/index.js
var require_react = __commonJS({
  "node_modules/react/index.js"(exports, module) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module.exports = require_react_production();
    } else {
      module.exports = require_react_development();
    }
  }
});

// node_modules/react/cjs/react-jsx-runtime.production.js
var require_react_jsx_runtime_production = __commonJS({
  "node_modules/react/cjs/react-jsx-runtime.production.js"(exports) {
    "use strict";
    var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element");
    var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
    function jsxProd(type, config, maybeKey) {
      var key = null;
      void 0 !== maybeKey && (key = "" + maybeKey);
      void 0 !== config.key && (key = "" + config.key);
      if ("key" in config) {
        maybeKey = {};
        for (var propName in config)
          "key" !== propName && (maybeKey[propName] = config[propName]);
      } else maybeKey = config;
      config = maybeKey.ref;
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        ref: void 0 !== config ? config : null,
        props: maybeKey
      };
    }
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsx = jsxProd;
    exports.jsxs = jsxProd;
  }
});

// node_modules/react/cjs/react-jsx-runtime.development.js
var require_react_jsx_runtime_development = __commonJS({
  "node_modules/react/cjs/react-jsx-runtime.development.js"(exports) {
    "use strict";
    "production" !== process.env.NODE_ENV && (function() {
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children)
          if (isStaticChildren)
            if (isArrayImpl(children)) {
              for (isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)
                validateChildKeys(children[isStaticChildren]);
              Object.freeze && Object.freeze(children);
            } else
              console.error(
                "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
              );
          else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
          children = getComponentNameFromType(type);
          var keys = Object.keys(config).filter(function(k) {
            return "key" !== k;
          });
          isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
          didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error(
            'A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />',
            isStaticChildren,
            children,
            keys,
            children
          ), didWarnAboutKeySpread[children + isStaticChildren] = true);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
          maybeKey = {};
          for (var propName in config)
            "key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(
          maybeKey,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        return ReactElement(
          type,
          children,
          maybeKey,
          getOwner(),
          debugStack,
          debugTask
        );
      }
      function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      var React = require_react(), REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      React = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(
        React,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutKeySpread = {};
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.jsx = function(type, config, maybeKey) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(
          type,
          config,
          maybeKey,
          false,
          trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports.jsxs = function(type, config, maybeKey) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(
          type,
          config,
          maybeKey,
          true,
          trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
    })();
  }
});

// node_modules/react/jsx-runtime.js
var require_jsx_runtime = __commonJS({
  "node_modules/react/jsx-runtime.js"(exports, module) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module.exports = require_react_jsx_runtime_production();
    } else {
      module.exports = require_react_jsx_runtime_development();
    }
  }
});

// src/components/GameCanvas.tsx
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function GameCanvas({
  w,
  h,
  setup,
  paused,
  className = ""
}) {
  const wrap = (0, import_react.useRef)(null);
  const canvas = (0, import_react.useRef)(null);
  const logic = (0, import_react.useRef)(null);
  const setupRef = (0, import_react.useRef)(setup);
  setupRef.current = setup;
  const [scale, setScale] = (0, import_react.useState)(1);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const s = Math.min(r.width / w, r.height / h);
      if (!Number.isFinite(s) || s <= 0) return;
      const next = Math.max(0.5, s >= 2 ? Math.floor(s * 4) / 4 : s);
      setScale((prev) => Math.abs(prev - next) < 0.01 ? prev : next);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);
  (0, import_react.useEffect)(() => {
    const cv = canvas.current;
    if (!cv) return;
    let ctx2 = null;
    try {
      ctx2 = cv.getContext("2d");
    } catch {
      ctx2 = null;
    }
    if (!ctx2) {
      setError("Canvas 2D context is unavailable on this device.");
      return;
    }
    ctx2.imageSmoothingEnabled = false;
    const keys = /* @__PURE__ */ new Set();
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keys.add(k);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    };
    const ku = (e) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    let lg = null;
    try {
      lg = setupRef.current({ ctx: ctx2, w, h, keys });
      logic.current = lg;
    } catch (err) {
      setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
      return () => {
        window.removeEventListener("keydown", kd);
        window.removeEventListener("keyup", ku);
      };
    }
    let raf = 0;
    let last = performance.now();
    let failed = false;
    const loop = (now) => {
      if (failed) return;
      const dt = Math.min(0.05, (now - last) / 1e3);
      last = now;
      try {
        if (!paused?.current) lg.update(dt);
        lg.draw();
      } catch (err) {
        failed = true;
        setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      try {
        lg?.dispose?.();
      } catch {
      }
      logic.current = null;
    };
  }, [w, h]);
  const pos = (e) => {
    const c = canvas.current;
    const r = c.getBoundingClientRect();
    return [(e.clientX - r.left) * w / r.width, (e.clientY - r.top) * h / r.height];
  };
  const guard = (fn) => {
    try {
      fn();
    } catch (err) {
      setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref: wrap, className: `relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "canvas",
      {
        ref: canvas,
        width: w,
        height: h,
        style: { width: Math.round(w * scale), height: Math.round(h * scale), touchAction: "none" },
        onPointerDown: (e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const [x, y] = pos(e);
          guard(() => logic.current?.down?.(x, y, e.pointerId));
        },
        onPointerMove: (e) => {
          const [x, y] = pos(e);
          guard(() => logic.current?.move?.(x, y, e.pointerId));
        },
        onPointerUp: (e) => {
          const [x, y] = pos(e);
          guard(() => logic.current?.up?.(x, y, e.pointerId));
        },
        onPointerCancel: (e) => {
          const [x, y] = pos(e);
          guard(() => logic.current?.up?.(x, y, e.pointerId));
        }
      }
    ),
    error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 z-10 flex items-center justify-center village-bg/95 p-4 text-center", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "max-w-full border-4 border-[#4a2d1c] bg-[#d9453b] p-3 text-lg leading-5 text-white", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mb-1 text-2xl", children: "X\u0259ta / Error" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "break-words", children: error })
    ] }) })
  ] });
}

// src/game/store.ts
var import_react2 = __toESM(require_react(), 1);

// src/game/data.ts
var START_BUILDINGS = ["home", "farm", "square", "arcade", "school", "shop"];
var CROPS = {
  wheat: { grow: 45, price: 8, sell: 6, yield: 2, icon: "wheat" },
  carrot: { grow: 90, price: 14, sell: 10, yield: 2, icon: "carrot" },
  pumpkin: { grow: 180, price: 26, sell: 18, yield: 2, icon: "pumpkin" }
};
var CROP_IDS = Object.keys(CROPS);
var DECOR = {
  plant: { price: 45 },
  clock: { price: 55 },
  picture: { price: 65 },
  flower: { price: 80 },
  lamp: { price: 95 },
  shelf: { price: 120 },
  rug: { price: 150 },
  tv: { price: 180 },
  guitar: { price: 220 },
  bird: { price: 260 },
  cat: { price: 300 },
  dog: { price: 380 }
};
var DECOR_IDS = Object.keys(DECOR);
var DECOR_SLOTS = 8;
var SKINS = {
  player: { gender: "neutral", price: 0 },
  hero: { gender: "boy", price: 150 },
  ranger: { gender: "boy", price: 240 },
  astro: { gender: "neutral", price: 360 },
  gardener: { gender: "girl", price: 170 },
  student: { gender: "girl", price: 210 },
  star: { gender: "girl", price: 450 }
};
var SKIN_IDS = Object.keys(SKINS);
var MAX_PLOTS = 9;
var START_PLOTS = 4;

// src/game/save.ts
var SAVE_KEY = "retro_kend_save_v1";
var SAVE_VERSION = 1;
function defaultSave() {
  const mg = () => ({ personal_best: 0, plays: 0, last_score: 0 });
  return {
    version: SAVE_VERSION,
    player_name: "",
    player_skin: "player",
    owned_skins: ["player"],
    coins: 35,
    unlocked_buildings: [...START_BUILDINGS],
    inventory: { seeds: { wheat: 3, carrot: 0, pumpkin: 0 }, crops: {}, goods: {} },
    decorations: { owned: [], placed: Array.from({ length: DECOR_SLOTS }, () => null) },
    farm: {
      plot_count: START_PLOTS,
      plots: Array.from({ length: MAX_PLOTS }, () => null),
      animals: []
    },
    daily_quests: [],
    weekly_quests: [],
    mini_games: {
      maze: mg(),
      blocks: mg(),
      shooter: mg(),
      cave: mg(),
      cafe: mg(),
      snake: mg(),
      climb: mg(),
      rhythm: mg(),
      fish: mg(),
      castle: mg(),
      apples: mg(),
      car: mg(),
      bird: mg()
    },
    festival_best_score: 0,
    festival_last_score: 0,
    festival_runs: 0,
    last_daily_reset: "",
    last_weekly_reset: "",
    selected_language: "en",
    control_mode: "fixed",
    game_length: "medium",
    audio: { music: true, sfx: true, volume: 0.7 },
    stats: { planted: 0, harvested: 0, purchases: 0, sold: 0, played: 0 },
    onboarded: false,
    tip_seen: false
  };
}
function isObj(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}
function mergeDefaults(def, data) {
  if (Array.isArray(def)) return Array.isArray(data) ? data : def;
  if (isObj(def)) {
    const src = isObj(data) ? data : {};
    const out = {};
    for (const k of Object.keys(def)) {
      out[k] = k in src ? mergeDefaults(def[k], src[k]) : deepClone(def[k]);
    }
    for (const k of Object.keys(src)) if (!(k in out)) out[k] = src[k];
    return out;
  }
  if (typeof data === typeof def) {
    if (typeof def === "number" && !Number.isFinite(data)) return def;
    return data;
  }
  return def;
}
function sanitize(d) {
  d.coins = Math.max(0, Math.floor(d.coins));
  d.farm.plot_count = Math.min(MAX_PLOTS, Math.max(START_PLOTS, d.farm.plot_count));
  while (d.farm.plots.length < MAX_PLOTS) d.farm.plots.push(null);
  while (d.decorations.placed.length < DECOR_SLOTS) d.decorations.placed.push(null);
  if (!["az", "tr", "en", "ru"].includes(d.selected_language)) d.selected_language = "en";
  if (!["fixed", "free", "buttons"].includes(d.control_mode)) d.control_mode = "fixed";
  if (!["short", "medium", "long", "endless"].includes(d.game_length)) d.game_length = "medium";
  if (!d.owned_skins.includes("player")) d.owned_skins.push("player");
  if (!d.owned_skins.includes(d.player_skin)) d.player_skin = "player";
  for (const b of START_BUILDINGS) if (!d.unlocked_buildings.includes(b)) d.unlocked_buildings.push(b);
  d.audio.volume = Math.min(1, Math.max(0, d.audio.volume));
  return d;
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { data: defaultSave(), recovered: false };
    const parsed = JSON.parse(raw);
    if (!isObj(parsed)) return { data: defaultSave(), recovered: true };
    return { data: sanitize(mergeDefaults(defaultSave(), parsed)), recovered: false };
  } catch {
    return { data: defaultSave(), recovered: true };
  }
}

// src/game/store.ts
var loaded = loadGame();
var state = loaded.data;
var saveWasRecovered = loaded.recovered;
function getState() {
  return state;
}

// src/game/assets.ts
var ART = {
  player: null,
  icons: /* @__PURE__ */ new Map(),
  hero: null,
  bats: [],
  obstacles: null,
  caveStrip: null,
  caveBg: null,
  rooms: {},
  villageBg: null
};

// src/game/sprites.ts
var PAL = {
  k: "#4a2d1c",
  // warm dark-wood ink: universal outline colour for every sprite and icon
  w: "#f6f1e4",
  h: "#e3d2a4",
  e: "#b9b4a8",
  E: "#6f6a6f",
  g: "#7fcf3a",
  G: "#3e8948",
  D: "#265c42",
  y: "#fbd54a",
  Y: "#e8a317",
  o: "#ef8f3a",
  O: "#c96a1e",
  r: "#d9453b",
  R: "#8f2d3b",
  m: "#f48fb1",
  M: "#b8497a",
  b: "#4a90d9",
  B: "#2f5aa8",
  c: "#7fd6e8",
  t: "#3fb8a8",
  T: "#207a7a",
  n: "#9a6b3f",
  N: "#5e3b26",
  s: "#f2c9a0",
  S: "#c98a62",
  p: "#b86fc6",
  P: "#6b3f8f"
};
function mk(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
function outlineCanvas(src, color = PAL.k) {
  const w = src.width + 2;
  const h = src.height + 2;
  const dst = mk(w, h);
  const g = dst.getContext("2d");
  g.drawImage(src, 1, 1);
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  const hex = parseInt(color.slice(1), 16);
  const cr = hex >> 16 & 255;
  const cg = hex >> 8 & 255;
  const cb = hex & 255;
  const marks = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) marks.push((y * w + x) * 4);
    }
  }
  for (const i of marks) {
    d[i] = cr;
    d[i + 1] = cg;
    d[i + 2] = cb;
    d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return dst;
}
var LOOKS = {
  player: { hair: "#2b2438", hairStyle: "short", skin: PAL.s, shirt: PAL.t, shirtDark: PAL.T, pants: PAL.n, boots: PAL.N, bag: true },
  teacher: { hair: PAL.E, hairStyle: "bun", skin: PAL.s, shirt: PAL.p, shirtDark: PAL.P, pants: "#3a3670", boots: PAL.k, glasses: true, prop: "notebook" },
  cafe: { hair: PAL.O, hairStyle: "long", skin: PAL.S, shirt: PAL.w, shirtDark: PAL.e, pants: "#3a3670", boots: PAL.N, apron: PAL.r, prop: "tray" },
  elder: { hair: PAL.w, hairStyle: "bald", skin: PAL.S, shirt: PAL.n, shirtDark: PAL.N, pants: PAL.E, boots: PAL.N, prop: "stick" },
  shepherd: { hair: PAL.N, hairStyle: "short", skin: PAL.s, shirt: PAL.G, shirtDark: PAL.D, pants: PAL.N, boots: PAL.k, hat: PAL.Y, hatBand: PAL.r, prop: "basket" },
  shopkeeper: { hair: "#2b2438", hairStyle: "short", skin: PAL.S, shirt: PAL.w, shirtDark: PAL.e, pants: PAL.N, boots: PAL.k, vest: PAL.B, prop: "pouch" },
  // ---- player skins (boy / girl / neutral) ----
  hero: { hair: "#2b2438", hairStyle: "short", skin: PAL.s, shirt: PAL.r, shirtDark: PAL.R, pants: "#3a3670", boots: PAL.k, bag: true },
  ranger: { hair: PAL.N, hairStyle: "short", skin: PAL.s, shirt: PAL.n, shirtDark: PAL.N, pants: PAL.E, boots: PAL.N, vest: PAL.G, hat: PAL.n, hatBand: PAL.y, bag: true },
  astro: { hair: "#d8d4e8", hairStyle: "short", skin: PAL.s, shirt: PAL.w, shirtDark: PAL.e, pants: PAL.e, boots: PAL.c, glasses: true, hat: PAL.e, hatBand: PAL.c },
  gardener: { hair: PAL.O, hairStyle: "long", skin: PAL.s, shirt: PAL.g, shirtDark: PAL.G, pants: "#3a3670", boots: PAL.N, dress: PAL.g, dressDark: PAL.G, hat: PAL.y, hatBand: PAL.r, bag: true },
  student: { hair: "#2b2438", hairStyle: "bun", skin: PAL.S, shirt: PAL.p, shirtDark: PAL.P, pants: "#3a3670", boots: PAL.k, dress: PAL.p, dressDark: PAL.P, glasses: true, prop: "notebook" },
  star: { hair: PAL.y, hairStyle: "long", skin: PAL.s, shirt: PAL.y, shirtDark: PAL.Y, pants: PAL.O, boots: PAL.R, dress: PAL.y, dressDark: PAL.O }
};

// src/game/audio.ts
var ctx = null;
var sfxGain;
var noiseBuf;
function tone(dest, f, t0, dur, type, vol, to) {
  if (!ctx || f <= 0) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(1e-4, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(2e-4, vol), t0 + 8e-3);
  g.gain.exponentialRampToValueAtTime(1e-4, t0 + dur);
  o.connect(g);
  g.connect(dest);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}
function noise(dest, t0, dur, vol, hp = 1e3, lpf = 0) {
  if (!ctx) return;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = lpf ? "lowpass" : "highpass";
  f.frequency.value = lpf || hp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(1e-4, t0 + dur);
  s.connect(f);
  f.connect(g);
  g.connect(dest);
  s.start(t0, Math.random() * 0.5);
  s.stop(t0 + dur + 0.02);
}
var SFX = {
  click: [[1200, 0.04, "square", 0.12], [1700, 0.06, "square", 0.1]],
  coin: [[988, 0.07, "square", 0.14], [1319, 0.22, "square", 0.14]],
  quest: [
    [523, 0.12, "square", 0.12],
    [659, 0.12, "square", 0.12],
    [784, 0.12, "square", 0.12],
    [1047, 0.14, "square", 0.12],
    [784, 0.1, "square", 0.1],
    [1047, 0.55, "square", 0.13]
  ],
  record: [
    [523, 0.09, "square", 0.12],
    [659, 0.09, "square", 0.12],
    [784, 0.09, "square", 0.12],
    [1047, 0.09, "square", 0.12],
    [1319, 0.09, "square", 0.12],
    [1568, 0.09, "square", 0.12],
    [2093, 0.35, "square", 0.13],
    [1568, 0.1, "square", 0.1],
    [2093, 0.6, "square", 0.14]
  ],
  error: [[150, 0.18, "sawtooth", 0.13, 90], [100, 0.2, "sawtooth", 0.13, 60]],
  door: [[196, 0.1, "triangle", 0.22], [294, 0.22, "triangle", 0.2]],
  plant: [[300, 0.14, "sine", 0.35, 760]],
  harvest: [[660, 0.08, "triangle", 0.3], [880, 0.08, "triangle", 0.3], [1320, 0.22, "triangle", 0.3]],
  purchase: [[784, 0.08, "square", 0.12], [1047, 0.08, "square", 0.12], [1568, 0.3, "square", 0.12]],
  festival_start: [
    [440, 0.12, "square", 0.12],
    [0, 0.1],
    [440, 0.12, "square", 0.12],
    [0, 0.1],
    [440, 0.12, "square", 0.12],
    [0, 0.1],
    [880, 0.4, "square", 0.14]
  ],
  shoot: [[900, 0.05, "square", 0.035, 400]],
  gem: [[1400, 0.05, "square", 0.1], [1900, 0.12, "square", 0.1]],
  jump: [[280, 0.12, "square", 0.1, 620]],
  place: [[500, 0.06, "square", 0.12], [720, 0.09, "square", 0.12]],
  clear: [[660, 0.07, "square", 0.12], [880, 0.07, "square", 0.12], [1100, 0.07, "square", 0.12], [1320, 0.16, "square", 0.12]],
  tick: [[800, 0.05, "square", 0.1]],
  dialog: [[520, 0.04, "square", 0.06], [640, 0.04, "square", 0.06]]
};
function sfx(name) {
  if (!ctx || !getState().audio.sfx) return;
  const t0 = ctx.currentTime + 5e-3;
  if (name === "hit" || name === "boom") {
    noise(sfxGain, t0, name === "boom" ? 0.25 : 0.12, name === "boom" ? 0.35 : 0.25, 800, 2600);
    return;
  }
  const seq = SFX[name];
  if (!seq) return;
  if (name === "door") noise(sfxGain, t0, 0.12, 0.25, 0, 900);
  let t = t0;
  for (const [f, d, type, vol, to] of seq) {
    tone(sfxGain, f, t, d, type ?? "square", vol ?? 0.12, to);
    t += d * 0.92;
  }
}

// src/minigames/Castle.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var W = 240;
var H = 360;
var BLOCK_H = 34;
var BASE_W = 82;
var GROUND_Y = H - 78;
var BLOCKS = [
  { face: "#c97955", light: "#e9a07b", dark: "#8f4934", seam: "#ad5c42" },
  // terracotta
  { face: "#dfcda5", light: "#fff0d0", dark: "#aa9873", seam: "#c4b38e" },
  // cream stone
  { face: "#708b82", light: "#a6c1b4", dark: "#425f56", seam: "#5a766d" },
  // sage
  { face: "#71839b", light: "#b5c3d4", dark: "#3e4d64", seam: "#596b83" }
  // slate
];
var FRAME = { outline: "#303338", base: "#96948d", top: "#d5d0c4", shade: "#666970", bottom: "#4d5055" };
function Castle({ api }) {
  const setup = ({ ctx: ctx2, keys }) => {
    const tower = [{ x: (W - BASE_W) / 2, w: BASE_W, y: 0, col: 0 }];
    let chips = [];
    let sparks = [];
    let dust = [];
    let rings = [];
    let lives = 3;
    api.setLives(lives);
    let cur = { x: 10, w: BASE_W, dir: 1, speed: 74, col: 1 };
    let dropping = null;
    let camY = 0;
    let camTarget = 0;
    let height = 0;
    let perfectRun = 0;
    let time = 0;
    let msg = "";
    let msgT = 0;
    let msgCol = "#fbd54a";
    let shake = 0;
    let failureFlash = 0;
    let dead = false;
    let pressed = false;
    const sky = mk(W, H);
    {
      const g = sky.getContext("2d");
      const R = (x, y, w, h, c) => {
        g.fillStyle = c;
        g.fillRect(x, y, w, h);
      };
      for (const [y, h, col] of [
        [0, 48, "#86c7e7"],
        [48, 52, "#9dd7ed"],
        [100, 54, "#b3e2f1"],
        [154, GROUND_Y - 154, "#c9eaf2"]
      ]) R(0, y, W, h, col);
      const cloud = (cx, cy, scale) => {
        const white = "#f5fbf8";
        const shade = "#d3ebf1";
        const blocks = [
          [-9, 2, 17, 7],
          [-3, -3, 17, 8],
          [6, -8, 15, 9],
          [15, -12, 14, 10],
          [25, -8, 17, 9],
          [34, -3, 15, 8],
          [43, 2, 13, 7]
        ];
        for (const [dx, dy, w, h] of blocks) R(cx + dx * scale, cy + dy * scale, w * scale, h * scale, white);
        R(cx - 6 * scale, cy + 7 * scale, 62 * scale, 3 * scale, shade);
        R(cx + 8 * scale, cy + 5 * scale, 34 * scale, 2 * scale, shade);
      };
      cloud(18, 61, 0.72);
      cloud(145, 40, 0.82);
      cloud(84, 116, 0.62);
      cloud(193, 141, 0.52);
      const mountain = (x, base, w, peak, col) => {
        g.fillStyle = col;
        g.beginPath();
        g.moveTo(x, base);
        g.lineTo(x + w * 0.48, peak);
        g.lineTo(x + w, base);
        g.closePath();
        g.fill();
        g.fillStyle = "#edf6f2";
        g.beginPath();
        g.moveTo(x + w * 0.34, peak + (base - peak) * 0.25);
        g.lineTo(x + w * 0.48, peak);
        g.lineTo(x + w * 0.64, peak + (base - peak) * 0.28);
        g.lineTo(x + w * 0.54, peak + (base - peak) * 0.23);
        g.lineTo(x + w * 0.46, peak + (base - peak) * 0.36);
        g.closePath();
        g.fill();
      };
      mountain(-24, GROUND_Y - 37, 105, GROUND_Y - 135, "#8298bf");
      mountain(48, GROUND_Y - 33, 116, GROUND_Y - 125, "#778eaf");
      mountain(142, GROUND_Y - 36, 116, GROUND_Y - 145, "#8498ba");
      for (let x = -4; x < W + 12; x += 10) {
        const th = 15 + (x * 7 + 23) % 12;
        const y = GROUND_Y - 34 - th;
        R(x + 4, y + th - 3, 2, 9, "#66503a");
        g.fillStyle = x % 2 ? "#3f6f52" : "#47795a";
        g.beginPath();
        g.moveTo(x, y + th - 3);
        g.lineTo(x + 5, y);
        g.lineTo(x + 10, y + th - 3);
        g.closePath();
        g.fill();
      }
      g.fillStyle = "#719c58";
      for (let x = 0; x < W; x += 2) g.fillRect(x, GROUND_Y - 34 + Math.sin(x / 31 + 0.4) * 5, 2, 42);
      g.fillStyle = "#86ae62";
      for (let x = 0; x < W; x += 2) g.fillRect(x, GROUND_Y - 24 + Math.sin(x / 39 + 2) * 4, 2, 32);
      for (let x = 0; x < W; x += 13) {
        const th = 10 + (x * 11 + 17) % 12;
        const ty = GROUND_Y - 31 - th;
        R(x + 4, ty + th - 2, 2, 7, "#715139");
        R(x, ty + 2, 10, th - 3, x % 2 ? "#477b4d" : "#538650");
        R(x + 2, ty, 6, 5, "#65985a");
      }
      const cottage = (x, base, w, wall, roof, roofDark, chimney) => {
        const bodyH = 26;
        const top = base - bodyH;
        R(x - 1, top - 1, w + 2, bodyH + 2, "#463527");
        R(x, top, w, bodyH, wall);
        R(x + 2, top + 1, 2, bodyH - 2, "#76563a");
        R(x + w - 4, top + 1, 2, bodyH - 2, "#76563a");
        R(x, top + 8, w, 2, "#76563a");
        const roofRows = Math.floor((w + 6) / 4);
        for (let row = 0; row < roofRows; row++) {
          const inset = row * 2;
          const yy = top - 3 - row * 2;
          const rw = w + 8 - inset * 2;
          if (rw <= 0) continue;
          R(x - 4 + inset, yy, rw, 2, row % 2 ? roof : roofDark);
          R(x - 4 + inset, yy, rw, 1, row % 2 ? roof : "#e09a78");
          for (let tx = x - 2 + inset + row % 2 * 4; tx < x + w + 2 - inset; tx += 8) R(tx, yy, 1, 2, roofDark);
        }
        R(x - 5, top - 4, w + 10, 3, roofDark);
        if (chimney) {
          R(x + w - 9, top - 17, 5, 12, "#8d8a83");
          R(x + w - 10, top - 18, 7, 2, "#5b5852");
          R(x + w - 8, top - 22, 3, 3, "rgba(255,255,255,0.55)");
        }
        R(x + 5, top + 7, 6, 7, "#493426");
        R(x + 6, top + 8, 4, 5, "#f3cf7f");
        R(x + w - 12, top + 7, 6, 7, "#493426");
        R(x + w - 11, top + 8, 4, 5, "#f3cf7f");
        R(x + Math.floor(w / 2) - 4, base - 12, 8, 12, "#69472d");
        R(x + Math.floor(w / 2) + 2, base - 6, 1, 1, "#fbd54a");
        R(x + Math.floor(w / 2) - 6, base - 1, 12, 2, "#b9b0a0");
        R(x + 4, top + 15, 8, 2, "#6b4426");
        R(x + 5, top + 13, 2, 2, "#e87f8f");
        R(x + 8, top + 13, 2, 2, "#f2d86e");
      };
      cottage(6, GROUND_Y - 9, 39, "#d9c9a9", "#8e8e92", "#666a72", true);
      cottage(48, GROUND_Y - 12, 27, "#e7d5b3", "#ba6345", "#8e4934", false);
      cottage(162, GROUND_Y - 11, 33, "#e4d0aa", "#d2a14c", "#a87b32", true);
      cottage(199, GROUND_Y - 8, 30, "#d9c7a4", "#ba6345", "#8e4934", false);
      R(0, GROUND_Y - 7, W, 9, "#70aa50");
      R(0, GROUND_Y - 7, W, 2, "#9ac96c");
      for (const [x, color] of [[20, "#f2d86e"], [80, "#f7f1dc"], [127, "#e8898d"], [157, "#f2d86e"], [221, "#f7f1dc"]]) {
        R(x, GROUND_Y - 11, 1, 4, "#4e853d");
        R(x - 1, GROUND_Y - 12, 3, 2, color);
      }
      g.fillStyle = "#a77b4d";
      g.beginPath();
      g.moveTo(111, GROUND_Y - 33);
      g.lineTo(124, GROUND_Y - 33);
      g.lineTo(130, GROUND_Y - 20);
      g.lineTo(114, GROUND_Y - 10);
      g.lineTo(153, GROUND_Y + 2);
      g.lineTo(87, GROUND_Y + 2);
      g.lineTo(100, GROUND_Y - 10);
      g.lineTo(112, GROUND_Y - 20);
      g.closePath();
      g.fill();
      g.fillStyle = "#d0ad72";
      g.fillRect(113, GROUND_Y - 31, 8, 2);
      g.fillRect(106, GROUND_Y - 14, 13, 2);
      R(0, GROUND_Y + 2, W, H - GROUND_Y - 2, "#654426");
      R(0, GROUND_Y + 2, W, 3, "#47763e");
      for (let y = GROUND_Y + 10; y < H; y += 11) {
        R(0, y, W, 1, "#805936");
        for (let x = y * 7 % 21; x < W; x += 31) R(x, y + 3, 3, 2, "#51371e");
      }
      const village = ART.villageBg;
      if (village?.naturalWidth && village.naturalHeight) {
        const sourceH = Math.min(village.naturalHeight, village.naturalWidth * (H / W));
        const sourceY = Math.max(0, Math.min(village.naturalHeight - sourceH, village.naturalHeight * 0.13));
        g.imageSmoothingEnabled = false;
        g.drawImage(village, 0, sourceY, village.naturalWidth, sourceH, 0, 0, W, H);
      }
    }
    const topBlock = () => tower[tower.length - 1];
    const screenY = (worldY) => GROUND_Y - worldY + camY;
    const say = (text, col, t = 0.75) => {
      msg = text;
      msgCol = col;
      msgT = t;
    };
    const starBurst = (x, y, c, n = 8, s0 = 4) => {
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + Math.random() * 0.4;
        const v = 40 + Math.random() * 70;
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 20,
          life: 0.45 + Math.random() * 0.3,
          max: 0.75,
          s: s0 + Math.random() * 3,
          c
        });
      }
    };
    const puff = (x, y, c, n = 4) => {
      for (let i = 0; i < n; i++) {
        dust.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 34,
          vy: -Math.random() * 18 - 4,
          life: 0.4 + Math.random() * 0.3,
          max: 0.7,
          r: 3 + Math.random() * 3,
          c
        });
      }
    };
    const nextBlock = () => {
      const t = topBlock();
      const fromLeft = Math.random() < 0.5;
      cur = {
        x: fromLeft ? -t.w : W,
        w: t.w,
        dir: fromLeft ? 1 : -1,
        speed: Math.min(165, 74 + height * 4.5),
        col: (t.col + 1) % BLOCKS.length
      };
    };
    const drop = () => {
      if (dropping || dead) return;
      dropping = { x: cur.x, w: cur.w, y: topBlock().y + BLOCK_H + 90, vy: 0, col: cur.col };
      sfx("place");
    };
    const land = () => {
      if (!dropping) return;
      const t = topBlock();
      const d = dropping;
      const left = Math.max(d.x, t.x);
      const right = Math.min(d.x + d.w, t.x + t.w);
      const overlap = right - left;
      if (overlap <= 2) {
        chips.push({ x: d.x, y: t.y + BLOCK_H, w: d.w, vx: d.x < t.x ? -60 : 60, vy: -40, col: d.col });
        puff(left, t.y + BLOCK_H, "#c48a6a", 6);
        puff(left, t.y + BLOCK_H, "#a89a8a", 6);
        puff(left + 4, t.y + BLOCK_H, "#8f8172", 4);
        dropping = null;
        perfectRun = 0;
        lives--;
        api.setLives(lives);
        shake = 0.3;
        failureFlash = 0.75;
        starBurst(d.x + d.w / 2, screenY(t.y + BLOCK_H), "#df5948", 10, 4);
        sfx("hit");
        say("\u2716", "#d9453b", 0.8);
        if (lives <= 0) {
          dead = true;
          api.finish("dead");
          return;
        }
        nextBlock();
        return;
      }
      const off = Math.abs(d.x - t.x);
      const perfect = off <= 3;
      let newW = overlap;
      let newX = left;
      const landY = t.y + BLOCK_H;
      if (perfect) {
        newX = t.x;
        newW = Math.min(BASE_W, t.w + 4);
        perfectRun++;
        const gain = 25 + Math.min(60, perfectRun * 10);
        api.addScore(gain);
        const cy = screenY(landY);
        starBurst(newX + newW / 2, cy, "#fbd54a", 18, 7);
        starBurst(newX + newW / 2, cy, "#fff2b0", 10, 4);
        rings.push({ x: newX + newW / 2, y: cy, r: 7, life: 0.72, max: 0.72, col: "#fbd54a" });
        sfx("gem");
        say(perfectRun > 1 ? `D\u018FQ\u0130Q x${perfectRun}  +${gain}` : `D\u018FQ\u0130Q!  +${gain}`, "#fbd54a", 0.9);
      } else {
        if (d.x < t.x) chips.push({ x: d.x, y: landY, w: t.x - d.x, vx: -70, vy: -30, col: d.col });
        else if (d.x + d.w > t.x + t.w) chips.push({ x: t.x + t.w, y: landY, w: d.x + d.w - (t.x + t.w), vx: 70, vy: -30, col: d.col });
        perfectRun = 0;
        api.addScore(10);
        rings.push({ x: newX + newW / 2, y: screenY(landY), r: 4, life: 0.42, max: 0.42, col: "#e9e1cf" });
        starBurst(newX + newW / 2, screenY(landY), "#e9e1cf", 5, 3);
        sfx("clear");
      }
      puff(newX + 2, screenY(landY), "#e8e2d4", 6);
      puff(newX + newW - 2, screenY(landY), "#c4beb0", 6);
      tower.push({ x: newX, w: newW, y: landY, col: d.col });
      height++;
      api.addScore(5);
      dropping = null;
      if (newW < 10) {
        lives = 0;
        api.setLives(0);
        dead = true;
        sfx("hit");
        api.finish("dead");
        return;
      }
      camTarget = Math.max(0, tower[tower.length - 1].y - 112);
      nextBlock();
    };
    nextBlock();
    const update = (dt) => {
      if (dead) return;
      time += dt;
      if (msgT > 0) msgT -= dt;
      if (shake > 0) shake -= dt;
      if (failureFlash > 0) failureFlash = Math.max(0, failureFlash - dt);
      const keyDown = keys.has(" ") || keys.has("arrowdown") || keys.has("s");
      if (keyDown && !pressed) drop();
      pressed = keyDown;
      if (!dropping) {
        cur.x += cur.dir * cur.speed * dt;
        if (cur.dir > 0 && cur.x > W) cur.dir = -1;
        if (cur.dir < 0 && cur.x + cur.w < 0) cur.dir = 1;
      } else {
        dropping.vy += 900 * dt;
        dropping.y -= dropping.vy * dt;
        if (dropping.y <= topBlock().y + BLOCK_H) {
          dropping.y = topBlock().y + BLOCK_H;
          land();
        }
      }
      camY += (camTarget - camY) * Math.min(1, dt * 5);
      chips.forEach((c) => {
        c.vy += 700 * dt;
        c.x += c.vx * dt;
        c.y -= c.vy * dt;
      });
      chips = chips.filter((c) => screenY(c.y) < H + 60);
      sparks.forEach((s) => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 200 * dt;
        s.life -= dt;
      });
      sparks = sparks.filter((s) => s.life > 0);
      dust.forEach((d) => {
        d.x += d.vx * dt;
        d.y -= d.vy * dt;
        d.life -= dt;
      });
      dust = dust.filter((d) => d.life > 0);
      rings.forEach((r) => {
        r.r += 52 * dt;
        r.life -= dt;
      });
      rings = rings.filter((r) => r.life > 0);
    };
    const drawBlock = (x, sy, w, ci) => {
      const X = Math.round(x);
      const Y = Math.round(sy);
      const WW = Math.round(w);
      if (WW < 3) return;
      const B = BLOCKS[ci];
      ctx2.fillStyle = FRAME.outline;
      ctx2.fillRect(X + 2, Y, WW - 4, BLOCK_H);
      ctx2.fillRect(X, Y + 2, WW, BLOCK_H - 4);
      ctx2.fillStyle = FRAME.base;
      ctx2.fillRect(X + 2, Y + 1, WW - 4, BLOCK_H - 2);
      ctx2.fillRect(X + 1, Y + 2, WW - 2, BLOCK_H - 4);
      ctx2.fillStyle = FRAME.top;
      ctx2.fillRect(X + 3, Y + 2, WW - 6, 3);
      ctx2.fillRect(X + 2, Y + 4, 2, BLOCK_H - 8);
      ctx2.fillStyle = FRAME.shade;
      ctx2.fillRect(X + 3, Y + BLOCK_H - 4, WW - 6, 2);
      ctx2.fillRect(X + WW - 4, Y + 5, 2, BLOCK_H - 9);
      const fx = X + 5;
      const fy = Y + 6;
      const fw = WW - 10;
      const fh = BLOCK_H - 12;
      if (fw <= 0 || fh <= 0) return;
      ctx2.fillStyle = B.dark;
      ctx2.fillRect(fx - 1, fy - 1, fw + 2, fh + 2);
      ctx2.fillStyle = B.face;
      ctx2.fillRect(fx, fy, fw, fh);
      ctx2.fillStyle = B.light;
      ctx2.fillRect(fx, fy, fw, 2);
      ctx2.fillRect(fx, fy, 2, fh);
      ctx2.fillStyle = B.dark;
      ctx2.fillRect(fx, fy + fh - 2, fw, 2);
      ctx2.fillRect(fx + fw - 2, fy, 2, fh);
      ctx2.fillStyle = "rgba(255,255,255,0.18)";
      ctx2.fillRect(fx + 4, fy + 3, Math.max(3, fw - 12), 1);
      ctx2.fillStyle = B.seam;
      if (fw > 28) {
        ctx2.fillRect(fx + Math.floor(fw * 0.34), fy + 4, 1, Math.max(2, fh - 8));
        ctx2.fillRect(fx + Math.floor(fw * 0.68), fy + 4, 1, Math.max(2, fh - 8));
      }
    };
    const drawChip = (x, sy, w, ci) => {
      const X = Math.round(x);
      const Y = Math.round(sy);
      const WW = Math.max(3, Math.round(w));
      const B = BLOCKS[ci];
      ctx2.fillStyle = FRAME.outline;
      ctx2.fillRect(X - 1, Y - 1, WW + 2, 11);
      ctx2.fillStyle = FRAME.base;
      ctx2.fillRect(X, Y, WW, 9);
      ctx2.fillStyle = B.face;
      ctx2.fillRect(X + 2, Y + 2, WW - 4, 5);
      ctx2.fillStyle = B.light;
      ctx2.fillRect(X + 2, Y + 2, WW - 4, 1);
    };
    const draw = () => {
      ctx2.imageSmoothingEnabled = false;
      ctx2.drawImage(sky, 0, 0);
      const shx = shake > 0 ? Math.round((Math.random() - 0.5) * 5) : 0;
      ctx2.save();
      ctx2.translate(shx, 0);
      const gY = screenY(0);
      if (gY < H + 40) {
        const base = tower[0];
        const bx = Math.round(base.x) - 19;
        const bw = Math.round(base.w) + 38;
        ctx2.fillStyle = "#414047";
        ctx2.fillRect(bx - 2, gY - 2, bw + 4, 21);
        ctx2.fillStyle = "#99978f";
        ctx2.fillRect(bx, gY, bw, 16);
        ctx2.fillStyle = "#d5d0c4";
        ctx2.fillRect(bx + 1, gY, bw - 2, 4);
        ctx2.fillStyle = "#b7b2a8";
        ctx2.fillRect(bx + 2, gY + 4, bw - 4, 2);
        ctx2.fillStyle = "#6d6b6d";
        ctx2.fillRect(bx + 1, gY + 14, bw - 2, 2);
        for (let x = bx + 18; x < bx + bw - 8; x += 24) {
          ctx2.fillStyle = "#77756f";
          ctx2.fillRect(x, gY + 7, 1, 7);
        }
        ctx2.fillStyle = "#77756f";
        ctx2.fillRect(bx + 2, gY + 10, bw - 4, 1);
        for (let i = 0; i < 9; i++) {
          const left = bx - 7 + i * 5;
          const right = bx + bw - 3 + i * 5;
          const yy = gY + 13 + i % 2 * 2;
          for (const rx of [left, right]) {
            ctx2.fillStyle = i % 2 ? "#76757a" : "#8d8c91";
            ctx2.fillRect(rx, yy, 7, 5);
            ctx2.fillStyle = "#b0afb0";
            ctx2.fillRect(rx + 1, yy, 3, 1);
            ctx2.fillStyle = "#4f4d53";
            ctx2.fillRect(rx, yy + 4, 7, 1);
          }
        }
        for (let x = bx - 4; x < bx + bw + 5; x += 13) {
          ctx2.fillStyle = "#3f7d3d";
          ctx2.fillRect(x + 2, gY + 10, 2, 8);
          ctx2.fillStyle = "#75b451";
          ctx2.fillRect(x + 5, gY + 12, 2, 6);
        }
      }
      for (const c of chips) drawChip(c.x, screenY(c.y), c.w, c.col);
      for (const b of tower) {
        const sy = screenY(b.y + BLOCK_H);
        if (sy > H + BLOCK_H || sy < -BLOCK_H * 2) continue;
        drawBlock(b.x, sy, b.w, b.col);
      }
      if (dropping) drawBlock(dropping.x, screenY(dropping.y), dropping.w, dropping.col);
      else {
        const sy = screenY(topBlock().y + BLOCK_H + 90);
        drawBlock(cur.x, sy, cur.w, cur.col);
      }
      for (const d of dust) {
        const a = Math.max(0, d.life / d.max);
        ctx2.globalAlpha = a * 0.65;
        ctx2.fillStyle = d.c;
        const r = Math.round(d.r * (1.7 - a));
        ctx2.fillRect(Math.round(d.x - r), Math.round(d.y - r), r * 2, r * 2);
      }
      ctx2.globalAlpha = 1;
      for (const r of rings) {
        const a = Math.max(0, r.life / r.max);
        ctx2.globalAlpha = a * 0.75;
        ctx2.strokeStyle = r.col;
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.globalAlpha = a * 0.9;
        ctx2.strokeStyle = r.col === "#fbd54a" ? "#fff2b0" : "#ffffff";
        ctx2.lineWidth = 1;
        ctx2.beginPath();
        ctx2.arc(r.x, r.y, Math.max(1, r.r - 2), 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.globalAlpha = 1;
      }
      for (const s of sparks) {
        const a = Math.max(0, s.life / s.max);
        ctx2.globalAlpha = a;
        ctx2.fillStyle = s.c;
        const s0 = Math.max(2, Math.round(s.s * a));
        ctx2.fillRect(Math.round(s.x) - 1, Math.round(s.y) - s0, 2, s0 * 2);
        ctx2.fillRect(Math.round(s.x) - s0, Math.round(s.y) - 1, s0 * 2, 2);
        ctx2.fillRect(Math.round(s.x) - s0, Math.round(s.y) - s0, 1, 1);
        ctx2.fillRect(Math.round(s.x) + s0, Math.round(s.y) - s0, 1, 1);
        ctx2.fillRect(Math.round(s.x) - s0, Math.round(s.y) + s0, 1, 1);
        ctx2.fillRect(Math.round(s.x) + s0, Math.round(s.y) + s0, 1, 1);
      }
      ctx2.globalAlpha = 1;
      ctx2.restore();
      if (failureFlash > 0) {
        ctx2.fillStyle = `rgba(185,48,42,${failureFlash * 0.34})`;
        ctx2.fillRect(0, 0, W, H);
      }
      ctx2.font = "18px VT323, monospace";
      ctx2.textBaseline = "top";
      for (let i = 0; i < lives; i++) {
        ctx2.fillStyle = "#2b2b33";
        ctx2.fillRect(7 + i * 17, 7, 14, 12);
        ctx2.fillStyle = "#d9453b";
        ctx2.fillRect(8 + i * 17, 8, 12, 10);
        ctx2.fillRect(10 + i * 17, 6, 8, 10);
        ctx2.fillStyle = "#f6f1e4";
        ctx2.fillRect(9 + i * 17, 9, 2, 2);
      }
      ctx2.textAlign = "right";
      ctx2.fillStyle = "#2a1a10";
      ctx2.fillText(`${height} m\u0259rt\u0259b\u0259`, W - 7, 7);
      ctx2.fillStyle = "#fff4dc";
      ctx2.fillText(`${height} m\u0259rt\u0259b\u0259`, W - 8, 6);
      ctx2.textAlign = "left";
      if (msgT > 0) {
        ctx2.globalAlpha = Math.min(1, msgT * 3);
        ctx2.font = "26px VT323, monospace";
        ctx2.textAlign = "center";
        ctx2.fillStyle = "#2a1a10";
        ctx2.fillText(msg, W / 2 + 1, 41);
        ctx2.fillStyle = msgCol;
        ctx2.fillText(msg, W / 2, 40);
        ctx2.textAlign = "left";
        ctx2.globalAlpha = 1;
      }
      ctx2.textBaseline = "alphabetic";
    };
    return { update, draw, down: () => drop() };
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(GameCanvas, { w: W, h: H, setup, paused: api.paused });
}

// src/minigames/CarRide.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
var W2 = 240;
var H2 = 360;
var ROAD_X = 34;
var ROAD_W = W2 - ROAD_X * 2;
var LANES = 3;
var LANE_W = ROAD_W / LANES;
var PLAYER_Y = H2 - 66;
var PLAYER_LOOK = { body: "#2f7d7a", dark: "#1f5a58", light: "#4fa8a2", kind: "car", roof: "#f2e6c4" };
var TRAFFIC_LOOKS = [
  { body: "#c8403f", dark: "#8f2d2d", light: "#e26a66", kind: "car" },
  { body: "#efe4c8", dark: "#c2b492", light: "#fff7e2", kind: "car" },
  { body: "#c99a33", dark: "#8f6a1e", light: "#e8bd5c", kind: "truck" },
  { body: "#8a7ab0", dark: "#5e5288", light: "#ab9ccd", kind: "car" },
  { body: "#3f6fa8", dark: "#2a4a78", light: "#6a9bd0", kind: "truck" },
  { body: "#b9b9bd", dark: "#8a8a90", light: "#dcdce0", kind: "van" }
];
var OUTLINE = "#2b2b33";
function rect(g, x, y, w, h, col) {
  g.fillStyle = col;
  g.fillRect(x, y, w, h);
}
function roundRect(g, x, y, w, h, r, col) {
  g.fillStyle = col;
  for (let row = 0; row < h; row++) {
    let inset = 0;
    if (row < r) inset = r - Math.round(Math.sqrt(r * r - (r - row - 0.5) * (r - row - 0.5)));
    if (row >= h - r) {
      const d = row - (h - r) + 0.5;
      inset = r - Math.round(Math.sqrt(Math.max(0, r * r - d * d)));
    }
    g.fillRect(x + inset, y + row, w - inset * 2, 1);
  }
}
var spriteCache = /* @__PURE__ */ new Map();
function makeVehicle(look, facing) {
  const key = `${look.body}|${look.kind}|${facing}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;
  const isTruck = look.kind === "truck";
  const isVan = look.kind === "van";
  const w = isTruck || isVan ? 32 : 28;
  const h = isTruck ? 56 : isVan ? 50 : 42;
  const c = mk(w, h);
  const g = c.getContext("2d");
  const bodyLeft = 3;
  const bodyW = w - 6;
  const glassDark = "#2f3a48";
  const glassMid = "#4d6376";
  const glassLight = "#9dc3d6";
  const tyre = (x, y) => {
    rect(g, x, y, 4, 9, "#20202a");
    rect(g, x, y, 4, 2, "#3a3a46");
    rect(g, x + 1, y + 3, 2, 5, "#111118");
  };
  const axleFront = isTruck ? 12 : 8;
  const axleRear = h - (isTruck ? 18 : 15);
  tyre(0, axleFront);
  tyre(w - 4, axleFront);
  tyre(0, axleRear);
  tyre(w - 4, axleRear);
  const radius = isTruck || isVan ? 3 : 5;
  roundRect(g, bodyLeft, 1, bodyW, h - 2, radius, look.dark);
  roundRect(g, bodyLeft, 1, bodyW - 1, h - 3, radius, look.body);
  rect(g, bodyLeft + 1, 3, 2, h - 7, look.light);
  rect(g, w - bodyLeft - 3, 3, 2, h - 7, look.dark);
  if (isTruck) {
    roundRect(g, bodyLeft, 1, bodyW, 16, 4, look.dark);
    roundRect(g, bodyLeft, 1, bodyW - 1, 15, 4, look.body);
    rect(g, bodyLeft + 1, 4, 2, 9, look.light);
    rect(g, bodyLeft + 3, 5, bodyW - 7, 6, glassMid);
    rect(g, bodyLeft + 3, 5, bodyW - 7, 2, glassLight);
    roundRect(g, bodyLeft, 19, bodyW, h - 23, 3, "#c9b998");
    rect(g, bodyLeft, 19, bodyW, 2, "#e5d7b8");
    for (let y = 23; y < h - 7; y += 5) rect(g, bodyLeft + 2, y, bodyW - 4, 1, "#a8977a");
    rect(g, bodyLeft, h - 6, bodyW, 4, look.dark);
  } else if (isVan) {
    roundRect(g, bodyLeft, 1, bodyW, h - 2, 3, look.dark);
    roundRect(g, bodyLeft, 1, bodyW - 1, h - 3, 3, look.body);
    rect(g, bodyLeft + 1, 4, 2, h - 9, look.light);
    rect(g, bodyLeft + 3, 4, bodyW - 7, 5, glassMid);
    rect(g, bodyLeft + 3, 4, bodyW - 7, 2, glassLight);
    rect(g, bodyLeft + 3, h - 9, bodyW - 7, 4, glassMid);
    rect(g, bodyLeft + 3, h - 9, bodyW - 7, 1, glassLight);
    rect(g, w / 2 - 1, 11, 2, h - 22, look.dark);
  } else {
    rect(g, bodyLeft + 3, 3, bodyW - 6, 6, look.light);
    rect(g, bodyLeft + 3, 9, bodyW - 6, 6, glassMid);
    rect(g, bodyLeft + 3, 9, bodyW - 6, 2, glassLight);
    rect(g, bodyLeft + 4, 11, bodyW - 8, 1, glassDark);
    const roof = look.roof ?? look.light;
    rect(g, bodyLeft + 2, 16, bodyW - 4, 12, roof);
    rect(g, bodyLeft + 2, 16, bodyW - 4, 1, "#fff8e6");
    rect(g, bodyLeft + 2, 26, bodyW - 4, 2, look.dark);
    rect(g, bodyLeft + 1, 18, 2, 8, glassDark);
    rect(g, w - bodyLeft - 3, 18, 2, 8, glassDark);
    rect(g, bodyLeft + 3, 30, bodyW - 6, 5, glassMid);
    rect(g, bodyLeft + 3, 30, bodyW - 6, 1, glassLight);
    rect(g, bodyLeft + 3, 36, bodyW - 6, 3, look.light);
  }
  const mirrorY = isTruck ? 8 : isVan ? 7 : 15;
  rect(g, bodyLeft - 2, mirrorY, 3, 3, look.dark);
  rect(g, w - bodyLeft - 1, mirrorY, 3, 3, look.dark);
  const frontY = facing === "up" ? 2 : h - 5;
  const backY = facing === "up" ? h - 5 : 2;
  rect(g, bodyLeft + 2, frontY, 4, 3, "#fff4c8");
  rect(g, w - bodyLeft - 6, frontY, 4, 3, "#fff4c8");
  rect(g, bodyLeft + 2, backY, 4, 3, "#d9453b");
  rect(g, w - bodyLeft - 6, backY, 4, 3, "#d9453b");
  const canvas = outlineCanvas(c, OUTLINE);
  const out = { canvas, w: canvas.width, h: canvas.height, hw: w - 8, hh: h - 10 };
  spriteCache.set(key, out);
  return out;
}
var sceneryCache = /* @__PURE__ */ new Map();
function scenerySprite(kind) {
  const hit = sceneryCache.get(kind);
  if (hit) return hit;
  const size = {
    tree: [24, 32],
    bush: [18, 16],
    fence: [24, 16],
    rock: [17, 12],
    flowers: [18, 16]
  };
  const [w, h] = size[kind];
  const c = mk(w, h);
  const g = c.getContext("2d");
  if (kind === "tree") {
    rect(g, w / 2 - 2, h - 12, 4, 12, "#6b4a2a");
    rect(g, w / 2 - 2, h - 12, 1, 12, "#8a6238");
    for (let y = 0; y < h - 9; y++) {
      const t = (y - (h - 9) / 2) / ((h - 9) / 2);
      const half = Math.round((w / 2 - 1) * Math.sqrt(Math.max(0, 1 - t * t)));
      if (half <= 0) continue;
      g.fillStyle = y < 6 ? "#3f7a3a" : y < (h - 9) / 2 ? "#4f9442" : "#5aa04a";
      g.fillRect(w / 2 - half, y, half * 2, 1);
    }
    rect(g, w / 2 - 6, 4, 5, 3, "#6ab04f");
    rect(g, w / 2 + 1, 10, 4, 3, "#7cc45c");
    rect(g, w / 2 - 9, 2, 3, 2, "#d8a13c");
  } else if (kind === "bush") {
    roundRect(g, 1, 3, w - 2, h - 5, 5, "#3f7a3a");
    roundRect(g, 2, 2, w - 4, h - 6, 5, "#4f9442");
    rect(g, 4, 3, 5, 3, "#7cc45c");
    rect(g, w - 10, 7, 4, 2, "#6ab04f");
  } else if (kind === "fence") {
    rect(g, 0, 4, w, 2, "#a8784a");
    rect(g, 0, 10, w, 2, "#a8784a");
    rect(g, 0, 4, w, 1, "#c99a63");
    for (const x of [1, w - 4]) rect(g, x, 1, 3, h - 2, "#8a5f38");
    rect(g, w / 2 - 1, 1, 3, h - 2, "#8a5f38");
    for (const x of [1, w / 2 - 1, w - 4]) rect(g, x, 1, 1, h - 2, "#b98a54");
  } else if (kind === "rock") {
    roundRect(g, 1, 4, w - 2, h - 5, 4, "#6f6a70");
    rect(g, 2, 4, w - 4, 3, "#9a969e");
    rect(g, 3, 3, 6, 2, "#b9b4b8");
    rect(g, 2, h - 3, w - 4, 2, "#4f4a52");
  } else {
    roundRect(g, 1, 4, w - 2, h - 5, 4, "#3f7a3a");
    roundRect(g, 2, 3, w - 4, h - 6, 4, "#4f9442");
    const dots = [
      [4, 6, "#e86a8a"],
      [9, 4, "#f6e27a"],
      [13, 8, "#e86a8a"],
      [6, 10, "#ffffff"],
      [11, 11, "#b86fc6"]
    ];
    for (const [x, y, col] of dots) {
      rect(g, x, y, 2, 2, col);
      rect(g, x, y, 1, 1, "#fff6e8");
    }
  }
  const out = outlineCanvas(c, "#2f2419");
  sceneryCache.set(kind, out);
  return out;
}
var fuelSprite = null;
function makeFuelCan() {
  if (fuelSprite) return fuelSprite;
  const c = mk(11, 14);
  const g = c.getContext("2d");
  roundRect(g, 1, 3, 9, 11, 2, "#8f2d3b");
  roundRect(g, 1, 3, 8, 10, 2, "#d9453b");
  rect(g, 2, 4, 2, 7, "#ef6a5f");
  rect(g, 1, 8, 9, 3, "#f2e6c4");
  rect(g, 1, 8, 9, 1, "#fff8e6");
  rect(g, 7, 1, 3, 3, "#4a2d1c");
  rect(g, 2, 1, 5, 2, "#6b4426");
  rect(g, 2, 1, 5, 1, "#8a5a32");
  fuelSprite = outlineCanvas(c, "#2b2b33");
  return fuelSprite;
}
function CarRide({ api }) {
  const setup = ({ ctx: ctx2, keys }) => {
    const laneX = (l) => ROAD_X + LANE_W * l + LANE_W / 2;
    const playerSprite = makeVehicle(PLAYER_LOOK, "up");
    const trafficSprites = TRAFFIC_LOOKS.map((l) => ({ look: l, sprite: makeVehicle(l, "down") }));
    const player = { x: laneX(1), lane: 1, tilt: 0 };
    let traffic = [];
    let fuels = [];
    let parts = [];
    let lives = 3;
    api.setLives(lives);
    let time = 0;
    let scroll = 0;
    let lineScroll = 0;
    let spawnT = 0.9;
    let fuelT = 5;
    let invuln = 0;
    let distAcc = 0;
    let flash = 0;
    let msg = "";
    let msgT = 0;
    let dead = false;
    let target = null;
    let shake = 0;
    const sceneryKinds = ["tree", "bush", "fence", "rock", "flowers"];
    const scenery = Array.from({ length: 16 }, (_, i) => ({
      y: i * 52,
      left: i % 2 === 0,
      kind: sceneryKinds[i * 3 % sceneryKinds.length]
    }));
    const speed = () => 150 + Math.min(150, api.elapsed.current * 2.1);
    const spawnParts = (x, y, kind, n, cols) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = kind === "spark" ? 60 + Math.random() * 110 : 15 + Math.random() * 40;
        const max = 0.35 + Math.random() * 0.3;
        parts.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v + (kind === "dust" ? 20 : 0),
          life: max,
          max,
          kind,
          col: cols[i % cols.length]
        });
      }
    };
    const hurt = () => {
      if (invuln > 0) return;
      lives--;
      api.setLives(lives);
      flash = 0.3;
      shake = 0.25;
      sfx("hit");
      spawnParts(player.x, PLAYER_Y, "spark", 14, ["#fff6c8", "#fbd54a", "#ef8f3a", "#ffffff"]);
      spawnParts(player.x, PLAYER_Y + 6, "smoke", 5, ["#b9b4a8", "#8d8892"]);
      if (lives <= 0) {
        dead = true;
        api.finish("dead");
        return;
      }
      invuln = 1.8;
    };
    const update = (dt) => {
      if (dead) return;
      time += dt;
      if (invuln > 0) invuln -= dt;
      if (flash > 0) flash -= dt;
      if (shake > 0) shake -= dt;
      if (msgT > 0) msgT -= dt;
      const sp = speed();
      scroll = (scroll + sp * dt) % 64;
      lineScroll = (lineScroll + sp * dt) % 36;
      distAcc += sp * dt;
      if (distAcc >= 50) {
        const n = Math.floor(distAcc / 50);
        distAcc -= n * 50;
        api.addScore(n);
      }
      if (keys.has("arrowleft") || keys.has("a")) {
        if (player.lane > 0 && target === null) {
          player.lane--;
          target = laneX(player.lane);
        }
      } else if (keys.has("arrowright") || keys.has("d")) {
        if (player.lane < LANES - 1 && target === null) {
          player.lane++;
          target = laneX(player.lane);
        }
      } else if (target !== null && Math.abs(target - player.x) < 1.5) target = null;
      if (target !== null) {
        const dx = target - player.x;
        const step = Math.sign(dx) * Math.min(Math.abs(dx), 320 * dt);
        player.x += step;
        player.tilt += (Math.max(-1, Math.min(1, step / 6)) - player.tilt) * Math.min(1, dt * 10);
      } else {
        player.tilt += (0 - player.tilt) * Math.min(1, dt * 10);
      }
      player.x = Math.max(ROAD_X + playerSprite.w / 2, Math.min(W2 - ROAD_X - playerSprite.w / 2, player.x));
      spawnT -= dt;
      if (spawnT <= 0) {
        const lane = Math.floor(Math.random() * LANES);
        const laneBusy = traffic.some((t) => t.lane === lane && t.y < 170);
        const tooCrowded = traffic.filter((t) => t.y < 40).length >= LANES - 1;
        if (!laneBusy && !tooCrowded) {
          const pick = trafficSprites[Math.floor(Math.random() * trafficSprites.length)];
          traffic.push({
            x: laneX(lane),
            y: -pick.sprite.h,
            lane,
            speed: sp * (0.5 + lane * 0.06),
            look: pick.look
          });
        }
        spawnT = Math.max(0.38, 1 - Math.min(1, api.elapsed.current / 60) * 0.6) * (0.75 + Math.random() * 0.45);
      }
      fuelT -= dt;
      if (fuelT <= 0) {
        fuels.push({ x: laneX(Math.floor(Math.random() * LANES)), y: -24, got: false });
        fuelT = 7 + Math.random() * 6;
      }
      for (const tr of traffic) tr.y += (sp - tr.speed) * dt;
      for (let l = 0; l < LANES; l++) {
        const laneCars = traffic.filter((c) => c.lane === l).sort((a, b) => a.y - b.y);
        for (let i = 1; i < laneCars.length; i++) {
          const front = laneCars[i - 1];
          const back = laneCars[i];
          const gap = 54;
          if (back.y - front.y < gap) back.y = front.y + gap;
        }
      }
      for (const f of fuels) f.y += sp * dt;
      for (const tr of traffic) {
        if (invuln > 0) break;
        if (Math.abs(tr.x - player.x) < 20 && Math.abs(tr.y - PLAYER_Y) < 34) {
          hurt();
          tr.y = H2 + 200;
        }
      }
      for (const f of fuels) {
        if (f.got) continue;
        if (Math.abs(f.x - player.x) < 20 && Math.abs(f.y - PLAYER_Y) < 26) {
          f.got = true;
          api.addScore(40);
          sfx("coin");
          msg = "+40";
          msgT = 0.7;
          if (lives < 3 && Math.random() < 0.4) {
            lives++;
            api.setLives(lives);
          }
        }
      }
      traffic = traffic.filter((t) => t.y < H2 + 90);
      fuels = fuels.filter((f) => !f.got && f.y < H2 + 24);
      for (const s of scenery) {
        s.y += sp * dt;
        if (s.y > H2 + 40) {
          s.y -= 16 * 52;
          s.kind = sceneryKinds[Math.floor(Math.random() * sceneryKinds.length)];
        }
      }
      if (Math.random() < dt * 18) {
        const x = ROAD_X - 8 - Math.random() * 14 + (Math.random() < 0.5 ? 0 : ROAD_W + 16 + Math.random() * 14);
        spawnParts(x, H2 - Math.random() * 60, "dust", 1, ["#e8dfc8"]);
      }
      for (const p of parts) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.kind === "spark" ? 90 * dt : p.kind === "smoke" ? -30 * dt : 40 * dt;
        p.life -= dt;
      }
      parts = parts.filter((p) => p.life > 0);
    };
    const drawRoad = () => {
      rect(ctx2, 0, 0, ROAD_X, H2, "#6fae4a");
      rect(ctx2, W2 - ROAD_X, 0, ROAD_X, H2, "#6fae4a");
      for (let y = -(scroll * 0.6 % 32); y < H2; y += 32) {
        rect(ctx2, 0, y, ROAD_X, 10, "#639f42");
        rect(ctx2, W2 - ROAD_X, y + 16, ROAD_X, 10, "#639f42");
      }
      for (let y = -(scroll * 0.8 % 26); y < H2; y += 26) {
        rect(ctx2, 6 + y * 3 % 12, y + 4, 2, 5, "#578f3b");
        rect(ctx2, 16 + y * 5 % 10, y + 12, 2, 4, "#7bbf55");
        rect(ctx2, W2 - 12 - y * 4 % 11, y + 8, 2, 5, "#578f3b");
        rect(ctx2, W2 - 22 - y * 7 % 9, y + 18, 2, 4, "#7bbf55");
        if ((y | 0) % 78 < 26) {
          rect(ctx2, 10, y + 20, 2, 2, "#f5e08a");
          rect(ctx2, W2 - 17, y + 2, 2, 2, "#efe0f0");
        }
      }
      rect(ctx2, ROAD_X - 7, 0, 7, H2, "#8a6b3f");
      rect(ctx2, W2 - ROAD_X, 0, 7, H2, "#8a6b3f");
      for (let y = -(scroll * 0.8 % 18); y < H2; y += 18) {
        rect(ctx2, ROAD_X - 6, y, 2, 2, "#a8875a");
        rect(ctx2, W2 - ROAD_X + 3, y + 7, 2, 2, "#6f5430");
      }
      rect(ctx2, ROAD_X, 0, ROAD_W, H2, "#4b4f5b");
      rect(ctx2, ROAD_X, 0, 2, H2, "#3c404a");
      rect(ctx2, W2 - ROAD_X - 2, 0, 2, H2, "#3c404a");
      for (let y = -(scroll * 0.7 % 24); y < H2; y += 24) {
        ctx2.fillStyle = "#545968";
        ctx2.fillRect(ROAD_X + 4 + y * 7 % 9, y, 5, 2);
        ctx2.fillRect(W2 - ROAD_X - 16 - y * 5 % 11, y + 11, 4, 2);
      }
      for (let y = -(scroll * 0.45 % 150); y < H2; y += 150) {
        rect(ctx2, ROAD_X + 18, y + 20, 26, 12, "#464a55");
        rect(ctx2, ROAD_X + 18, y + 20, 26, 1, "#3d414b");
        rect(ctx2, W2 - ROAD_X - 44, y + 88, 20, 9, "#464a55");
        rect(ctx2, W2 - ROAD_X - 30, y + 42, 1, 16, "#3f434d");
        rect(ctx2, ROAD_X + 52, y + 120, 1, 12, "#3f434d");
      }
      rect(ctx2, ROAD_X + 4, 0, 3, H2, "#d9d6a8");
      rect(ctx2, W2 - ROAD_X - 7, 0, 3, H2, "#d9d6a8");
      for (let l = 1; l < LANES; l++) {
        const x = Math.round(ROAD_X + LANE_W * l) - 2;
        for (let y = -lineScroll; y < H2; y += 36) {
          rect(ctx2, x, y, 4, 18, "#ece7c0");
          rect(ctx2, x, y, 4, 2, "#fffce8");
        }
      }
    };
    const draw = () => {
      ctx2.imageSmoothingEnabled = false;
      const sx = shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
      ctx2.save();
      ctx2.translate(sx, 0);
      drawRoad();
      for (const s of scenery) {
        const spr = scenerySprite(s.kind);
        const x = s.left ? Math.round(ROAD_X - 8 - spr.width + 4) : Math.round(W2 - ROAD_X + 8 - 4);
        const y = Math.round(s.y);
        if (y < -spr.height || y > H2 + 8) continue;
        ctx2.fillStyle = "rgba(0,0,0,0.18)";
        ctx2.fillRect(x + 2, y + spr.height - 3, spr.width - 4, 3);
        ctx2.drawImage(spr, x, y);
      }
      for (const f of fuels) {
        if (f.got) continue;
        const ic = makeFuelCan();
        const bob = Math.round(Math.sin(time * 6 + f.x) * 2);
        const x = Math.round(f.x);
        const y = Math.round(f.y) + bob;
        ctx2.fillStyle = "rgba(251,213,74,0.18)";
        ctx2.fillRect(x - 14, y - 14, 28, 28);
        ctx2.fillStyle = "rgba(251,213,74,0.35)";
        ctx2.fillRect(x - 10, y - 10, 20, 20);
        ctx2.drawImage(ic, x - Math.round(ic.width / 2), y - Math.round(ic.height / 2));
      }
      for (const tr of traffic) {
        const spr = makeVehicle(tr.look, "down");
        const x = Math.round(tr.x - spr.w / 2);
        const y = Math.round(tr.y - spr.h / 2);
        ctx2.fillStyle = "rgba(0,0,0,0.25)";
        ctx2.fillRect(x + 3, y + 5, spr.w, spr.h);
        ctx2.drawImage(spr.canvas, x, y);
        ctx2.fillStyle = "#ff6b5e";
        ctx2.fillRect(x + 6, y + spr.h - 7, 4, 2);
        ctx2.fillRect(x + spr.w - 10, y + spr.h - 7, 4, 2);
        ctx2.fillStyle = "rgba(255,255,255,0.35)";
        ctx2.fillRect(x + 8, y + 8, 5, 2);
      }
      const blink = invuln > 0 && Math.floor(time * 14) % 2 === 0;
      if (!blink) {
        const x = Math.round(player.x - playerSprite.w / 2);
        const y = PLAYER_Y - Math.round(playerSprite.h / 2);
        ctx2.fillStyle = "rgba(0,0,0,0.28)";
        ctx2.fillRect(x + 3, y + 6, playerSprite.w, playerSprite.h);
        ctx2.save();
        ctx2.translate(player.x, PLAYER_Y);
        ctx2.rotate(player.tilt * 0.06);
        ctx2.drawImage(playerSprite.canvas, -playerSprite.w / 2, -playerSprite.h / 2);
        ctx2.fillStyle = "#bcd8e4";
        ctx2.fillRect(-7, -2, 14, 3);
        ctx2.fillStyle = "rgba(255,255,255,0.45)";
        ctx2.fillRect(-6, -1, 5, 1);
        ctx2.fillStyle = "#e04b40";
        ctx2.fillRect(-11, 14, 4, 3);
        ctx2.fillRect(7, 14, 4, 3);
        if (invuln > 0.9) {
          ctx2.globalAlpha = Math.min(1, (invuln - 0.9) * 2);
          ctx2.strokeStyle = "#e0403a";
          ctx2.lineWidth = 2;
          ctx2.strokeRect(-playerSprite.w / 2 - 1, -playerSprite.h / 2 - 1, playerSprite.w + 2, playerSprite.h + 2);
          ctx2.globalAlpha = 1;
        }
        ctx2.restore();
        rect(ctx2, x + 3, y - 8, 5, 8, "rgba(255,244,200,0.22)");
        rect(ctx2, x + playerSprite.w - 8, y - 8, 5, 8, "rgba(255,244,200,0.22)");
      }
      for (const p of parts) {
        const a = Math.max(0, p.life / p.max);
        ctx2.globalAlpha = p.kind === "smoke" ? a * 0.5 : a;
        ctx2.fillStyle = p.col;
        if (p.kind === "spark") {
          const s = p.life > 0.3 ? 3 : 2;
          ctx2.fillRect(Math.round(p.x), Math.round(p.y), s, s);
        } else {
          ctx2.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
        }
      }
      ctx2.globalAlpha = 1;
      if (flash > 0) {
        ctx2.fillStyle = `rgba(217,69,59,${flash * 0.55})`;
        ctx2.fillRect(0, 0, W2, H2);
      }
      ctx2.restore();
      for (let i = 0; i < lives; i++) {
        const hx = 7 + i * 18;
        ctx2.fillStyle = "#2b2b33";
        ctx2.fillRect(hx - 1, 10, 15, 10);
        ctx2.fillRect(hx + 1, 7, 11, 13);
        ctx2.fillStyle = "#e0404a";
        ctx2.fillRect(hx, 10, 13, 9);
        ctx2.fillRect(hx + 2, 8, 9, 11);
        ctx2.fillStyle = "#ff8b94";
        ctx2.fillRect(hx + 2, 10, 4, 3);
        ctx2.fillStyle = "#ffffff";
        ctx2.fillRect(hx + 2, 10, 2, 2);
      }
      if (msgT > 0) {
        ctx2.font = "26px VT323, monospace";
        ctx2.textAlign = "center";
        ctx2.fillStyle = "#2a1a10";
        ctx2.fillText(msg, W2 / 2 + 1, 41);
        ctx2.fillStyle = "#fbd54a";
        ctx2.fillText(msg, W2 / 2, 40);
        ctx2.textAlign = "left";
      }
      ctx2.textBaseline = "alphabetic";
    };
    return {
      update,
      draw,
      down: (x) => {
        target = x;
      },
      move: (x) => {
        target = x;
      },
      up: () => {
        target = null;
      }
    };
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(GameCanvas, { w: W2, h: H2, setup, paused: api.paused });
}

// harness/entry.tsx
var GAMES = { Castle, CarRide };
export {
  GAMES
};
/*! Bundled license information:

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.production.js:
  (**
   * @license React
   * react-jsx-runtime.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.development.js:
  (**
   * @license React
   * react-jsx-runtime.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
