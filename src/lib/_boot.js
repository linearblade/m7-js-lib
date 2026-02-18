// lib/_env.js
/**
 * Environment bootstrap helpers.
 *
 * Purpose:
 * - Derive a runtime root object (`globalThis` / `window` / `global`)
 * - Cache normalized runtime facts on `lib._env`
 *
 * Notes:
 * - This module intentionally avoids `lib.utils` to keep bootstrap dependencies minimal.
 * - `install()` mutates `lib` by writing `lib._env`.
 */
/**
 * Build the `_boot` helper namespace.
 *
 * @param {Object} lib
 * @returns {{
 *   install: Function,
 *   resolveRoot: Function
 * }}
 */
export function make(lib) {
    /**
     * Resolve the best-available root object.
     *
     * Resolution order:
     * 1) `explicit` (if provided/truthy)
     * 2) `globalThis`
     * 3) `window`
     * 4) `global`
     *
     * @param {*} [explicit]
     * @returns {Object|undefined}
     */
    function resolveRoot(explicit) {
        if (explicit) return explicit;
        if (typeof globalThis !== "undefined") return globalThis;
        if (typeof window !== "undefined") return window;
        if (typeof global !== "undefined") return global;
        return undefined;
    }

    /**
     * Install normalized environment metadata onto `lib._env`.
     *
     * Input normalization:
     * - If `opts` is not an object, it is treated as `{ root: opts }`.
     *
     * Output shape:
     * - `root`: resolved root object (or `undefined`)
     * - `isBrowser`: true when root looks browser-like (`document` + `location`)
     * - `isNode`: true when root contains `process.versions.node`
     * - `location`: cached `root.location` when browser-like, else `undefined`
     *
     * @param {Object|*} [opts={}]
     * @param {Object} [opts.root]
     * @returns {{
     *   root: Object|undefined,
     *   isBrowser: boolean,
     *   isNode: boolean,
     *   location: Location|undefined
     * }}
     */
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

    /**
     * Public dispatch surface for `lib._boot`.
     *
     * @type {{ install: Function, resolveRoot: Function }}
     */
    return { install, resolveRoot };
}
export default make;
