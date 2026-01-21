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
