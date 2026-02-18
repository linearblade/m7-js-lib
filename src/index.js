// index.js
import make_boot from "./lib/_boot.js";

import make_bool from "./lib/bool.js";
import make_array from "./lib/array.js";
import make_hash from "./lib/hash.js";
import make_number from "./lib/number.js";

import make_utils from "./lib/utils.js";
import make_str from "./lib/str.js";
import make_func from "./lib/func.js";

import make_dom from "./lib/dom/index.js";
import make_args from "./lib/args.js";

import make_http from "./lib/_http.js";
import make_service from "./lib/service.js";
import make_require from './lib/require.js';
const lib = {};
const state = {
    initialized: false,
    initializing: false
};

Object.defineProperty(lib, "_initialized", {
    value: false,
    writable: true,
    enumerable: false
});

export default lib;
export { lib };

export function init(opts = {}) {
    opts = (opts && typeof opts === "object") ? opts : { force: !!opts };
    const force = opts.force === true;

    if (state.initialized && !force) return lib;
    if (state.initializing && !force) {
        throw new Error("[lib.init] Initialization already in progress");
    }

    if (force && state.initializing) {
        throw new Error("[lib.init] Cannot force re-init while initialization is in progress");
    }

    if (force && state.initialized) {
        for (const key of Object.keys(lib)) {
            delete lib[key];
        }
        lib._initialized = false;
        state.initialized = false;
    }

    state.initializing = true;

    try {
        // ─────────────────────────────────────────
        // boot / startup utilities (no deps)
        // ─────────────────────────────────────────

        // attach boot logic (functions live here)
        lib._boot = make_boot(lib);

        // run boot once at startup (populates lib._env)
        lib._boot.install();

        // ─────────────────────────────────────────
        // Core / primitive utilities (minimal deps)
        // ─────────────────────────────────────────

        lib.bool   = make_bool(lib);
        lib.array  = make_array(lib);
        lib.hash   = make_hash(lib);
        lib.number = make_number(lib);
        lib.str    = make_str(lib);
        lib.func   = make_func(lib);

        // ─────────────────────────────────────────
        // Utility layers (depend on primitives)
        // ─────────────────────────────────────────

        // utils currently contains core normalizers (baseType/isEmpty/etc) + aliases
        lib.utils = make_utils(lib);



        // ─────────────────────────────────────────
        // DOM layer (depends on utils/func/hash/array)
        // ─────────────────────────────────────────

        lib.dom = make_dom(lib);
        //lib.hash.set(lib,'dom.create', make_dom_create(lib) );
        //lib.hash.set(lib,'dom.append', make_dom_append(lib) );

        // ─────────────────────────────────────────
        // facilities and services  (depends on hash/array/dom/utils)
        // ─────────────────────────────────────────
        lib.service = make_service(lib);
        lib.require = make_require(lib);

        // ─────────────────────────────────────────
        // Args helper (depends on hash/array/dom/utils)
        // ─────────────────────────────────────────

        lib.args = make_args(lib);

        // ─────────────────────────────────────────
        // Transport / IO (depends on _env + hash/array/func)
        // ─────────────────────────────────────────

        lib._http = make_http(lib);

        state.initialized = true;
        lib._initialized = true;

        return lib;
    } catch (err) {
        for (const key of Object.keys(lib)) {
            delete lib[key];
        }
        lib._initialized = false;
        state.initialized = false;
        throw err;
    } finally {
        state.initializing = false;
    }
}
