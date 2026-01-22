

# --- begin: index.js ---

// index.js
import make_boot from "./lib/_boot.js";

import make_bool from "./lib/bool.js";
import make_array from "./lib/array.js";
import make_hash from "./lib/hash.js";

import make_utils from "./lib/utils.js";
import make_str from "./lib/str.js";
import make_func from "./lib/func.js";

import make_dom from "./lib/dom/index.js";
import make_args from "./lib/args.js";

import make_http from "./lib/_http.js";
import make_service from "./lib/service.js";
import make_require from './lib/require.js';
const lib = {};
export default lib;
export { lib };

// ─────────────────────────────────────────
// boot / startup utilities (no deps)
// ─────────────────────────────────────────

// attach boot logic (functions live here)
lib._boot = make_boot(lib);

// run boot once at startup (populates lib._env)
lib._boot.install();

// ─────────────────────────────────────────
// Core / primitive utilities (minimal deps)
// ─────────────────────────────────────────

lib.bool = make_bool(lib);
lib.array = make_array(lib);
lib.hash = make_hash(lib);
lib.str = make_str(lib);
lib.func = make_func(lib);

// ─────────────────────────────────────────
// Utility layers (depend on primitives)
// ─────────────────────────────────────────

// utils currently contains core normalizers (baseType/isEmpty/etc) + aliases
lib.utils = make_utils(lib);



// ─────────────────────────────────────────
// DOM layer (depends on utils/func/hash/array)
// ─────────────────────────────────────────

lib.dom = make_dom(lib);
//lib.hash.set(lib,'dom.create', make_dom_create(lib) );
//lib.hash.set(lib,'dom.append', make_dom_append(lib) );

// ─────────────────────────────────────────
// facilities and services  (depends on hash/array/dom/utils)
// ─────────────────────────────────────────
lib.service = make_service(lib);
lib.require = make_require(lib);

// ─────────────────────────────────────────
// Args helper (depends on hash/array/dom/utils)
// ─────────────────────────────────────────

lib.args = make_args(lib);

// ─────────────────────────────────────────
// Transport / IO (depends on _env + hash/array/func)
// ─────────────────────────────────────────

lib._http = make_http(lib);


# --- end: index.js ---



# --- begin: lib/_boot.js ---

// lib/_env.js
export function make(lib) {
    function resolveRoot(explicit) {
        if (explicit) return explicit;
        if (typeof globalThis !== "undefined") return globalThis;
        if (typeof window !== "undefined") return window;
        if (typeof global !== "undefined") return global;
        return undefined;
    }

    function install(opts = {}) {
        // NOTE: no lib.utils dependency here if you want zero deps:
        opts = (opts && typeof opts === "object") ? opts : { root: opts };

        const root = resolveRoot(opts.root);
        const isBrowser = !!(root && root.document && root.location);

        lib._env = {
            root,
            isBrowser,
            isNode: !!(root && root.process && root.process.versions && root.process.versions.node),
            // cache location if present (so callers never touch `window`)
            location: isBrowser ? root.location : undefined
        };

        return lib._env;
    }

    return { install, resolveRoot };
}
export default make;



# --- end: lib/_boot.js ---



# --- begin: lib/_http.js ---

/**
 * Internal bootstrap HTTP transport.
 * Used ONLY during early runtime before higher-level request APIs exist.
 * Not intended for direct application use.

 * this is beginning of time bootstrapper. its probably not needed but you never know.
 */

//lib._http = (function(lib){
export function make(lib) {
    function get (url, opts) {
        opts = lib.hash.to(opts);
        if (opts.debug) console.log('opts', opts);

        const XHR = lib._env?.root?.XMLHttpRequest;
        if (!XHR) throw new Error("XHR unavailable");

        const req = new XHR();
        const method = lib.hash.get(opts, 'method', "GET");

        // open (always async)
        req.open(method, url, true);

        // 4/16/24 -- added with credentials.
        if (opts.credentials === true) req.withCredentials = true;

        req.onreadystatechange = function () {
            if (req.readyState === XHR.DONE) {
                if (req.status >= 400) lib.func.get(opts.error, 1)(req);
                else lib.func.get(opts.load, 1)(req);
            }
        };

        req.send(lib.hash.get(opts, 'body'));
        return req;
    };
    
    function _request(url, opts) {
	opts = lib.hash.to(opts);

	const XHR = lib._env?.root?.XMLHttpRequest;
	if (!XHR) throw new Error("XHR unavailable");

	const req = new XHR();

	const method  = lib.hash.get(opts, 'method', "GET");
	const headers = lib.array.to(opts.header);

	// open (always async)
	req.open(method, url, true);

	// 4/16/24 -- added with credentials.
	if (opts.credentials === true) req.withCredentials = true;

	if (opts.urlencoded) {
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	}

	for (const h of headers) {
            if (lib.hash.is(h)) {
		req.setRequestHeader(h.name, h.value);
            }
	}

	req.request = {
            url,
            body: lib.hash.get(opts, 'body')
	};

	req.onreadystatechange = function () {
            if (req.readyState === XHR.DONE) {
		if (opts.json === 1) {
                    try {
			req.jsonData = JSON.parse(String(req.responseText));
                    } catch (e) {
			req.jsonData = undefined;
                    }
		}

		if (req.status >= 400) lib.func.get(opts.error, 1)(req);
		else lib.func.get(opts.load, 1)(req);
            }
	};

	if (opts.debug) console.log('sending', opts, req);

	req.send(lib.hash.get(opts, 'body'));
	return req;
    }
    function post(url,opts){
	opts = lib.hash.to(opts);
	opts.method='POST';
	return _request(url,opts);
    }
    
    return  {
	get: get,
	post: post,
	request: _request
	
    };
}

export default make;


# --- end: lib/_http.js ---



# --- begin: lib/args.js ---

//lib/args.js
/**
 * Argument parsing helpers.
 *
 * This module provides lightweight utilities for:
 * - Slicing `arguments` objects
 * - Detecting `Arguments`
 * - Mapping positional arguments into a hash using a simple schema
 *
 * NOTE:
 * - This is legacy-adjacent code.
 * - Behavior is permissive and loosely validated.
 * - Intended for internal convenience, not strict argument validation.
 */

export function make(lib){
    /**
     * Parse a positional argument list into a hash.
     *
     * High-level behavior:
     * - Converts an `arguments` object or array-like input into a real array
     * - Optionally pops a trailing object and treats it as an options hash
     * - Assigns positional arguments to named keys
     * - Merges defaults and overrides
     * - Optionally enforces required keys
     *
     * Semantics (LOCKED / legacy-safe):
     * - If `opts.pop` is truthy and the last argument is a plain object
     *   (but NOT a DOM element), it is removed from the args list and used
     *   as the initial output object.
     * - `def` provides default values and is merged first.
     * - Positional arguments are mapped in order to `opts.parms`.
     * - Required keys listed in `opts.req` must exist in the final output
     *   or the function returns `undefined`.
     *
     * Options:
     * - parms {string|Array<string>}:
     *     Space-delimited string or array of parameter names that positional
     *     arguments will be assigned to.
     *
     * - req {string|Array<string>}:
     *     Space-delimited string or array of required keys.
     *
     * - pop {number|boolean} (default: 1):
     *     If truthy, pop a trailing object from args and treat it as overrides.
     *
     * - arg {number|boolean} (legacy, currently unused):
     *     Present for backward compatibility; no effect in current implementation.
     *
     * Notes:
     * - No type checking is performed on argument values.
     * - DOM elements are explicitly excluded from being treated as option hashes.
     * - Uses lib.hash.set for deep assignment of positional values.
     *
     * @param {Arguments|Array} args
     *     The arguments object or array-like input to parse.
     *
     * @param {Object} [def]
     *     Default values for the output hash.
     *
     * @param {Object} [opts]
     *     Parsing options (see above).
     *
     * @returns {Object|undefined}
     *     Parsed argument hash, or undefined if required keys are missing.
     */

    //parseArgs(args, {req: " ", opt:" ",arg: 1|0,pop:1|0}
    function parse(args, def, opts){
	let out = {}, defOpts = {pop:1, arg:0};
	opts = lib.hash.merge(defOpts, lib.hash.to(opts,'parms'));
	def = lib.hash.to(def);
	args = lib.array.to(slice(args)); //convert potential 'Arguments' to array
	const parms = lib.array.to(opts['parms'], /\s+/);
	const req = lib.array.to(opts['req'], /\s+/);	
	//console.log('>>',parms,req,opts['req'],'<<');
	out = (opts.pop && lib.utils.baseType(args[args.length-1],'object') && !lib.dom.isDom(args[args.length-1]))?args.pop():{};
	out = lib.hash.merge(def,out);
	for (let i =0; i < parms.length; i++){
	    let key = parms[i], value;
	    if (i > args.length-1)break;
	    value = args[i];
	    lib.hash.set(out, key, value);
	}
	for (let i =0; i < req.length; i++){
	    let key = req[i];
	    if (!(key in out))return undefined;
	}
	return out;
	
    }

    /**
     * Slice an arguments-like object into a real array.
     *
     * Behavior:
     * - Converts `arguments` or array-like objects into a true Array
     * - Applies Array.prototype.slice semantics
     *
     * This exists primarily to normalize `arguments` objects.
     *
     * @param {Arguments|Array} args
     *     Arguments object or array-like input.
     *
     * @param {number} [a]
     *     Start index.
     *
     * @param {number} [b]
     *     End index (exclusive).
     *
     * @returns {Array}
     */
    
    function slice(args,a,b=undefined){
	return Array.prototype.slice.call(args).slice(a,b);
    }

    /**
     * Determine whether a value is an `Arguments` object.
     *
     * Uses Object.prototype.toString for detection.
     *
     * Notes:
     * - This is reliable across realms but slower than simple heuristics.
     * - Primarily used for defensive checks in legacy code.
     *
     * @param {*} item
     * @returns {boolean}
     */
    function isArguments( item ) {
	return Object.prototype.toString.call( item ) === '[object Arguments]';
    }
    
    return  {	slice,parse,isArguments    };
}
export default make;


# --- end: lib/args.js ---



# --- begin: lib/array.js ---

/**
 * lib.array
 * ----------
 * Small array helpers that wrap common lib.utils conversions.
 *
 * Export style:
 *   make(lib) -> { append, subtract, is, to }
 */
export function make(lib) {


    /**
     * Check whether a value is an Array.
     *
     * @param {*} arg
     * @returns {boolean}
     */
    function is(arg) {
	return (typeof arg === 'object') && Array.isArray(arg);
    }
    //legacy. leave it.
    function toArrayold (list){
	if (!list)return [];
	return (is(list))?list:[list] ;
    }
    
    /**
     * Coerce any input into an array.
     *
     * Contract:
     * - This function ALWAYS returns an Array.
     * - Garbage / non-arrayable input is coerced to an empty array.
     *
     * Semantics (locked):
     * - Falsy values (null, undefined, false, 0, "") → []
     * - Arrays are returned as-is.
     * - If `split` is provided and the input is a string, the string is split
     *   (supports string or RegExp).
     * - Otherwise, the input is wrapped into a single-element array.
     *
     * Purpose:
     * - Normalize arbitrary input into a predictable array form.
     * - Safe for defensive data handling and config parsing.
     *
     * @param {*} list
     * @param {string|RegExp} [split]
     * @returns {Array}
     */
    function to(list, split) {
	if (!list) return [];
	if (is(list)) return list;

	// If a split token is provided and list is a string, split it (RegExp supported)
	if (!lib.utils.isEmpty(split) && typeof list === 'string') {
            return list.split(split);
	}

	return [list];
    }

    
    /**
     * Return a copy of `list` with all values in `exclude` removed.
     *
     * Inputs may be arrays or whitespace-delimited strings (via to()).
     * Removal is by strict equality using Array#indexOf (string/number matching).
     *
     * @param {Array|string} list
     * @param {Array|string} exclude
     * @returns {Array}
     */
    function arraySubtract(list, exclude) {
        let out = to(list, /\s+/);
        out = out.slice(); // non-destructive
        const exList = to(exclude, /\s+/);

        for (const ex of exList) {
            let index;
            while ((index = out.indexOf(ex)) !== -1) {
                out.splice(index, 1);
            }
        }
        return out;
    }

    /**
     * Wrap each item in `input` with a prefix and postfix.
     *
     * Accepts array, string, or number. Strings are split on whitespace.
     * Returns undefined for unsupported input types.
     *
     * @param {Array|string|number} input
     * @param {string} [pre=""]
     * @param {string} [post=""]
     * @returns {Array|undefined}
     */
    function arrayAppend(input, pre = "", post = "") {
        if (!lib.utils.baseType(input, ["array", "string", "number"])) return undefined;

        const list = to(input, /\s+/);
        const output = [];

        for (let i = 0; i < list.length; i++) {
            output[i] = pre + list[i] + post;
        }
        return output;
    }

    return {
        append: arrayAppend,
        subtract: arraySubtract,
	is,
	to
    };
}

export default make;


# --- end: lib/array.js ---



# --- begin: lib/bool.js ---

export function make(lib){
    /**
     * Detect affirmative intent.
     *
     * Returns true if the value explicitly encodes affirmative intent.
     * This is NOT truthiness.
     *
     * Accepted values:
     *   - true
     *   - 1
     *   - "1"
     *   - "true"
     *   - "yes"
     * (case-insensitive for strings)
     */
    function intentTrue(val) {
        const t = typeof val;
        if (t === 'undefined' || val === null) return false;
        if (t === 'number') return val === 1;
        if (t === 'boolean') return val === true;
        if (t === 'string') return /^(1|true|yes)$/i.test(val);
        return false;
    }

    /**
     * Detect negative intent.
     *
     * Returns true if the value explicitly encodes negative intent.
     * This is NOT truthiness.
     *
     * Accepted values:
     *   - false
     *   - 0
     *   - "0"
     *   - "false"
     *   - "no"
     * (case-insensitive for strings)
     */
    function intentFalse(val) {
        const t = typeof val;
        if (t === 'undefined' || val === null) return false;
        if (t === 'number') return val === 0;
        if (t === 'boolean') return val === false;
        if (t === 'string') return /^(0|false|no)$/i.test(val);
        return false;
    }

    // ──────────────────────────────────────────────────────────────

    /**
     * Is the value a real boolean (true or false)?
     */
    function is(val) {
        return typeof val === 'boolean';
    }

    /**
     * Does the value explicitly encode boolean intent?
     *
     * True if the value is:
     *   - a boolean, OR
     *   - an affirmative literal, OR
     *   - a negative literal
     */
    function isIntent(val) {
        return is(val) || intentTrue(val) || intentFalse(val);
    }

    /**
     * Strict boolean conversion.
     *
     * Returns true only if the value === true.
     * All other values return false.
     */
    function to(val) {
        return is(val) ? val : false;
    }

    /**
     * Intent-based boolean conversion.
     *
     * Returns true only if the value explicitly encodes affirmative intent.
     * All other values (including negative intent) return false.
     */
    function byIntent(val) {
        return intentTrue(val);
    }

    // ──────────────────────────────────────────────────────────────

    return {
        // Intent detectors
        intentTrue,
        intentFalse,

        // Type checks
        is,
        isIntent,

        // Conversions
        to,
        byIntent,

        // Aliases (shorthand / legacy-friendly)
        ish: isIntent,
        yes: intentTrue,
        no: intentFalse
    };
}

export default make;


# --- end: lib/bool.js ---



# --- begin: lib/dom/append.js ---

//$SECTION -LIB.DOM.APPEND
export function make(lib) {
    /**
     * Resolve a target-ish input into a DOM Element.
     * Accepts:
     * - DOM Element
     * - selector string / id string (best-effort)
     */
    function resolveTarget(target) {
        if (!target) return null;

        // already a DOM node/element?
        if (lib.dom && typeof lib.dom.isDom === "function" && lib.dom.isDom(target)) {
            return target;
        }
        if (typeof Element !== "undefined" && target instanceof Element) {
            return target;
        }

        // string lookup
        if (typeof target === "string") {
            if (lib.dom && typeof lib.dom.getElement === "function") {
                return lib.dom.getElement(target);
            }
            // fallback: try id first, then selector
            const byId = document.getElementById(target);
            if (byId) return byId;
            try {
                return document.querySelector(target);
            } catch (e) {
                return null;
            }
        }

        return null;
    }

    /**
     * Resolve an element-ish input into a DOM Element.
     * (Same semantics as resolveTarget; named separately for readability.)
     */
    function resolveElement(e) {
        return resolveTarget(e);
    }

    function before(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target || !target.parentNode) return null;
        target.parentNode.insertBefore(e, target);
        return e;
    }

    function after(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target || !target.parentNode) return null;

        // Prefer library helper if present (keeps legacy semantics if any)
        if (lib.dom && typeof lib.dom.insertAfter === "function") {
            lib.dom.insertAfter(e, target);
            return e;
        }

        // Native fallback
        if (target.nextSibling) target.parentNode.insertBefore(e, target.nextSibling);
        else target.parentNode.appendChild(e);
        return e;
    }

    function prepend(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target) return null;

        if (target.firstChild) target.insertBefore(e, target.firstChild);
        else target.appendChild(e);

        return e;
    }

    function append(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target) return null;
        target.appendChild(e);
        return e;
    }

    /**
     * Insert using DOM-standard positions (mirrors insertAdjacentElement).
     * pos: "beforebegin" | "afterbegin" | "beforeend" | "afterend"
     */
    function adjacent(e, target, pos) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target) return null;

        const p = String(pos || "").toLowerCase();
        if (typeof target.insertAdjacentElement === "function") {
            try {
                target.insertAdjacentElement(p, e);
                return e;
            } catch (err) {
                // fall through to manual mapping
            }
        }

        // Manual mapping (works everywhere)
        if (p === "beforebegin") return before(e, target);
        if (p === "afterend") return after(e, target);
        if (p === "afterbegin") return prepend(e, target);
        // default to beforeend
        return append(e, target);
    }

    /**
     * Replace target with element.
     */
    function replace(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target || !target.parentNode) return null;
        target.parentNode.replaceChild(e, target);
        return e;
    }

    /**
     * Remove target from DOM.
     */
    function remove(target) {
        target = resolveTarget(target);
        if (!target || !target.parentNode) return null;
        target.parentNode.removeChild(target);
        return target;
    }

    /**
     * Empty a target (remove all children).
     */
    function empty(target) {
        target = resolveTarget(target);
        if (!target) return null;
        while (target.firstChild) target.removeChild(target.firstChild);
        return target;
    }

    /**
     * Convenience aliases for common positions.
     */
    const disp = {
        // original API (fixed)
        before: before,
        after: after,
        prepend: prepend,
        append: append,

        // missing but very handy “targeting” functions
        beforeBegin: function (e, target) { return adjacent(e, target, "beforebegin"); },
        afterBegin: function (e, target) { return adjacent(e, target, "afterbegin"); },
        beforeEnd: function (e, target) { return adjacent(e, target, "beforeend"); },
        afterEnd: function (e, target) { return adjacent(e, target, "afterend"); },

        adjacent: adjacent,
        replace: replace,
        remove: remove,
        empty: empty,

        // exposed in case other modules want the same coercion
        resolveTarget: resolveTarget
    };

    return disp;
}

export default make;


# --- end: lib/dom/append.js ---



# --- begin: lib/dom/create.js ---

//$SECTION -LIB.DOM.CREATE

export function make(lib) {
    // module-private (don’t use `this` for caching; keep ES module semantics clean)
    const special = {};

    function ensureSpecial() {
        if (special._init) return;

        const eventHandler = function (e, key, value) {
            const fun = lib.func.get(value);
            if (fun) e.addEventListener(key, fun, true);
        };

        // event-ish attributes that should become listeners
        special.load = eventHandler;
        special.error = eventHandler;
        special.click = eventHandler;

        special._init = true;
    }

    function js(url, attrs) {
        if (!lib.hash.is(attrs)) attrs = {};
        attrs = lib.hash.merge(
            {
                async: true,
                type: "text/javascript",
                src: url
            },
            attrs
        );
        return element("script", attrs);
    }

    function css(url, attrs) {
        if (!lib.hash.is(attrs)) attrs = {};
        attrs = lib.hash.merge(
            {
                rel: "stylesheet",
                type: "text/css",
                href: url
            },
            attrs
        );
        return element("link", attrs);
    }

    function element(tag, attrs, content) {
        ensureSpecial();

        const e = document.createElement(tag);

        if (!lib.hash.is(attrs)) attrs = {};

        for (const key of Object.keys(attrs)) {
            const k = lib.utils.lc(key, true); // force lowercase
            if (special[k]) {
                special[k](e, key, attrs[key]);
            } else {
                e.setAttribute(key, attrs[key]);
            }
        }

        // Optional: set content if provided (legacy-friendly, but harmless)
        if (typeof content !== "undefined" && content !== null) {
            // If you ever want html vs text, add an option later; keep minimal now.
            e.textContent = String(content);
        }

        return e;
    }

    return {
        css: css,
        link: css,
        js: js,
        element: element
    };
}

export default make;



# --- end: lib/dom/create.js ---



# --- begin: lib/dom/index.js ---

//$SECTION -LIB.DOM
import make_dom_create from './create.js';
import make_dom_append from './append.js';

export function make(lib) {


    /**
     * Check whether a value is a DOM Element.
     *
     * @param {*} o
     * @returns {boolean}
     */
    function isDom(o) {
        return (
            typeof Element !== "undefined" &&
		o instanceof Element
        );
    }

    /**
     * Resolve an element reference.
     *
     * Semantics:
     * - If `id` is already a DOM Element, return it.
     * - Otherwise treat `id` as an element id string.
     *
     * @param {string|Element} id
     * @returns {Element|null}
     */
    function getElement(id) {
        if (isDom(id)) return id;
        return document.getElementById(id);
    }

    /**
     * Alias for document.getElementById.
     *
     * @param {string} id
     * @returns {Element|null}
     */
    function byId(id) {
        return document.getElementById(id);
    }

    /**
     * Remove an element from the DOM.
     *
     * Semantics:
     * - Accepts an Element or an element id.
     * - If element does not exist, returns undefined.
     * - Returns the removed element on success.
     *
     * @param {string|Element} e
     * @returns {Element|undefined}
     */
    function removeElement(e) {
        const el = getElement(e);
        if (!el || !el.parentNode) return undefined;
        el.parentNode.removeChild(el);
        return el;
    }


    /**
     * Parse the current query string into a plain object.
     *
     * LEGACY-ADJACENT (modernized):
     * - This used to write to a global `urlParams` object and return nothing.
     * - This version returns an object and does NOT mutate globals.
     *
     * Environment:
     * - Browser-only (requires `lib._env.location`)
     * - Reads from `lib._env.location.search`
     *
     * Parsing rules / limitations:
     * - Simple regex parsing (not URLSearchParams)
     * - "+" is decoded as space (legacy form behavior)
     * - Repeated keys: last one wins (overwrites)
     * - No special handling for arrays, nested keys, or type coercion
     *
     * Throws:
     * - Error if called outside a browser environment (no `lib._env.location`)
     *
     * @returns {Object} Map of query keys to decoded string values.
     */
    function qs() {
	if (!lib._env || !lib._env.location) {
            throw new Error("[lib.dom.qs] Browser-only: lib._env.location is not available");
	}

	let match;
	const pl = /\+/g;
	const search = /([^&=]+)=?([^&]*)/g;
	const decode = (s) => decodeURIComponent(String(s).replace(pl, " "));
	const query = String(lib._env.location.search || "").replace(/^\?/, "");

	const params = {};
	while ((match = search.exec(query))) {
            params[decode(match[1])] = decode(match[2]);
	}
	return params;
    }

    /**
     * Legacy shim for query parsing.
     *
     * Behavior:
     * - Calls `qs()` to parse query params
     * - Writes results to `lib._env.root.urlParams`
     * - Returns the same object
     *
     * Notes:
     * - Prefer `qs()` in all modern code.
     * - This exists only for backward compatibility with code that expects
     *   a global-ish `urlParams`.
     *
     * @returns {Object} Same object returned by `qs()`.
     */
    function qsLegacy() {
	const params = qs();
	if (lib._env && lib._env.root) {
            lib._env.root.urlParams = params;
	}
	return params;
    }



    /**
     * Insert a DOM node immediately after another node.
     *
     * @param {Node} newNode
     * @param {Node} existingNode
     */
    function insertAfter(newNode, existingNode) {
	if (!existingNode || !existingNode.parentNode) return;
	existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
    }



    //todo allow total data set upload later
    function set(e,attr,val){

	attr = lib.utils.toString(attr, { force: 1 });
	if (!lib.dom.isDom(e) || !attr) return undefined;

	let m;

	if ((m = attr.match(/^(set|add|remove|toggle)Class$/i))) {
	    const lc = m[1].toLowerCase();

	    val = lib.utils.toString(val, { force: 1 });
	    if (!val) return undefined;

	    const map = {
		set: () => { e.className = val; },
		add: () => { e.classList.add(val); },
		remove: () => { e.classList.remove(val); },
		toggle: () => e.classList.toggle(val),
	    };

	    return map[lc]();
	}

	const attrParts = lib.array.to(attr, '.'); // attr is already normalized to string earlier

	if (attrParts.length && String(attrParts[0]).toLowerCase() === 'dataset') {
	    if (attrParts.length < 2) return undefined;

	    const path = attrParts.slice(1); // remove "dataset"
	    lib.hash.set(e.dataset, path, val);
	    return lib.hash.get(e.dataset, path);
	}
	
	
	if (m= attr.match(/^(tagName|value|name|text|innerText|textContent|innerHTML|type|href|src|disabled|selected|checked)$/i)){

	    let map= {
		"tagname" : "tagName",
		"value" : "value",
		"name" : "name",
		"text" : "textContent",
		"textcontent" : "textContent",
		"innertext" : "innerText",
		"innerhtml" : "innerHTML",
		"type" : "type",
		"href" : "href",
		"src" : "src",
		"disabled":"disabled",
		"selected":"selected",
		"checked" : "checked"
	    };
	    let lc = m[1].toLowerCase();
	    return  e[(lc in map)?map[lc]:m[1]] = val; 
        }


	if (lib.array.to(attr, '.').length > 1) {
	    lib.hash.legacySet(e, attr, val); //generally works on dom.
	} else {
	    e.setAttribute(attr, val); //otherwise use the standard method!
	}

	//handle either way!
	return get(e, attr);   
	
	//return e.getAttribute(attr,val);
	

    }
    
    //work in progress. collect all the carvout properties , and make it insenstive , fixing for later.

    /**
     * Get a value from a DOM element with a few legacy carve-outs.
     *
     * Behavior (LOCKED):
     * - If `e` is not a DOM Element: returns undefined.
     * - If `attr` is falsy: returns `e`.
     * - If attr starts with "dataset":
     *     - "dataset"        -> returns e.dataset
     *     - "dataset.foo.bar"-> returns lib.hash.get(e.dataset, "foo.bar")
     * - If attr matches a supported direct property name:
     *     tagName, value, name, text, textContent, innerHTML, type
     *   -> returns e[prop]
     * - Otherwise returns e.getAttribute(attr)
     *
     * @param {Element} e
     * @param {string} [attr]
     * @returns {*}
     */
    function get(e, attr) {
	if (!lib.dom.isDom(e)) return undefined;
	if (!attr) return e;

	let m;

	// dataset / dataset.foo.bar
	m = String(attr).match(/^dataset(\.)?(.*)$/i);
	if (m) {
            if (m[1]) return lib.hash.get(e.dataset, m[2]);
            return e.dataset;
	}

	
	// style.display (explicit carve-out; NOT a general style path system)
	// - "style.display" -> e.style.display
	// - "style"         -> e.style (CSSStyleDeclaration)
	m = attr.match(/^style(\.)?(.*)$/i);
	if (m) {
            if (!m[1]) return e.style; // "style"
            if (String(m[2]).toLowerCase() === "display") return e.style.display;
            return undefined; // refuse other style.* to avoid pretending we support it
	}


	// direct property carve-outs
	m = String(attr).match(/^(tagName|value|name|text|textContent|innerHTML|type)$/i);
	if (m) {
            // preserve original behavior: return e[m[1]]
            // (note: when matched case-insensitively, m[1] is the matched token, not necessarily canonical casing)
            return e[m[1]];
	}

	return e.getAttribute(attr);
    }


    /**
     * Collect an element's attributes into a plain object, optionally filtering by regex.
     *
     * Behavior (LOCKED / legacy-safe):
     * - Reads attribute names via e.getAttributeNames()
     * - If `regex` is provided, only matching attributes are included.
     * - If opts.strip is truthy and regex matches:
     *     - output key becomes the substring AFTER the matched portion (m[0])
     *     - value is read via e.getAttribute(attrName)
     * - Otherwise:
     *     - output key is the full attribute name
     *     - value is read via lib.dom.get(e, attrName)
     *
     * @param {Element} e
     * @param {RegExp} [regex]
     * @param {Object|boolean} [opts]  (coerced via lib.hash.to(opts,"strip"))
     * @returns {Object}
     */
    function filterAttributes(e, regex, opts) {
	if (!lib.dom.isDom(e)) return {};

	opts = lib.hash.to(opts, "strip");

	const list = e.getAttributeNames();
	const out = {};

	for (const k of list) {
            if (regex) {
		const m = k.match(regex);
		if (!m) continue;

		if (opts.strip) {
                    const stripKey = k.substr(k.indexOf(m[0]) + m[0].length);
                    out[stripKey] = e.getAttribute(k);
                    continue;
		}
            }

            out[k] = lib.dom.get(e, k);
	}

	return out;
    }

    /**
     * INTENTIONALLY UNEXPORTED / INCOMPLETE -- not sure why it was never completed. but it staying in until I decide what to do with it.
     * Parse data-* attributes into a nested object.
     *
     * Semantics (LOCKED / legacy-safe):
     * - Reads attributes matching /^data-<prefix>/ (prefix optional).
     * - Strips the matched prefix from attribute names.
     * - Converts `config.delim` (default "-") into "." and inflates via lib.hash.set.
     * - Values are attribute strings.
     *
     * Config:
     * - prefix : optional prefix after "data-" (e.g. "foo" matches data-foo-*)
     * - delim  : delimiter inside the remaining key (default "-")
     *
     * @param {Element} e
     * @param {Object|string} [config]
     * @returns {Object|undefined}
     */
    function parseDataSet(e, config) {
	if (!lib.dom.is(e)) return undefined;

	config = Object.assign(
            { out: 'cc', delim: '-', prefix: '' },
            parseStringSimple(config) || {}
	);

	let prefix = lib.utils.toString(config.prefix || "", 1).trim();
	if (!lib.utils.isEmpty(prefix) && prefix.substr(-1, 1) !== '-') {
            prefix += '-';
	}

	// filterAttributes expects opts; passing 1 becomes {strip:1} via lib.hash.to()
	const rec = filterAttributes(e, new RegExp("^data-" + prefix), 1);

	const out = {};

	for (const key in rec) {
            // ES6-safe delimiter replacement (avoid replaceAll)
            const tKey = config.delim ? String(key).split(config.delim).join(".") : key;
            lib.hash.set(out, tKey, rec[key]);
	}

	return out;
    }
    
    return {
	get: get,
	set: set,
	is: isDom,
	isDom: isDom,
	getElement: getElement,
	byId: byId,
	removeElement: removeElement,
	qs:qs,
	insertAfter:insertAfter,
	filterAttributes,
	create: make_dom_create(lib),
	append: make_dom_append(lib)
    };
}

export default make;


# --- end: lib/dom/index.js ---



# --- begin: lib/func.js ---

//lib.func

export function make(lib){
    const DUMMY_FN = function () {};

    /**
     * Resolve a function reference from various input forms.
     *
     * Accepted inputs:
     * - A function reference (returned as-is)
     * - A string name on the resolved root object (e.g. "myFunc")
     * - A dotted path string (e.g. "obj.method.submethod", "Math.max")
     *
     * Options:
     * - dummy {boolean|number}:
     *     If truthy, returns a no-op function instead of `undefined`
     *     when resolution fails.
     *
     * - bind {boolean}:
     *     If true, binds the resolved function to its immediate parent
     *     object in the path (e.g. "obj.method" binds to `obj`).
     *     Useful for APIs and methods that depend on `this`.
     *
     * - root {Object}:
     *     Explicit root object to resolve names against.
     *     Defaults to `lib._env.root` (resolved during boot).
     *
     * Limitations / Notes:
     * - This is NOT a parser or tokenizer.
     * - Binding is best-effort and may not work for all native APIs
     *   (some rely on internal slots).
     * - Arrow functions and already-bound functions ignore binding.
     * - This function performs lookup only — it never invokes the result.
     *
     * Examples:
     *   getFunction("Math.max")
     *   getFunction("util.format", { root: myLib })
     *   getFunction("handler", { root: someObj, bind: true })
     *
     * Legacy note:
     * - Previously accepted a positional `dummy` argument.
     *   This is still supported via opts coercion.
     *
     * @param {Function|string|undefined} f
     * @param {Object|boolean|number} [opts]
     * @returns {Function|undefined}
     */
    function getFunction(f, opts) {
	opts = lib.hash.to(opts, 'dummy');
	const root = opts.root || lib.hash.get(lib, '_env.root');

	if (!f || !root) return opts.dummy ? DUMMY_FN : undefined;
	if (typeof f === "function") return f;
	if (typeof f !== "string") return opts.dummy ? DUMMY_FN : undefined;

	let fn = lib.hash.get(root, f);
	if (typeof fn !== "function") return opts.dummy ? DUMMY_FN : undefined;

	if (opts.bind) {
	    let parent = root;
	    const parts = lib.array.to(f, '.');
	    if (parts.length > 1) parent = lib.hash.get(root, parts.slice(0, -1));
	    if (parent) { try { fn = fn.bind(parent); } catch (e) {} }
	}
	
	return fn;
    }

    
    /**
     * Create a wrapped function with trailing (post-applied) arguments.
     *
     * Behavior:
     * ---------
     * - Resolves `fun` via lib.utils.getFunction (string or function).
     * - Captures any arguments passed AFTER `fun` at wrap time.
     * - Returns a new function.
     * - When the returned function is called:
     *     1. Its runtime arguments are collected
     *     2. The captured arguments are appended to the end
     *     3. The resolved function is invoked with the combined arguments
     *
     * This is effectively a "post-apply" / partial-application helper.
     *
     * Example:
     * --------
     *   const fn = wrapper('doThing', 1, 2);
     *   fn('a', 'b');
     *   // calls doThing('a', 'b', 1, 2)
     *
     * Notes:
     * ------
     * - If `fun` cannot be resolved, returns undefined.
     * - Uses lib.args.slice to safely handle `arguments` objects.
     * - Semantics are preserved from legacy implementation.
     */
    function wrapper(fun) {
	const fn = lib.utils.getFunction(fun);
	if (!fn) return undefined;

	const tailArgs = lib.args.slice(arguments, 1);

	return function () {
	    const callArgs = lib.args.slice(arguments).concat(tailArgs);
	    return fn(...callArgs);
	};
    }
    /* in progress. check pre/postWrap for now
       chain("foo"|foo, ...args);
       chain("foo bar"|[foo,bar], ...args);
       chain({f:funs, e:err,t:test,a:args      });
       chain("istring lower, match", "$rv");
    */


    /**
     * NOTE:
     * -----
     * preWrap and postWrap are legacy-style higher-order helpers
     * retained for backward compatibility and simple handler composition.
     * Newer systems (delegator, ActiveTags) provide more expressive chaining.
     */

    /**
     * Wrap a sequence of functions and apply trailing (post-applied) args.
     *
     * Behavior:
     * ---------
     * - `funs` may be a whitespace-delimited string or an array-like list.
     * - Captures any args after `funs` at wrap time (tail args).
     * - Returns a function which, when called, will:
     *     1) build callArgs = runtimeArgs + tailArgs
     *     2) resolve each function via lib.utils.getFunction
     *     3) invoke each in order with callArgs
     *     4) return the last function's return value
     *
     * Early exit:
     * -----------
     * - If any function in the chain cannot be resolved, returns undefined.
     *
     * Example:
     * --------
     *   const fn = postWrap("a b", 1, 2);
     *   fn("x"); // calls: a("x",1,2) then b("x",1,2)
     */
    function postWrap(funs) {
	const tailArgs = lib.args.slice(arguments, 1);
	const list = lib.array.to(funs, /\s+/);

	return function () {
	    let rv;

	    const runtimeArgs = lib.args.slice(arguments);
	    const callArgs = runtimeArgs.concat(tailArgs);

	    for (let item of list) {
		const fn = lib.utils.getFunction(item);
		if (!fn) return undefined;
		rv = fn(...callArgs);
	    }

	    return rv;
	};
    }    

    /**
     * Wrap a sequence of functions and apply leading (pre-applied) args.
     *
     * Behavior:
     * ---------
     * - `funs` may be a whitespace-delimited string or an array-like list.
     * - Captures any args after `funs` at wrap time (head args).
     * - Returns a function which, when called, will:
     *     1) build callArgs = headArgs + runtimeArgs
     *     2) resolve each function via lib.utils.getFunction
     *     3) invoke each in order with callArgs
     *     4) return the last function's return value
     *
     * Early exit:
     * -----------
     * - If any function in the chain cannot be resolved, returns undefined.
     *
     * Example:
     * --------
     *   const fn = preWrap("a b", 1, 2);
     *   fn("x"); // calls: a(1,2,"x") then b(1,2,"x")
     */
    function preWrap(funs) {
	const headArgs = lib.args.slice(arguments, 1);
	const list = lib.array.to(funs, /\s+/);

	return function () {
	    let rv;

	    const runtimeArgs = lib.args.slice(arguments);
	    const callArgs = headArgs.concat(runtimeArgs);

	    for (let item of list) {
		const fn = lib.utils.getFunction(item);
		if (!fn) return undefined;
		rv = fn(...callArgs);
	    }

	    return rv;
	};
    }

    /**
     * Attempt to retrieve the caller location/name from the call stack.
     *
     * IMPORTANT:
     * ----------
     * This is a DEBUG / DIAGNOSTIC helper only.
     *
     * Behavior:
     * ---------
     * - Creates an Error to capture the current stack trace.
     * - Extracts the immediate caller line from the stack.
     * - Returns a trimmed string describing the callsite.
     *
     * Caveats:
     * --------
     * - Stack trace formats are engine-dependent.
     * - Minified / bundled code may produce meaningless output.
     * - Not suitable for logic, routing, or production identifiers.
     *
     * Typical use:
     * ------------
     * - Logging
     * - Debug traces
     * - Developer diagnostics
     */
    function name() {
	const err = new Error();
	if (!err.stack) return undefined;

	const lines = err.stack.split('\n');
	if (lines.length < 3) return undefined;

	return lines[2].trim();
    }
    
    var disp = {
	name : name,
	wrapper : wrapper,
	postWrap: postWrap,
	preWrap: preWrap,
	get : getFunction
    };
    return disp;
}

export default make;


# --- end: lib/func.js ---



# --- begin: lib/hash.js ---

//lib.hash = (function(lib){
export function make(lib) {


    
    /**
     * Determine whether a value is a plain hash object.
     *
     * Semantics (locked):
     * - Must be truthy
     * - Must NOT be an array
     * - Must be a plain Object (not a class instance, DOM node, etc.)
     *
     * This is intentionally stricter than a generic "object" check.
     *
     * @param {*} obj
     * @returns {boolean}
     */
    function is(obj) {
        if (!obj) return false;
        if (Array.isArray(obj)) return false;

        // Reject non-plain objects (classes, DOM nodes, etc.)
        /*
        if (!obj.hasOwnProperty('constructor') && obj.constructor !== Object) {
            return false;
        }
        */
        if (!Object.prototype.hasOwnProperty.call(obj, 'constructor') && obj.constructor !== Object) {
            return false;
        }

        return true;
    }
    

        /**
     * Coerce any input into a hash (plain object).
     *
     * Contract:
     * - Always returns a hash.
     * - If `obj` is already a hash, return it unchanged.
     * - Otherwise return an empty hash, or (if `hotkey` is provided)
     *   wrap the value: { [hotkey]: obj }.
     *
     * Notes:
     * - This function is intentionally permissive; it is a normalization helper.
     * - Legacy merge/opts behavior previously existed here, but is not active in
     *   the current implementation (unreachable code removed).
     *
     * @param {*} obj
     * @param {string} [hotkey]
     * @returns {Object}
     */
    function to(obj, hotkey) {
        if (is(obj)) return obj;

        const out = {};
        if (!lib.utils.isEmpty(hotkey) && lib.utils.baseType(hotkey, 'string')) {
            out[hotkey] = obj;
        }
        return out;
    }
    
    /**
     * Deep copy utility with class / DOM safeguards.
     *
     * Performs a recursive copy of plain objects and arrays.
     * Non-plain objects (class instances, DOM elements, etc.)
     * are returned by reference unless explicitly forced.
     *
     * Behavior:
     * - Scalars (string, number, boolean, null, undefined) are returned as-is.
     * - Arrays are deep-copied element-by-element.
     * - Plain objects (hashes) are deep-copied key-by-key.
     * - Class instances are NOT traversed by default and are returned by reference.
     * - DOM Elements are NOT copied and are returned by reference.
     *
     * Options:
     * - force {number|boolean}:
     *     If truthy (=== 1), forces traversal of non-plain objects.
     *     Use with caution — prototypes are NOT preserved.
     *
     * - debug {boolean}:
     *     If true, logs when traversal is skipped due to class detection.
     *
     * Notes:
     * - This function does NOT preserve prototypes.
     * - Enumerable inherited properties WILL be copied (for...in semantics).
     * - Designed for config / manifest / data objects, not arbitrary class graphs.
     *
     * @param {*} inObject
     *     The value to deep-copy.
     *
     * @param {Object} [opts]
     *     Optional behavior flags.
     *
     * @returns {*}
     *     A deep copy of the input for arrays and plain objects,
     *     or the original reference for unsupported object types.
     */
    
    function deepCopy(inObject, opts = {}) {
	opts = to(opts);

	if (typeof inObject !== "object" || inObject === null) {
            return inObject;
	}

	const isElement =
              (typeof Element !== "undefined") &&
              (inObject instanceof Element);

	if (
            opts.force !== 1 &&
		!isElement &&
		!lib.array.is(inObject) &&
		!is(inObject)
	) {
            if (opts.debug) {
		const cname =
                      (inObject &&
                       inObject.constructor &&
                       inObject.constructor.name) ||
                      "<unknown>";
		console.log(
                    "not traversing, its probably a class " + cname
		);
            }
            return inObject;
	}

	const outObject = Array.isArray(inObject) ? [] : {};

	for (const key in inObject) {
            outObject[key] = deepCopy(inObject[key], opts);
	}

	return outObject;
    }


    /**
     * Safe hash lookup with fallback.
     *
     * Returns the value associated with `key` in `hash` if the key exists,
     * otherwise returns the provided default.
     *
     * Notes:
     * - Uses the `in` operator, so inherited enumerable properties
     *   are considered present.
     * - Does NOT check for own-properties only.
     *
     * @param {string} key
     *     Key to look up.
     *
     * @param {Object} hash
     *     Object to query.
     *
     * @param {*} def
     *     Default value to return if key is not present.
     *
     * @returns {*}
     *     The value at `hash[key]` if present, otherwise `def`.
     */
    function hashOr(key, hash, def) {
	return (key in hash) ? hash[key] : def;
    }


    /**
     * Deep merge two plain hashes (non-destructive).
     *
     * Semantics:
     * - Returns `undefined` unless BOTH inputs are hashes (per lib.hash.is).
     * - Deep-copies both inputs before merging (does not mutate caller objects).
     * - Iterates enumerable properties of `right` and merges into `left`.
     * - Uses a type-pair dispatch table:
     *     hh : object + object  -> recursive merge
     *     aa : array  + array   -> concat (returns new array)
     *     as : array  + scalar  -> push scalar into array
     *     default              -> overwrite with right
     *
     * Options:
     * - opts.disp: optional override/extension of the dispatch table.
     *   Example:
     *     { disp: { ss: (l,r)=> String(l)+String(r) } }
     *
     * Note:
     * - This version fixes an old bug where the recursive handler (hh) accidentally
     *   captured the `opts` from the FIRST call ever made to merge(). Recursion now
     *   uses the current call’s `opts` consistently.
     *
     * @param {Object} left
     * @param {Object} right
     * @param {Object} [opts]
     * @returns {Object|undefined}
     */
    function merge(left, right, opts) {
	if (!(is(left) && is(right))) return undefined;

	// Non-destructive behavior
	left = deepCopy(left);
	right = deepCopy(right);

	const hmap = { array: 'a', object: 'h' };

	// Base dispatch table for this call (important: no cross-call capture)
	const baseDisp = {
            hh: function (l, r) { return merge(l, r, opts); }, // recursion uses CURRENT opts
            as: function (l, r) { l.push(r); return l; },
            aa: function (l, r) { return l.concat(r); },
            'default': function (l, r) { return r; }
	};

	// Merge in user dispatch overrides (if any)
	const disp =
              (is(opts) && ('disp' in opts))
              ? Object.assign({}, baseDisp, opts.disp)
              : baseDisp;

	for (const p in right) {
            const lt = hashOr(lib.utils.baseType(left[p]), hmap, 's');
            const rt = hashOr(lib.utils.baseType(right[p]), hmap, 's');
            let type = lt + rt;

            if (!(type in disp)) type = 'default';
            left[p] = disp[type](left[p], right[p]);
	}

	return left;
    }
    

    /**
     * Safely get a nested value from an object using a dot-path.
     *
     * Supports array indexes in paths:
     *   - "foo.0.bar"  => foo[0].bar
     *
     * Semantics (kept):
     * - If an intermediate hop cannot be traversed, returns `def`.
     * - On the final key, returns value unless it is `undefined` (then returns `def`).
     *
     * @param {object|array} E
     * @param {string|array} prop
     * @param {*} def
     * @returns {*}
     */
    function hashGet(E, prop, def) {
	if (!lib.utils.baseType(E, 'object') && !lib.utils.baseType(E, 'array')) return def;

	const parts = lib.array.to(prop, '.');
	if (!parts) {
            console.log('wasnt able to parse array from prop: ' + prop);
            return def;
	}

	let ptr = E;

	for (let i = 0; i < parts.length; i++) {
            const keyRaw = parts[i];

            // Must be traversable *as a container* to continue
            const ptrIsObj = lib.utils.baseType(ptr, 'object');
            const ptrIsArr = lib.utils.baseType(ptr, 'array');
            if (!ptrIsObj && !ptrIsArr) return def;

            // If current container is an array, prefer numeric index when key looks like an int.
            // Otherwise, treat as normal property access.
            let key = keyRaw;
            if (ptrIsArr) {
		// accept "0", "1", "2" ... (no negatives, no floats)
		// NOTE: arr["0"] works anyway; converting to number is mainly clarity + guards.
		if (typeof keyRaw === 'string' && /^[0-9]+$/.test(keyRaw)) {
                    key = parseInt(keyRaw, 10);
		}
            }

            const val = ptr[key];

            // Traverse if next value is object OR array
            const valIsObj = lib.utils.baseType(val, 'object');
            const valIsArr = lib.utils.baseType(val, 'array');

            if (valIsObj || valIsArr) {
		ptr = val;
		continue;
            }

            // Not traversable: if not at end, fail
            if (i < parts.length - 1) return def;

            // Last hop: undefined means "missing", everything else is valid
            return (val === undefined) ? def : val;
	}

	return ptr;
    }

    
    /*

    //legacy hash set. cannot do destructive setting. ironically, it works amazingly well on the dom tree where the new sauce doesn't.

    sets a property within the hash. uses the same property methodology  as getProperty.
    
    if a intervening hash key does not exist, it will not be created and will return 0
    else, returns 1 (success)
    */


    function legacySet(E, prop, value){
	//console.log('value is '+value);
	if (lib.utils.baseType(E,'object')) {

	    var parts = lib.array.to(prop,'.');
	    if (parts){
		var ptr = E;
		parts.forEach (function(item,index) {
		    var Type = lib.utils.baseType(  ptr[item]);
		    //console.log(item + ' ' + Type);
		    if (lib.utils.baseType(  ptr[item], 'object')) {
			ptr = ptr[item];
		    }else {
			if (index < parts.length -1 ){
			    console.log('cannot set property. unable to traverse object deeper at [\''+item + '\'] ... type is not object (' +Type+')' );
			    return 0;
			}else {
			    ptr[item] = value;
			    return 1;
			}
		    }
		    
		    
		} );

		
	    }else {
		console.log('wasnt able to parse array from prop: '+prop);
		return 0;
		E[prop] = value;
		return 1;
	    }
	}else {
	    return 0;
	}
    }

    /**
     * Set a deep property on an object using a dotted path, creating missing
     * intermediate containers as needed.
     *
     * Locked behavior:
     * - Default: all segments are treated as object keys (e.g. "2" is key "2").
     * - If opts.arrayIndex === true:
     *   - non-negative integer segments ("0","1","2",...) are treated as array indexes
     *     ONLY when creating a missing container (or when the current container is already an array).
     *   - never coerces an existing object into an array.
     * - Negative integers and non-integers are always treated as string keys.
     *
     * @param {Object|Array} rec
     * @param {string|string[]} prop Dotted path ("a.b.c") or path array (["a","b","c"])
     * @param {*} value
     * @param {Object} [opts]
     * @param {boolean} [opts.arrayIndex=false]
     * @returns {Object|Array|*} mutated record (or `value` if path is empty)
     */
    function hashSet(rec, prop, value, opts) {
	opts = to(opts, 'arrayIndex');
	const useArrayIndex = opts.arrayIndex === true;

	if (prop === 0) prop = "0"; //lib.array.to always coerces to [] minimally
	prop = lib.array.to(prop, '.');
	if (!prop.length) return value;

	const isIndex = (s) =>
              (typeof s === 'string' || typeof s === 'number') &&
              /^(0|[1-9]\d*)$/.test(String(s));

	// normalize root container (allow array root if first segment is index)
	if (!lib.utils.baseType(rec, ['object', 'array'])) {
            rec = (useArrayIndex && isIndex(prop[0])) ? [] : {};
	}

	const head = prop[0];
	const tail = prop.slice(1);
	const last = tail.length === 0;

	const key =
              (useArrayIndex && Array.isArray(rec) && isIndex(head))
              ? Number(head)
              : String(head);

	if (last) {
            rec[key] = value;
            return rec;
	}

	let next = rec[key];

	// IMPORTANT: arrays are valid containers; don't clobber them
	if (!lib.utils.baseType(next, ['object', 'array'])) {
            const nextSeg = tail[0];
            next = (useArrayIndex && isIndex(nextSeg)) ? [] : {};
            rec[key] = next;
	}

	hashSet(next, tail, value, opts);
	return rec;
    }

    /**
     * Check whether a deep property path exists.
     *
     * Semantics:
     * - Structural existence check by default.
     * - Falsy values (undefined, null, false, 0) are valid unless `truthy` is set.
     * - Supports array indexes in paths ("a.0.b").
     *
     * Options:
     * - truthy {boolean|number}:
     *     If true, requires the resolved value to be truthy.
     *
     * @param {Object|Array} rec
     * @param {string|Array<string|number>} prop
     * @param {Object|boolean} [opts]
     * @returns {boolean}
     */
    function exists(rec, prop, opts) {
	opts = to(opts, 'truthy');
	const requireTruthy = opts.truthy === true;

	if (!lib.utils.baseType(rec, ['object', 'array'])) return false;

	const parts = lib.array.to(prop, '.');
	let ptr = rec;

	for (let i = 0; i < parts.length; i++) {
            const keyRaw = parts[i];

            if (!lib.utils.baseType(ptr, ['object', 'array'])) {
		return false;
            }

            let key = keyRaw;
            if (Array.isArray(ptr) && /^[0-9]+$/.test(String(keyRaw))) {
		key = Number(keyRaw);
            }

            if (!(key in ptr)) {
		return false;
            }

            ptr = ptr[key];
	}

	return requireTruthy ? !!ptr : true;
    }    
    /**
     * Expand a list of property paths from an object into an array of values.
     *
     * - `exp` may be a space-delimited string or an array of strings.
     * - String form is split on whitespace.
     * - Array form is treated as literal entries (no splitting).
     * - Each entry is resolved via lib.hash.get (deep paths supported).
     *
     * @param {Object} opts
     * @param {string|Array<string>} exp
     * @returns {Array<any>}
     */
    function expand(opts, exp) {
	const list = lib.array.to(exp, /\s+/);
	const rv = [];

	for (let i = 0; i < list.length; i++) {
	    rv.push(hashGet(opts, list[i]));
	}
	return rv;
    }    


    /**
     * Shallow key/value decoration helper.
     *
     * - When `key === 1`, decorates keys with `pre` and `post`.
     * - Otherwise, decorates string/number values only.
     * - Non-scalar values are passed through unchanged.
     * - Input is not mutated.
     *
     * @param {Object} input
     * @param {string} [pre=""]
     * @param {string} [post=""]
     * @param {number} [key=0]  If truthy, operate on keys instead of values
     * @returns {Object|undefined}
     */
    function hashAppend(input, pre = "", post = "", key = 0) {
	if (!is(input)) return undefined;

	const output = {};
	const keys = Object.keys(input);

	for (const k of keys) {
	    const val = input[k];

	    if (key) {
		output[pre + k + post] = val;
	    } else if (lib.utils.baseType(val, ["string", "number"])) {
		output[k] = pre + val + post;
	    } else {
		output[k] = val;
	    }
	}

	return output;
    }
    

    /**
     * Flatten a nested hash or array into a shallow key/value object.
     *
     * Rules:
     * - Objects use `opts.delim` between keys (default ".")
     * - Arrays use `opts.array` between parent and index (default ".")
     * - Scalar values become leaf entries
     *
     * Examples:
     *   flatten({ a: { b: 1 } })
     *   → { "a.b": 1 }
     *
     *   flatten({ a: [ { b: 1 }, 2 ] })
     *   → { "a.0.b": 1, "a.1": 2 }
     *
     * Options:
     * - prefix : internal recursion prefix (string)
     * - delim  : object key delimiter (string, default ".")
     * - array  : array index delimiter (string, default ".")
     *
     * Notes:
     * - Non-hash / non-array inputs return undefined.
     * - Enumeration order follows native `for...in` behavior (legacy-safe).
     *
     * @param {Object|Array} rec   Input structure to flatten
     * @param {string|Object} [opts]  Optional config or config string
     * @returns {Object|undefined}
     */
    function flatten(rec, opts) {
	let out = {};

	opts = Object.assign(
	    { prefix: "", delim: ".", array: "." },
	    parseStringSimple(opts) || {}
	);

	// preserve your legacy prefix logic
	let prefix = lib.utils.isEmpty(opts.prefix) ? "" : opts.prefix;

	if (lib.array.is(rec)) {
	    for (const i in rec) {
		const v = rec[i];

		if (lib.utils.isScalar(v)) {
		    out[prefix + opts.array + i] = v;
		} else {
		    const val = flatten(v, Object.assign({}, opts, { prefix: prefix + opts.array + i }));
		    // FIX: merge returned flat keys into out (do NOT assign a merged object to one key)
		    out = Object.assign({}, out, val);
		}
	    }
	    return out;
	}

	if (is(rec)) {
	    const nextPrefix =
		  prefix === "" ? "" : prefix + (opts.delim || "");

	    for (const key in rec) {
		const v = rec[key];

		if (lib.utils.isScalar(v)) {
		    out[nextPrefix + key] = v;
		} else {
		    const val = flatten(
			v,
			Object.assign({}, opts, { prefix: nextPrefix + key })
		    );
		    out = Object.assign({}, out, val);
		}
	    }
	    return out;
	}

	return undefined;
    }
    



    /**
     * Inflate a flat hash of key/value pairs into a nested object.
     *
     * Example:
     *   inflate({ "a.b": 1, "c.d.e": 2 })
     *   → { a: { b: 1 }, c: { d: { e: 2 } } }
     *
     * Config:
     * - config.delim (default "."):
     *   If provided, occurrences of `delim` in each key are converted to "." before
     *   passing into lib.hash.set (which interprets "." as a path separator).
     *
     * Notes:
     * - Returns undefined unless `rec` is a hash.
     * - Values are assigned as-is (no cloning).
     * - Later keys can overwrite earlier branches depending on lib.hash.set behavior.
     *
     * @param {Object} rec
     * @param {string|Object} [config]  String parsed by parseStringSimple, or an object.
     * @returns {Object|undefined}
     */
    function inflate(rec, config) {
	if (!is(rec)) return undefined;

	const out = {};
	config = Object.assign({}, { delim: "." }, parseStringSimple(config) || {});

	for (const key in rec) {
	    // If delim is ".", this is a no-op and preserves original behavior.
	    // Avoid String.prototype.replaceAll for wider ES6 compatibility.
	    const tKey = config.delim ? String(key).split(config.delim).join(".") : key;
	    hashSet(out, tKey, rec[key]);
	}

	return out;
    }


    // leaving this here unlinked, b/c it will eventually be replaced with slackparse.
    /**
     * Parse a simple delimited key/value string into an object.
     *
     * Supported formats:
     * - Pairs are separated by semicolons (`;`)
     * - Keys and values may be separated by `:` or `=`
     * - The first valid separator in each pair is used
     *
     * Examples:
     *   "a:1; b=2"        → { a: "1", b: "2" }
     *   "foo=bar;baz:qux" → { foo: "bar", baz: "qux" }
     *
     * Behavior notes:
     * - If `str` is already a hash, it is returned as-is.
     * - Empty or non-string input returns `undefined`.
     * - Whitespace is trimmed from keys and values.
     * - Invalid fragments (no `:` or `=`) are ignored.
     * - Values are always returned as strings.
     *
     * This is a lightweight legacy helper and will eventually
     * be replaced by a more robust parser.
     *
     * @param {string|Object|undefined} str
     * @returns {Object|undefined}
     */
    function parseStringSimple(str = undefined) {
	if (is(str)) return str;

	str = lib.utils.toString(str);
	if (lib.utils.isEmpty(str)) return undefined;

	const out = {};
	const parts = str.split(";");

	for (let p of parts) {
	    p = p.trim();
	    const pc = p.indexOf(":");
	    const pe = p.indexOf("=");

	    if (pc < 1 && pe < 1) continue;

	    const subdelim =
		  (pc === -1) ? "=" :
		  (pe === -1) ? ":" :
		  (pc < pe) ? ":" : "=";

	    const pair = p.split(subdelim, 2);
	    const key = (pair[0] !== undefined) ? String(pair[0]).trim() : "";
	    const value = (pair[1] !== undefined) ? String(pair[1]).trim() : "";

	    out[key] = value;
	}

	return out;
    }


    /**
     * Deep-strip unwanted values from a hash/array structure.
     *
     * Total-function design:
     * - Always returns a value (or undefined only when explicitly compacting away an empty container).
     * - Does NOT mutate the input.
     *
     * Default behavior (LOCKED):
     * - Removes ONLY `undefined` values.
     * - Preserves: null, false, 0, "".
     * - Recurses into plain hashes and arrays.
     * - Does NOT compact containers unless requested.
     *
     * Options:
     * - strip: Array<any>
     *     Values to remove using strict equality (===). Default: [undefined]
     *
     * - compact: boolean
     *     Sugar for { compactArrays:true, compactObjects:true }
     *
     * - compactArrays: boolean
     *     If true, removed array entries are omitted and arrays are reindexed.
     *     If false, array positions are preserved (removed entries become undefined).
     *
     * - compactObjects: boolean
     *     If true, empty objects/arrays encountered as children are removed from parents.
     *     If false, empty containers are preserved.
     *
     * Notes:
     * - "Plain hash" detection uses lib.hash.is (lib.hash.is).
     * - Arrays are treated as arrays; objects with numeric keys are NOT converted.
     *
     * @param {*} value
     * @param {Object} [opts]
     * @returns {*}
     */
    function strip(value, opts) {
	opts = to(opts);

	// Defaults
	const stripList = Array.isArray(opts.strip) ? opts.strip : [undefined];

	const compact = (opts.compact === true);
	const compactArrays = (opts.compactArrays === true) || compact;
	const compactObjects = (opts.compactObjects === true) || compact;

	const shouldStrip = (v) => {
            for (let i = 0; i < stripList.length; i++) {
		if (v === stripList[i]) return true;
            }
            return false;
	};

	const isEmptyContainer = (v) => {
            if (Array.isArray(v)) return v.length === 0;
            if (is(v)) return Object.keys(v).length === 0;
            return false;
	};

	const walk = (v) => {
            // Strip leaf
            if (shouldStrip(v)) return undefined;

            // Array
            if (Array.isArray(v)) {
		if (!v.length) return v; // preserve empty array unless parent compacts it

		if (compactArrays) {
                    const out = [];
                    for (let i = 0; i < v.length; i++) {
			const child = walk(v[i]);
			if (child === undefined) continue;

			// if compactObjects, allow child container to disappear
			if (compactObjects && isEmptyContainer(child)) continue;

			out.push(child);
                    }
                    return out;
		}

		// preserve indices
		const out = new Array(v.length);
		for (let i = 0; i < v.length; i++) {
                    const child = walk(v[i]);
                    out[i] = child; // may be undefined (by design)
		}
		return out;
            }

            // Plain hash
            if (is(v)) {
		const out = {};
		for (const k in v) {
                    const child = walk(v[k]);
                    if (child === undefined) continue;

                    if (compactObjects && isEmptyContainer(child)) continue;

                    out[k] = child;
		}
		return out;
            }

            // Other types: return as-is
            return v;
	};


	const out = walk(value);

	// If compactObjects is on and the root becomes an empty container, allow it to vanish.
	if (compactObjects && isEmptyContainer(out)) return undefined;

	return out;
    }

    
    /**
     * Check that an object has all of the given keys / paths.
     *
     * Semantics:
     * - `obj` must be a plain hash.
     * - `keys` may be an array or whitespace-delimited string.
     * - Each key/path is checked via lib.hash.exists (deep paths supported).
     * - If opts.truthy is true, values must exist AND be truthy.
     *
     * @param {Object} obj
     * @param {string|Array<string>} keys
     * @param {Object|boolean} [opts]
     * @returns {boolean}
     */
    function hasKeys(obj, keys, opts) {
        if (!is(obj)) return false;

        opts = to(opts, 'truthy');
        const list = lib.array.to(keys, /\s+/);

        for (let i = 0; i < list.length; i++) {
            if (!exists(obj, list[i], opts)) return false;
        }
        return true;
    }
    
    const disp = {
	get: hashGet,
	set: hashSet,
	legacySet: legacySet,
	expand: expand,
	to,
	is,
	hasKeys,
	append:hashAppend,
	merge:merge,
	flatten: flatten,
	inflate: inflate,
	exists,
	strip
    };

    return disp;
    

}
export default make;


# --- end: lib/hash.js ---



# --- begin: lib/require.js ---

// lib/require.js
/**
 * Dependency gate / resolver utilities.
 *
 * Purpose:
 * - Validate that dot-path targets exist on a root object
 * - Optionally return resolved values (array or map)
 * - Designed for bootstrap + runtime dependency checks
 *
 * Default semantics (m7):
 * - "exists" means: path resolves to a non-nullish value (NOT null/undefined)
 * - If opts.allowFalsy === false, the leaf must be truthy (!!val)
 */

export function make(lib) {
    /**
     * Require targets on an arbitrary root object.
     *
     * @param {Object} root
     * @param {string|Array<string>} targets
     * @param {Object|boolean} [opts]
     * @param {string}  [opts.mod='[require]']
     * @param {boolean} [opts.allowFalsy=true]  // true => allow false/0/"" but not null/undefined
     * @param {boolean} [opts.returnMap=false]
     * @param {boolean} [opts.die=true]         // if false, returns partial results (no throw)
     * @returns {Array<any>|Object}
     */
    function all(targets, opts) {
	opts = lib.hash.to(opts, "mod");

	const mod        = lib.hash.get(opts, "mod", "[require]");
	const allowFalsy = lib.hash.get(opts, "allowFalsy", true);
	const returnMap  = lib.hash.get(opts, "returnMap", false);
	const die        = lib.hash.get(opts, "die", true);

	// root is lib itself (by design)
	const root = lib;

	const list = lib.array.to(targets, /\s+/);

	const outArr = [];
	const outMap = {};
	const missing = [];

	for (const path of list) {
            // fast structural existence check
            if (!lib.hash.exists(root, path)) {
		missing.push(path);
		continue;
            }

            const val = lib.hash.get(root, path);

            // m7 default: must not be nullish
            const ok = allowFalsy
		  ? (val !== undefined && val !== null)
		  : !!val;

            if (!ok) {
		missing.push(path);
		continue;
            }

            outArr.push(val);
            outMap[path] = val;
	}

	if (missing.length && die) {
            throw new Error(
		`${mod} missing required targets: ${missing.join(", ")}`
            );
	}

	return returnMap ? outMap : outArr;
    }
    /**
     * Require targets on the main lib object.
     *
     * @param {string|Array<string>} targets
     * @param {Object|boolean} [opts]
     * @returns {Array<any>|Object}
     */
    function libReq(targets, opts) {
        return all(lib, targets, opts);
    }

    /**
     * Require one or more registered services.
     *
     * Semantics (m7):
     * - Service must exist in lib.service.services
     * - Default: service value must be non-nullish
     * - Optionally require truthy service entries
     *
     * @param {string|Array<string>} names
     * @param {Object|boolean} [opts]
     * @returns {Array<any>|Object}
     */
    function service(names, opts) {
	opts = lib.hash.to(opts, "mod");

	const mod        = lib.hash.get(opts, "mod", "[require.service]");
	const allowFalsy = lib.hash.get(opts, "allowFalsy", true);
	const returnMap  = lib.hash.get(opts, "returnMap", false);
	const die        = lib.hash.get(opts, "die", true);

	if (!lib.service || !lib.utils.baseType(lib.service.services, "object")) {
            if (die) throw new Error(`${mod} lib.service unavailable`);
            return returnMap ? {} : [];
	}

	const list = lib.array.to(names, /\s+/);

	const outArr = [];
	const outMap = {};
	const missing = [];

	for (const name of list) {
            const svc = lib.service.get(name);

            const ok = allowFalsy
		  ? (svc !== undefined && svc !== null)
		  : !!svc;

            if (!ok) {
		missing.push(name);
		continue;
            }

            outArr.push(svc);
            outMap[name] = svc;
	}

	if (missing.length && die) {
            throw new Error(`${mod} missing required services: ${missing.join(", ")}`);
	}

	return returnMap ? outMap : outArr;
    }

    
    return {
        all,
        lib: libReq,
	service
    };
}

export default make;


# --- end: lib/require.js ---



# --- begin: lib/service.js ---

// lib/service.js
export function make(lib) {
    const services = {};

    function set(name, svc) { services[name] = svc; return svc; }
    function get(name) { return services[name]; }
    function list() {
	return Object.keys(services);
    }
    // optional conventions (not required)
    function start(name, ...args) {
	const s = services[name];
	if (s && typeof s.start === "function") return s.start(...args);
	return s;
    }

    function stop(name, ...args) {
	const s = services[name];
	if (s && typeof s.stop === "function") return s.stop(...args);
	return s;
    }

    return { services, set, get, start, stop,list };
}
export default make;


# --- end: lib/service.js ---



# --- begin: lib/str.js ---

//lib/str.js

export function make(lib){
    /**
       simple alias to base type.
     */
    function is(v) {
	return lib.utils.baseType(v, 'string');
    }
    /**
     * Coerce a value to a string (legacy-safe, normalized).
     *
     * Semantics (DO NOT change lightly):
     * - If v is string, number, or boolean → returns String(v)
     * - If opts.lc → lowercases the resulting string
     * - Otherwise returns undefined
     * - If opts.force is truthy → returns "" instead of undefined
     *
     * Options shortcut:
     * - If opts is not an object, it is treated as { force: opts }
     *
     * @param {*} v
     * @param {Object|number|boolean} [opts]
     * @returns {string|undefined}
     */
    function to(v, opts) {
	const o = lib.hash.to(opts, 'force');

	if (lib.utils.baseType(v, ["boolean", "number", "string"])) {
            let s = String(v);
            if (o.lc) s = s.toLowerCase();
            return s;
	}

	return o.force ? "" : undefined;
    }

    /**
     * Lowercase helper with optional forced coercion.
     *
     * Semantics (LOCKED):
     * - If `v` is scalar → returns lowercase string
     * - If `v` is NOT scalar:
     *     - returns undefined unless `force === true`
     * - If `force === true`:
     *     - coerces value to string and lowercases it
     *
     * This is a normalization helper — callers should not need to validate input.
     *
     * @param {*} v
     * @param {boolean} [force=false]
     * @returns {string|undefined}
     */
    function lc(v, force = false) {
	if (!lib.utils.isScalar(v) && !force) return undefined;
	return String(v).toLowerCase();
    }   


    /**
     * Strip JavaScript-style comments from source text.
     *
     * IMPORTANT LIMITATIONS (BY DESIGN):
     * -----------------------------------
     * This function performs simple regex-based comment stripping.
     * It is NOT a tokenizer or parser and is NOT syntax-aware.
     *
     * As a result, it WILL produce incorrect output in cases such as:
     * - URLs containing "//" (e.g. "https://example.com")
     * - Comment-like text inside string literals
     * - Regex literals containing comment markers
     * - Template strings containing comment markers
     *
     * This is intentional.
     * For correct lexical handling, a real parser/tokenizer is required.
     * That functionality belongs in a proper parsing/compiler layer,
     * not in this utility.
     *
     * Supported modes (via opts.strip):
     * - 1 or "a" : strip all comments (default)
     * - "m"      : strip multi-line comments only (/* ... *\/)
     * - "s"      : strip single-line comments only (// ...)
     * - Combinations allowed (e.g. "ms")
     *
     * Options may be passed as:
     * - scalar: stripComments(text, 1)
     * - string: stripComments(text, "m")
     * - hash  : stripComments(text, { strip: "s" })
     *
     * Use cases:
     * - Cleaning trusted source blobs
     * - Pre-processing loader input
     * - Removing comments from controlled config/code
     *
     * NOT suitable for:
     * - Arbitrary JavaScript source
     * - Security-sensitive transformations
     * - Anything requiring syntactic correctness
     *
     * @param {string} data
     * @param {string|number|Object} [opts]
     * @returns {string}
     */
    function stripComments(data, opts) {
	let cleaned = data;

	opts = lib.hash.to(opts, 'strip');
	if (!opts.strip) opts.strip = 1;

	
	const mode = to(opts.strip, 1);

	if (mode.match(/1|a|m/i)) {
            cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ""); //multi
	}

	if (mode.match(/1|a|s/i)) {
            cleaned = cleaned.replace(/\/\/.*/g, ""); //single
	}

	return cleaned;
    }


    return {
	is,lc,to,stripComments
    };
    

}

export default make;


# --- end: lib/str.js ---



# --- begin: lib/utils.js ---

export function make(lib) {

    

    /**
     * Determine whether a value is a scalar (leaf value).
     *
     * Scalars are values with no internal structure to traverse.
     *
     * Included:
     * - string
     * - number
     * - boolean
     * - bigint
     * - symbol
     *
     * Excluded:
     * - null
     * - undefined
     * - objects
     * - arrays
     * - functions
     *
     * @param {*} v
     * @returns {boolean}
     */
    function isScalar(v) {
	const t = typeof v;
	return (
            t === 'string' ||
		t === 'number' ||
		t === 'boolean' ||
		t === 'bigint' ||
		t === 'symbol'
	);
    }
    



    /**
     * Determine the base type of a value, optionally comparing against allowed types.
     *
     * Dual-mode behavior (LOCKED):
     *
     * 1) Compare mode (when `comp` is provided or coercible to a non-empty array):
     *    - Returns `true` if the value’s base type matches ANY entry in `comp`.
     *    - Returns `false` otherwise.
     *
     * 2) Query mode (when `comp` is omitted or empty):
     *    - Returns a string describing the value’s base type.
     *
     * Type rules:
     * - `null` is treated as its own type: `"null"`
     * - Arrays are reported as `"array"` (instead of `"object"`)
     * - All other values use JavaScript `typeof`
     *
     * Legacy note (behavior change in v1.0):
     * - Older versions performed an early-return when `value === null`,
     *   causing comparison results to depend on the ORDER of `comp`.
     * - Example (legacy):
     *     baseType(null, ['object','null']) → false
     *     baseType(null, ['null','object']) → true
     * - Current behavior:
     *     baseType(null, ['object','null']) → true
     * - Matching is now order-independent and consistent with all other types.
     *
     * @param {*} value
     * @param {string|Array<string>} [comp]
     * @returns {boolean|string}
     */
    function baseType(value, comp) {
	const list = lib.array.to(comp,/\s+/);

	// Compare mode -> boolean
	if (list.length) {
            let type;

            if (value === null) {
		type = 'null';
            } else {
		type = typeof value;
		if (type === 'object' && Array.isArray(value)) {
                    type = 'array';
		}
            }

            for (let i = 0; i < list.length; i++) {
		if (String(list[i]).toLowerCase() === type) {
                    return true;
		}
            }
            return false;
	}

	// Query mode -> string
	if (value === null) return 'null';

	let type = typeof value;
	if (type === 'object' && Array.isArray(value)) {
            type = 'array';
	}
	return type;
    }
    
    /**
     * Determine whether a value should be treated as "empty".
     *
     * Semantics (INTENTIONAL, DO NOT EXPAND):
     * - `undefined` → empty (not provided)
     * - `null`      → empty (explicitly cleared)
     * - `""`        → empty (blank string)
     * - `false`     → empty (explicitly disabled / absent signal)
     *
     * Non-empty by design:
     * - `0`         → valid value
     * - `"0"`       → valid value
     * - `NaN`       → valid (still a value)
     * - `[]` / `{}` → valid containers
     *
     * This is NOT PHP-style `empty()` and must not be treated as such.
     *
     * @param {*} value
     * @returns {boolean}
     */
    function isEmpty(value) {
	return (
            typeof value === "undefined" ||
		value === null ||
		value === "" ||
		value === false
	);
    }
    
    
    /**
     * Classify a link-like value or test membership against allowed types.
     *
     * Dual-mode behavior (LOCKED):
     * 1) Classify mode (no `check`):
     *    - Returns a string type:
     *        - "hash"      : item is a plain object/hash
     *        - "absolute"  : string starts with "/" (absolute *path*)
     *        - "url"       : string starts with "http://" or "https://"
     *        - "relative"  : any other string
     *        - undefined   : not a hash and not a string
     *
     * 2) Predicate mode (`check` provided / non-empty):
     *    - Returns 1 if the detected type matches ANY entry in `check`, else 0.
     *
     * Notes:
     * - `check` is coerced via lib.array.to() so it can be a string, array, etc.
     * - No lowercasing/normalization is applied to `check` entries.
     *
     * @param {*} item
     * @param {string|Array<string>} [check=[]]
     * @returns {string|number|undefined}
     */
    function linkType(item, check = []) {
	let type;
	check = lib.array.to(check);

	if (lib.hash.is(item)) {
            type = "hash";
	} else if (baseType(item, "string")) {
            if (item.match(/^\//)) type = "absolute";
            else if (item.match(/^https?\:\/\//)) type = "url";
            else type = "relative";
	}

	if (check.length) {
            for (let i = 0; i < check.length; i++) {
		if (type === check[i]) return 1;
            }
            return 0;
	}

	return type;
    }



    

    
    return {
	isArray      : lib.array.is,
	toArray      : lib.array.to,

	isHash       : lib.hash.is,
	toHash       : lib.hash.to,

	isScalar     : isScalar,
	toString     : lib.str.to,
	baseType     : baseType,
	isEmpty      : isEmpty,

	linkType     : linkType,

	getFunction  : lib.func.get,
	stripComments: lib.str.stripComments,
	lc           : lib.str.lc
    };
}
export default make;


# --- end: lib/utils.js ---

