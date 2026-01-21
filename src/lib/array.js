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
