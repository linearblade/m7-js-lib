// src/index.js
const lib = {};

export default lib;
export { lib };

// ─────────────────────────────────────────
// boot / startup utilities (no deps)
// ─────────────────────────────────────────

import make_boot from "./lib/_boot.js";
// attach boot logic (functions live here)
lib._boot = make_boot(lib);
// run boot once at startup (populates lib._env)
lib._boot.env();

// ─────────────────────────────────────────
// Core / primitive utilities (no deps)
// ─────────────────────────────────────────

import make_bool   from './lib/bool.js';
import make_array  from './lib/array.js';
import make_hash   from './lib/hash.js';
import make_json   from './lib/json.js';
import make_js     from './lib/js.js';

lib.bool  = make_bool(lib);
lib.array = make_array(lib);
lib.hash  = make_hash(lib);
lib.json  = make_json(lib);
lib.js    = make_js(lib);

// ─────────────────────────────────────────
// Argument + utility helpers
// (depend on array / hash / bool)
// ─────────────────────────────────────────

import make_args   from './lib/args.js';
import make_utils  from './lib/utils.js';

lib.args  = make_args(lib);
lib.utils = make_utils(lib);

// ─────────────────────────────────────────
// Function / event helpers
// (depend on utils / args / hash)
// ─────────────────────────────────────────

import make_func   from './lib/func.js';
import make_event  from './lib/event.js';

lib.func  = make_func(lib);
lib.event = make_event(lib);

// ─────────────────────────────────────────
// DOM layer
// (depends on utils / func / event / array)
// ─────────────────────────────────────────

import make_dom from './lib/dom/index.js';

lib.dom = make_dom(lib);

// ─────────────────────────────────────────
// Transport / IO
// (depends on args / utils / func / hash)
// ─────────────────────────────────────────

import make_http     from './lib/_http.js';
import make_request  from './lib/request.js';
import make_sync     from './lib/sync.js';

lib._http   = make_http(lib);
lib.request = make_request(lib);
lib.sync    = make_sync(lib);

// ─────────────────────────────────────────
// Repo / remote loaders
// (depends on request / hash / utils)
// ─────────────────────────────────────────

import make_repo    from './lib/repo.js';
import make_remote  from './lib/remote/wrapper.js';

lib.repo   = make_repo(lib);
lib.remote = make_remote(lib);

// ─────────────────────────────────────────
// App / bootstrap helpers (optional)
// ─────────────────────────────────────────

import make_bootstrap_append from './lib/app/bootstrap/append.js';

lib.app = lib.app || {};
lib.app.bootstrap = lib.app.bootstrap || {};
lib.app.bootstrap.append = make_bootstrap_append(lib);

// ─────────────────────────────────────────
// END
// ─────────────────────────────────────────
