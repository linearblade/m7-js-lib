/**
 * Build the `lib.func.parseList` helper.
 *
 * Purpose:
 * - Parse a compact function-list DSL into normalized call records.
 * - Accept both string and hash rows for mixed pipeline assembly.
 *
 * Input forms:
 * - String:
 *   "setTitle:Dashboard,theme=light; notify:info,message=Ready"
 * - Array:
 *   ["setTitle:Dashboard", { fn: "notify", pos:["info"], kv:{ info:true } }]
 *
 * Row grammar (string rows):
 * - "<name>[:arg0,arg1,key=value,...]"
 * - Rows are split on semicolons.
 * - Args are split on commas.
 * - Empty arg slots are preserved in `pos` as `undefined`.
 *
 * Options:
 * - opts.fn   : key name for the operation field (default: "fn")
 *              Example: { fn: "op" } -> output rows use `op` instead of `fn`.
 * - opts.args : argument projection mode:
 *              - "pos"  -> row.args = row.pos
 *              - "kv"   -> row.args = row.kv
 *              - "auto" -> row.args = row.kv if any "=" appears, else row.pos
 *              Default: "auto"
 *
 * Output row shape:
 * - {
 *     [opts.fn || "fn"]: <string|Function>,
 *     pos: Array,
 *     kv: Object,
 *     args: Array|Object
 *   }
 *
 * Validation:
 * - Throws on invalid rows (never silently skips):
 *   - malformed string rows (empty name, etc.)
 *   - non-hash non-string rows
 *   - hash rows missing configured fn key or with invalid fn value
 *
 * @param {Object} lib
 * @returns {Function}
 */
export function make(lib) {
    /**
     * Parse a command/argument string.
     *
     * @param {string} str
     * @param {Object} [opts]
     * @returns {Array<Object>}
     */
    function parseList(str, opts = undefined) {
	opts = lib.hash.to(opts,'args');
	const argsMode = normalizeArgsMode(opts.args);
	const fnKey = normalizeFnKey(opts.fn);
	const out = [];
	const list = lib.array.to(str, {split:';',trim:true});
	
	for(let i =0; i < list.length;i++) {
	    const segment = list[i];

	    if (lib.str.is(segment)) {
		const parsed = parseFunction(segment, fnKey);
		if (!parsed || !hasMinimalFn(parsed[fnKey])) {
		    throwInvalidSegment(i, segment, `Expected '${fnKey}:args' format with non-empty ${fnKey}`);
		}
		out.push(selectArgsOutput(parsed, argsMode));
		continue;
	    }

	    const parsed = normalizeHashSegment(segment, fnKey);
	    if (!parsed) {
		throwInvalidSegment(i, segment, `Expected hash with '${fnKey}' as non-empty string or function`);
	    }
	    out.push(selectArgsOutput(parsed, argsMode));
	}
	return out;
    }

    function parseFunction(value, fnKey = "fn"){
	value = lib.str.to(value, true).trim();
	if (!value) return undefined;

	// Parse "<fn>:<arg0,arg1,...>" where arg segment is optional.
	const idx = value.indexOf(":");
	const fn = (idx === -1 ? value : value.slice(0, idx)).trim();
	const argString = (idx === -1 ? "" : value.slice(idx + 1)).trim();
	if (!fn) return undefined;

	let parsedArgs = undefined;
	if (argString) {
	    parsedArgs = parseArgList(argString);
	}
	const pos = (parsedArgs && Array.isArray(parsedArgs.pos)) ? parsedArgs.pos : [];
	const kv = (parsedArgs && lib.hash.is(parsedArgs.kv)) ? parsedArgs.kv : {};

	const hasEquals = !!(parsedArgs && parsedArgs.hasEquals === true);
	const out = { pos, kv, hasEquals };
	out[fnKey] = fn;
	return out;
    }

    function hasMinimalFn(fn) {
	if (typeof fn === "function") return true;
	if (!lib.str.is(fn)) return false;
	return !!lib.str.to(fn, true).trim();
    }

    function normalizeHashSegment(segment, fnKey = "fn") {
	if (!lib.hash.is(segment)) return undefined;
	if (!Object.prototype.hasOwnProperty.call(segment, fnKey)) return undefined;
	const fn = segment[fnKey];
	if (!hasMinimalFn(fn)) return undefined;

	const out = Object.assign({}, segment);
	out[fnKey] = lib.str.is(fn) ? lib.str.to(fn, true).trim() : fn;
	return out;
    }

    function throwInvalidSegment(index, segment, reason = "Invalid segment") {
	const t = (lib.utils && typeof lib.utils.baseType === "function")
	    ? lib.utils.baseType(segment)
	    : (Array.isArray(segment) ? "array" : (segment === null ? "null" : typeof segment));
	let render = "";
	try {
	    render = lib.str.is(segment) ? segment : JSON.stringify(segment);
	} catch (err) {
	    render = String(segment);
	}
	throw new Error(`[lib.func.parseList] ${reason} at index ${index} (type: ${t}) value: ${render}`);
    }

    function normalizeArgsMode(mode) {
	mode = lib.str.to(mode, true).trim().toLowerCase();
	if (mode === "pos" || mode === "kv") return mode;
	return "auto";
    }

    function normalizeFnKey(name) {
	name = lib.str.to(name, true).trim();
	return name || "fn";
    }

    function segmentHasEquals(segment) {
	if (!segment) return false;
	if (segment.hasEquals === true) return true;

	const pos = Array.isArray(segment.pos) ? segment.pos : [];
	for (let i = 0; i < pos.length; i++) {
	    const token = pos[i];
	    if (!lib.str.is(token)) continue;
	    if (token.indexOf("=") !== -1) return true;
	}
	return false;
    }

    function selectArgsOutput(segment, mode) {
	const out = Object.assign({}, segment);
	const pos = Array.isArray(out.pos) ? out.pos : [];
	const kv = lib.hash.is(out.kv) ? out.kv : {};
	const hasEquals = segmentHasEquals(out);

	out.pos = pos;
	out.kv = kv;

	if (mode === "pos") out.args = pos;
	else if (mode === "kv") out.args = kv;
	else out.args = hasEquals ? kv : pos;

	delete out.hasEquals;
	return out;
    }

    function parseArgList(argString){
	const pos = [];
	const kv = {};
	let hasEquals = false;

	const parts = lib.str.to(argString, true)
	    .split(",")
	    .map((part) => String(part).trim());

	for (let i = 0; i < parts.length; i++) {
	    const token = parts[i];
	    if (!token) {
		pos.push(undefined);
		continue;
	    }

	    pos.push(token);
	    if (token.indexOf("=") !== -1) hasEquals = true;

	    const eq = token.indexOf("=");
	    if (eq <= 0) {
		kv[token] = true;
		continue;
	    }

	    const key = token.slice(0, eq).trim();
	    const value = token.slice(eq + 1).trim();
	    if (!key) {
		kv[token] = true;
		continue;
	    }

	    hasEquals = true;
	    kv[key] = (value === "") ? undefined : value;
	}

	return { pos, kv, hasEquals };
    }
    return parseList;
}




export default make;
