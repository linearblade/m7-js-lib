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

