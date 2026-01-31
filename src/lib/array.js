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
    
    function to_old(list, split) {
        if (!list) return [];
        if (is(list)) return list;
        // If a split token is provided and list is a string, split it (RegExp supported)
        if (!lib.utils.isEmpty(split) && typeof list === 'string') {
            return list.split(split);
        }

        return [list];
    }
    
    

    /**
     * Coerce any input into an array.
     *
     * Design:
     * - This is a TOTAL function: it never throws and always returns an Array.
     * - Coercion and normalization are preferred over validation or rejection.
     *
     * Contract (locked):
     * - ALWAYS returns an Array.
     * - Falsy values (null, undefined, false, 0, "") → [].
     * - Arrays are returned as-is unless trimming is explicitly enabled.
     * - If `opts.split` is provided and the input is a string, the string is split
     *   using the given string or RegExp.
     * - Otherwise, non-array input is wrapped into a single-element array.
     * - Optional trimming via `opts.trim` applies to string values only.
     *
     * Trimming semantics:
     * - When `opts.trim` is true:
     *   - Leading/trailing whitespace is removed from string values.
     *   - Empty strings ("") resulting from trimming or splitting are removed.
     * - Non-string elements are preserved as-is.
     *
     * Notes:
     * - This function performs no type enforcement beyond coercion.
     * - Returned arrays may be modified in-place by trimming.
     * - Intended for defensive normalization of configuration and user input.
     *
     * @param {*} list
     *     Value to coerce into an array.
     *
     * @param {Object} [opts]
     *     Optional coercion options.
     *
     * @param {string|RegExp} [opts.split]
     *     Token or RegExp used to split string input.
     *
     * @param {boolean} [opts.trim]
     *     If true, trim whitespace from string values and remove empty strings.
     *
     * @returns {Array}
     *     Normalized array representation of the input.
     */


    

    function to(list, opts) {
	opts = lib.hash.to(opts, "split");

	const split  = opts.split ? opts.split :  null;
	const doTrim = opts.trim  ? opts.trim  :  false;


	if (!list) return [];
	if (is(list)) return doTrim?arrayTrim(list):list;

	
	let out;

	//its not an array here, so just return.
	if (!lib.str.is(list))
	    return [list];
	
        if (doTrim) list = list.trim();
        out = split ? list.split(split) : [list];
	//now its definately an array.
	return doTrim?arrayTrim(out) : out;
    }

    /**
     * Coerce input into an array and trim whitespace from string elements.
     *
     * Contract:
     * - ALWAYS returns an Array.
     * - Non-array input is wrapped into a single-element array.
     * - String elements are trimmed.
     * - Empty strings ("") are removed after trimming.
     * - Non-string elements are preserved as-is.
     *
     * Notes:
     * - This function performs in-place modification on the returned array.
     * - If a scalar is passed, the original value is not mutated.
     * - This is a coercive normalization helper, not a validator.
     *
     * @param {*} input
     *     Value to normalize and trim.
     *
     * @returns {Array}
     *     Array with trimmed string elements and empty strings removed.
     */
    function arrayTrim(input) {
	const out = is(input) ? input : [input];

	let w = 0;
	for (let i = 0; i < out.length; i++) {
            const v = out[i];

            if (lib.str.is(v)) {
		const t = v.trim();
		if (t !== '') {
                    out[w++] = t;
		}
            } else {
		out[w++] = v;
            }
	}

	// truncate array in-place
	out.length = w;
	return out;
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
	trim : arrayTrim,
	is,
	to,
	len,
	filterStrings
    };
}

export default make;
