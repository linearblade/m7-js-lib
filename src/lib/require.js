// lib/require.js
/**
 * Dependency gate / resolver utilities.
 *
 * Purpose:
 * - Validate that dot-path targets exist on a root object
 * - Optionally return resolved values (array or map)
 * - Designed for bootstrap + runtime dependency checks
 *
 * Default semantics (m7):
 * - "exists" means: path resolves to a non-nullish value (NOT null/undefined)
 * - If opts.allowFalsy === false, the leaf must be truthy (!!val)
 */
/**
 * Build the `lib.require` helper namespace.
 *
 * @param {Object} lib
 * @returns {{
 *   all: Function,
 *   lib: Function,
 *   service: Function
 * }}
 */
export function make(lib) {
    /**
     * Require targets on the main `lib` object.
     *
     * @param {string|Array<string>} targets
     * @param {Object|boolean} [opts]
     * @param {string}  [opts.mod='[require]']
     * @param {boolean} [opts.allowFalsy=true]  // true => allow false/0/"" but not null/undefined
     * @param {boolean} [opts.returnMap=false]
     * @param {boolean} [opts.die=true]         // if false, returns partial results (no throw)
     * @returns {Array<any>|Object}
     */
    function all(targets, opts) {
	opts = lib.hash.to(opts, "mod");

	const mod        = lib.hash.get(opts, "mod", "[require]");
	const allowFalsy = lib.hash.get(opts, "allowFalsy", true);
	const returnMap  = lib.hash.get(opts, "returnMap", false);
	const die        = lib.hash.get(opts, "die", true);

	// root is lib itself (by design)
	const root = lib;

	const list = lib.array.to(targets, /\s+/);

	const outArr = [];
	const outMap = {};
	const missing = [];

	for (const path of list) {
            // fast structural existence check
            if (!lib.hash.exists(root, path)) {
		missing.push(path);
		continue;
            }

            const val = lib.hash.get(root, path);

            // m7 default: must not be nullish
            const ok = allowFalsy
		  ? (val !== undefined && val !== null)
		  : !!val;

            if (!ok) {
		missing.push(path);
		continue;
            }

            outArr.push(val);
            outMap[path] = val;
	}

	if (missing.length && die) {
            throw new Error(
		`${mod} missing required targets: ${missing.join(", ")}`
            );
	}

	return returnMap ? outMap : outArr;
    }

    /**
     * Require one or more registered services.
     *
     * Semantics (m7):
     * - Service must exist in lib.service.services
     * - Default: service value must be non-nullish
     * - Optionally require truthy service entries
     *
     * @param {string|Array<string>} names
     * @param {Object|boolean} [opts]
     * @returns {Array<any>|Object}
     */
    function service(names, opts) {
	opts = lib.hash.to(opts, "mod");

	const mod        = lib.hash.get(opts, "mod", "[require.service]");
	const allowFalsy = lib.hash.get(opts, "allowFalsy", true);
	const returnMap  = lib.hash.get(opts, "returnMap", false);
	const die        = lib.hash.get(opts, "die", true);

	if (!lib.service || !lib.utils.baseType(lib.service.services, "object")) {
            if (die) throw new Error(`${mod} lib.service unavailable`);
            return returnMap ? {} : [];
	}

	const list = lib.array.to(names, /\s+/);

	const outArr = [];
	const outMap = {};
	const missing = [];

	for (const name of list) {
            const svc = lib.service.get(name);

            const ok = allowFalsy
		  ? (svc !== undefined && svc !== null)
		  : !!svc;

            if (!ok) {
		missing.push(name);
		continue;
            }

            outArr.push(svc);
            outMap[name] = svc;
	}

	if (missing.length && die) {
            throw new Error(`${mod} missing required services: ${missing.join(", ")}`);
	}

	return returnMap ? outMap : outArr;
    }

    
    /**
     * Public dispatch surface for `lib.require`.
     */
    return {
        all,
        lib: all,
	service
    };
}

export default make;
