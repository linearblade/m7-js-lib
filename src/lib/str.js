//lib/str.js

export function make(lib){
    /**
       simple alias to base type.
     */
    function is(v) {
	return lib.utils.baseType(v, 'string');
    }
    /**
     * Coerce a value to a string (legacy-safe, normalized).
     *
     * Semantics (DO NOT change lightly):
     * - If v is string, number, or boolean → returns String(v)
     * - If opts.lc → lowercases the resulting string
     * - Otherwise returns undefined
     * - If opts.force is truthy → returns "" instead of undefined
     *
     * Options shortcut:
     * - If opts is not an object, it is treated as { force: opts }
     *
     * @param {*} v
     * @param {Object|number|boolean} [opts]
     * @returns {string|undefined}
     */
    function to(v, opts) {
	const o = lib.hash.to(opts, 'force');

	if (lib.utils.baseType(v, ["boolean", "number", "string"])) {
            let s = String(v);
            if (o.lc) s = s.toLowerCase();
            return s;
	}

	return o.force ? "" : undefined;
    }

    /**
     * Lowercase helper with optional forced coercion.
     *
     * Semantics (LOCKED):
     * - If `v` is scalar → returns lowercase string
     * - If `v` is NOT scalar:
     *     - returns undefined unless `force === true`
     * - If `force === true`:
     *     - coerces value to string and lowercases it
     *
     * This is a normalization helper — callers should not need to validate input.
     *
     * @param {*} v
     * @param {boolean} [force=false]
     * @returns {string|undefined}
     */
    function lc(v, force = false) {
	if (!lib.utils.isScalar(v) && !force) return undefined;
	return String(v).toLowerCase();
    }   


    /**
     * Strip JavaScript-style comments from source text.
     *
     * IMPORTANT LIMITATIONS (BY DESIGN):
     * -----------------------------------
     * This function performs simple regex-based comment stripping.
     * It is NOT a tokenizer or parser and is NOT syntax-aware.
     *
     * As a result, it WILL produce incorrect output in cases such as:
     * - URLs containing "//" (e.g. "https://example.com")
     * - Comment-like text inside string literals
     * - Regex literals containing comment markers
     * - Template strings containing comment markers
     *
     * This is intentional.
     * For correct lexical handling, a real parser/tokenizer is required.
     * That functionality belongs in a proper parsing/compiler layer,
     * not in this utility.
     *
     * Supported modes (via opts.strip):
     * - 1 or "a" : strip all comments (default)
     * - "m"      : strip multi-line comments only (/* ... *\/)
     * - "s"      : strip single-line comments only (// ...)
     * - Combinations allowed (e.g. "ms")
     *
     * Options may be passed as:
     * - scalar: stripComments(text, 1)
     * - string: stripComments(text, "m")
     * - hash  : stripComments(text, { strip: "s" })
     *
     * Use cases:
     * - Cleaning trusted source blobs
     * - Pre-processing loader input
     * - Removing comments from controlled config/code
     *
     * NOT suitable for:
     * - Arbitrary JavaScript source
     * - Security-sensitive transformations
     * - Anything requiring syntactic correctness
     *
     * @param {string} data
     * @param {string|number|Object} [opts]
     * @returns {string}
     */
    function stripComments(data, opts) {
	let cleaned = data;

	opts = lib.hash.to(opts, 'strip');
	if (!opts.strip) opts.strip = 1;

	
	const mode = to(opts.strip, 1);

	if (mode.match(/1|a|m/i)) {
            cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ""); //multi
	}

	if (mode.match(/1|a|s/i)) {
            cleaned = cleaned.replace(/\/\/.*/g, ""); //single
	}

	return cleaned;
    }


    return {
	is,lc,to,stripComments
    };
    

}

export default make;
