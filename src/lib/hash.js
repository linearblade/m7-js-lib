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
     * Test whether a value is an empty hash (plain object with no keys).
     *
     * Contract:
     * - Returns true ONLY if the value is a hash AND has zero enumerable keys.
     * - Returns false for null, undefined, non-objects, arrays, and non-empty hashes.
     *
     * @param {*} value
     * @returns {boolean}
     */
    function empty(value) {
	return lib.hash.is(value) && Object.keys(value).length === 0;
    }

    /**
     * Return the enumerable keys of a hash.
     *
     * Contract:
     * - Returns an array of keys ONLY if the value is a hash.
     * - Returns an empty array for all other inputs (null, undefined, arrays, primitives).
     * - Never throws.
     *
     * @param {*} value
     * @returns {Array<string>}
     */
    function keys(value) {
	return lib.hash.is(value) ? Object.keys(value) : [];
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
        if (!lib.utils.isEmpty(hotkey) && lib.str.is(hotkey) ) {
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
    
    function mergeMany(list, opts) {
	// Only keep actual hashes; lib.hash.merge returns undefined unless both are hashes
	list = lib.array.to(list).filter(x => lib.hash.is(x));
	
	if (list.length === 0) return {};
	
	let out = lib.utils.deepCopy(list[0]);
	
	for (let i = 1; i < list.length; i++) {
            out = lib.hash.merge(out, list[i], opts) || out;
	}
	return out;
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


    /**
     * Return the first non-null / non-undefined value found at any of the given paths.
     *
     * @param {Object} rec   Source object
     * @param {string|Array} list  Space-delimited paths or array of paths
     * @param {*} [def]     Default value if none found
     * @returns {*}
     */
    function getUntilNotEmpty(rec, list, def) {
	list = lib.array.to(list, /\s+/);

	for (let i = 0; i < list.length; i++) {
            const key = list[i];
            const val = lib.hash.get(rec, key);

            // Accept anything except null / undefined
            if (!lib.utils.baseType(val, "null undefined")) {
		return val;
            }
	}

	return def;
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
	mergeMany,
	flatten: flatten,
	inflate: inflate,
	exists,
	strip,
	getUntilNotEmpty,
	deepCopy,
	keys,
	empty
	
    };

    return disp;
    

}
export default make;
