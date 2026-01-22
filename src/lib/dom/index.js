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
