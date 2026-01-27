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

    /**
     * Return array length, or 0 if not an array.
     *
     * @param {*} val
     * @returns {number}
     */
    function len(val){
	if(!lib.array.is(val) ) return 0;
	return val.length;
    }

    /**
     * Normalize an input into an array of non-empty strings.
     *
     * This helper is intentionally strict and predictable.
     * It is used to sanitize loosely-typed inputs such as selectors,
     * pipeline names, stack lists, and other config-driven string arrays.
     *
     * Behavior:
     * - Accepts a scalar or array input
     * - Strings are trimmed; empty strings are discarded
     * - Finite numbers may be converted to strings (enabled by default)
     * - Booleans may be converted to strings (disabled by default)
     * - All other types are ignored (objects, arrays, functions, null, etc.)
     *
     * @param {*} val
     *        Input value to normalize (string, number, boolean, array, or mixed).
     *
     * @param {Object} [opts]
     * @param {RegExp} [opts.splitter]
     *        Optional splitter used when normalizing string input.
     *
     * @param {boolean} [opts.numbers=true]
     *        Whether finite numbers should be converted to strings.
     *
     * @param {boolean} [opts.booleans=false]
     *        Whether booleans should be converted to strings.
     *
     * @returns {string[]}
     *          Array of sanitized, non-empty strings.
     */
    function filterStrings(val, opts = {}) {
	opts = lib.hash.to(opts, 'splitter');
	const allowNumbers = (opts.numbers !== false);
	const allowBooleans = !!opts.booleans;
	const splitter = opts.splitter;

	const list = lib.array.to(val, splitter);

	const out = [];

	for (let i = 0; i < list.length; i++) {
            const v = list[i];

            if (typeof v === "string") {
		const s = v.trim();
		if (s) out.push(s);
		continue;
            }

            if (allowNumbers && typeof v === "number" && Number.isFinite(v)) {
		out.push(String(v));
		continue;
            }

            if (allowBooleans && typeof v === "boolean") {
		out.push(String(v));
		continue;
            }

            // everything else is intentionally dropped:
            // objects, arrays, functions, null, undefined, symbols
	}

	return out;
    }    
    return {
        append: arrayAppend,
        subtract: arraySubtract,
	is,
	to,
	len,
	filterStrings
    };
}

export default make;
