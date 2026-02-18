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
/**
 * Build the `lib.args` helper namespace.
 *
 * @param {Object} lib
 * @returns {{
 *   slice: Function,
 *   parse: Function,
 *   isArguments: Function
 * }}
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
	//console.log(args);
	args = lib.hash.is(args) && !isArguments(args) ?lib.array.to(args) : lib.array.to(slice(args)); //convert potential 'Arguments' to array
	//console.log(args);
	const parms = lib.array.to(opts['parms'], {split:/\s+/,trim:true});
	const req = lib.array.to(opts['req'], {split:/\s+/,trim:true});	
	//console.log('>>',args, parms,req,opts['req'],'<<');
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
    
    /**
     * Public dispatch surface for `lib.args`.
     */
    return  {	slice,parse,isArguments    };
}
export default make;
