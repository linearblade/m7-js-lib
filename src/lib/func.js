//lib.func
/**
 * Function resolution and composition helpers.
 *
 * Purpose:
 * - Resolve callable targets from function refs or root-relative paths
 * - Build lightweight pre/post argument wrappers
 * - Provide a diagnostic caller-name helper
 *
 * Design notes:
 * - Lookup and composition are intentionally permissive.
 * - Failure defaults to `undefined` unless `dummy` fallback is requested.
 * - Helpers avoid throwing on lookup failures.
 */
/**
 * Build the `lib.func` helper namespace.
 *
 * Runtime dependencies used internally:
 * - `lib.hash` (normalization + path lookup)
 * - `lib.array` (path/list normalization)
 * - `lib.utils.getFunction` (used by wrapper/chain helpers at call-time)
 *
 * Initialization note:
 * - `make(lib)` may run before `lib.utils` is attached during bootstrap.
 * - This is valid because `wrapper` / `postWrap` / `preWrap` resolve
 *   `lib.utils.getFunction` only when those returned functions are invoked.
 *
 * @param {Object} lib
 * @returns {{
 *   name: Function,
 *   wrapper: Function,
 *   postWrap: Function,
 *   preWrap: Function,
 *   get: Function
 * }}
 */
export function make(lib){
    /**
     * Shared no-op fallback returned when `dummy` mode is enabled.
     *
     * @type {Function}
     */
    const DUMMY_FN = function () {};

    /**
     * Resolve a function target.
     *
     * Root resolution order:
     * 1) `opts.root`
     * 2) `lib._env.root`
     *
     * Contract (current behavior):
     * - If `f` is empty OR resolved root is missing:
     *   - returns `DUMMY_FN` when `opts.dummy` is truthy
     *   - otherwise returns `undefined`
     * - If `f` is a function and root exists: returns `f` as-is.
     * - If `f` is a string and root exists: resolves by dot-path lookup on root.
     * - If `opts.bind` is truthy and `f` is a path string:
     *   attempts to bind resolved function to its parent object.
     *
     * Notes:
     * - This is lookup only; it never invokes the result.
     * - Binding is best-effort and may silently fail for some native callables.
     * - Legacy positional `dummy` is supported through `lib.hash.to(opts, 'dummy')`.
     *
     * @param {Function|string|undefined|null} f
     * @param {Object|boolean|number} [opts]
     * @param {boolean|number} [opts.dummy]
     * @param {boolean} [opts.bind]
     * @param {Object} [opts.root]
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
     * Wrap one function with post-applied arguments.
     *
     * Contract:
     * - Resolves `fun` through `lib.utils.getFunction`.
     * - If resolution fails, returns `undefined`.
     * - Otherwise returns a function that calls:
     *   `fn(...runtimeArgs, ...tailArgs)`
     *
     * Notes:
     * - The returned function is an arrow function.
     * - Call-site `this` is not forwarded by this helper.
     *
     * @param {Function|string} fun
     * @param {...*} tailArgs
     * @returns {Function|undefined}
     */
    function wrapper(fun, ...tailArgs) {
	const fn = lib.utils.getFunction(fun);
	if (!fn) return undefined;
	
	return (...runtimeArgs) => fn(...runtimeArgs, ...tailArgs);
    }

    /**
     * `postWrap` and `preWrap` are small chain helpers retained for
     * compatibility and low-friction composition in legacy call paths.
     *
     * They intentionally:
     * - Resolve each chain entry at call-time (not wrap-time)
     * - Return `undefined` immediately if any function cannot be resolved
     * - Return the last function's return value when all resolutions succeed
     */

    /**
     * Wrap a function chain with post-applied arguments.
     *
     * Contract:
     * - `funs` is normalized via `lib.array.to(funs, /\\s+/)`.
     * - Returned function computes `callArgs = [...runtimeArgs, ...tailArgs]`.
     * - Each chain item is resolved with `lib.utils.getFunction(item)`.
     * - If any item fails to resolve, returns `undefined` immediately.
     * - Otherwise runs all resolved callables in order with identical `callArgs`,
     *   returning the last callable's return value.
     * - If chain list is empty, return value is `undefined`.
     *
     * @param {string|Array<Function|string>} funs
     * @param {...*} tailArgs
     * @returns {Function}
     */

    function postWrap(funs, ...tailArgs) {
    const list = lib.array.to(funs, /\s+/);

    return (...runtimeArgs) => {
        let rv;
        const callArgs = [...runtimeArgs, ...tailArgs];

        for (const item of list) {
            const fn = lib.utils.getFunction(item);
            if (!fn) return undefined;
            rv = fn(...callArgs);
        }

        return rv;
    };
}

    /**
     * Wrap a function chain with pre-applied arguments.
     *
     * Contract:
     * - `funs` is normalized via `lib.array.to(funs, /\\s+/)`.
     * - Returned function computes `callArgs = [...headArgs, ...runtimeArgs]`.
     * - Each chain item is resolved with `lib.utils.getFunction(item)`.
     * - If any item fails to resolve, returns `undefined` immediately.
     * - Otherwise runs all resolved callables in order with identical `callArgs`,
     *   returning the last callable's return value.
     * - If chain list is empty, return value is `undefined`.
     *
     * @param {string|Array<Function|string>} funs
     * @param {...*} headArgs
     * @returns {Function}
     */

    function preWrap(funs, ...headArgs) {
    const list = lib.array.to(funs, /\s+/);

    return (...runtimeArgs) => {
        let rv;
        const callArgs = [...headArgs, ...runtimeArgs];

        for (const item of list) {
            const fn = lib.utils.getFunction(item);
            if (!fn) return undefined;
            rv = fn(...callArgs);
        }

        return rv;
    };
}


    /**
     * Attempt to retrieve immediate caller info from the stack.
     *
     * Contract:
     * - Returns `undefined` if no stack is available or too short.
     * - Otherwise returns the trimmed third stack line (`lines[2]`).
     *
     * Caveats:
     * - Stack formats are engine- and build-dependent.
     * - Not suitable for control flow or durable identifiers.
     *
     * @returns {string|undefined}
     */
    function name() {
	const err = new Error();
	if (!err.stack) return undefined;

	const lines = err.stack.split('\n');
	if (lines.length < 3) return undefined;

	return lines[2].trim();
    }
    
    /**
     * Public dispatch surface for `lib.func`.
     *
     * @type {{
     *   name: Function,
     *   wrapper: Function,
     *   postWrap: Function,
     *   preWrap: Function,
     *   get: Function
     * }}
     */
    const disp = {
	name : name,
	wrapper : wrapper,
	postWrap: postWrap,
	preWrap: preWrap,
	get : getFunction
    };
    return disp;
}

export default make;
