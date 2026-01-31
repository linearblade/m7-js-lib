export function make(lib) {

    

    /**
     * Determine whether a value is a scalar (leaf value).
     *
     * Scalars are values with no internal structure to traverse.
     *
     * Included:
     * - string
     * - number
     * - boolean
     * - bigint
     * - symbol
     *
     * Excluded:
     * - null
     * - undefined
     * - objects
     * - arrays
     * - functions
     *
     * @param {*} v
     * @returns {boolean}
     */
    function isScalar(v) {
	const t = typeof v;
	return (
            t === 'string' ||
		t === 'number' ||
		t === 'boolean' ||
		t === 'bigint' ||
		t === 'symbol'
	);
    }
    



    /**
     * Determine the base type of a value, optionally comparing against allowed types.
     *
     * Dual-mode behavior (LOCKED):
     *
     * 1) Compare mode (when `comp` is provided or coercible to a non-empty array):
     *    - Returns `true` if the value’s base type matches ANY entry in `comp`.
     *    - Returns `false` otherwise.
     *
     * 2) Query mode (when `comp` is omitted or empty):
     *    - Returns a string describing the value’s base type.
     *
     * Type rules:
     * - `null` is treated as its own type: `"null"`
     * - Arrays are reported as `"array"` (instead of `"object"`)
     * - All other values use JavaScript `typeof`
     *
     * Legacy note (behavior change in v1.0):
     * - Older versions performed an early-return when `value === null`,
     *   causing comparison results to depend on the ORDER of `comp`.
     * - Example (legacy):
     *     baseType(null, ['object','null']) → false
     *     baseType(null, ['null','object']) → true
     * - Current behavior:
     *     baseType(null, ['object','null']) → true
     * - Matching is now order-independent and consistent with all other types.
     *
     * @param {*} value
     * @param {string|Array<string>} [comp]
     * @returns {boolean|string}
     */
    function baseType(value, comp) {
	//gets used everywhere, avoid lib.array.to b/c it will cause circular function hell
	const list = lib.array.is(comp)
	      ? comp
	      : (lib.str.is(comp) ? comp.split(/\s+/) : (comp ? [comp] : []));
	//const list = lib.array.to(comp,/\s+/);
	
	// Compare mode -> boolean
	if (list.length) {
            let type;

            if (value === null) {
		type = 'null';
            } else {
		type = typeof value;
		if (type === 'object' && Array.isArray(value)) {
                    type = 'array';
		}
            }

            for (let i = 0; i < list.length; i++) {
		if (String(list[i]).toLowerCase() === type) {
                    return true;
		}
            }
            return false;
	}

	// Query mode -> string
	if (value === null) return 'null';

	let type = typeof value;
	if (type === 'object' && Array.isArray(value)) {
            type = 'array';
	}
	return type;
    }
    
    /**
     * Determine whether a value should be treated as "empty".
     *
     * Semantics (INTENTIONAL, DO NOT EXPAND):
     * - `undefined` → empty (not provided)
     * - `null`      → empty (explicitly cleared)
     * - `""`        → empty (blank string)
     * - `false`     → empty (explicitly disabled / absent signal)
     *
     * Non-empty by design:
     * - `0`         → valid value
     * - `"0"`       → valid value
     * - `NaN`       → valid (still a value)
     * - `[]` / `{}` → valid containers
     *
     * This is NOT PHP-style `empty()` and must not be treated as such.
     *
     * @param {*} value
     * @returns {boolean}
     */
    function isEmpty(value) {
	return (
            typeof value === "undefined" ||
		value === null ||
		value === "" ||
		value === false
	);
    }
    
    
    /**
     * Classify a link-like value or test membership against allowed types.
     *
     * Dual-mode behavior (LOCKED):
     * 1) Classify mode (no `check`):
     *    - Returns a string type:
     *        - "hash"      : item is a plain object/hash
     *        - "absolute"  : string starts with "/" (absolute *path*)
     *        - "url"       : string starts with "http://" or "https://"
     *        - "relative"  : any other string
     *        - undefined   : not a hash and not a string
     *
     * 2) Predicate mode (`check` provided / non-empty):
     *    - Returns 1 if the detected type matches ANY entry in `check`, else 0.
     *
     * Notes:
     * - `check` is coerced via lib.array.to() so it can be a string, array, etc.
     * - No lowercasing/normalization is applied to `check` entries.
     *
     * @param {*} item
     * @param {string|Array<string>} [check=[]]
     * @returns {string|number|undefined}
     */
    function linkType(item, check = []) {
	let type;
	check = lib.array.to(check);

	if (lib.hash.is(item)) {
            type = "hash";
	} else if (baseType(item, "string")) {
            if (item.match(/^\//)) type = "absolute";
            else if (item.match(/^https?\:\/\//)) type = "url";
            else type = "relative";
	}

	if (check.length) {
            for (let i = 0; i < check.length; i++) {
		if (type === check[i]) return 1;
            }
            return 0;
	}

	return type;
    }


    /**
     * Clamp a value to an allowed set.
     *
     * Contract:
     * - Returns `test` if it exists in `range`.
     * - Otherwise returns `def` (default: undefined).
     * - Never throws.
     *
     * Semantics:
     * - `range` may be an array or a space-delimited string.
     * - Matching is strict (`===`), no type coercion.
     *
     * @param {Array|string} range
     *     Allowed values.
     *
     * @param {*} test
     *     Value to test.
     *
     * @param {*} [def]
     *     Default value if `test` is not allowed.
     *
     * @returns {*}
     */
    function clamp(range, test, def = undefined) {
	range = lib.array.to(range, { split: /\s+/, trim: true });
	return range.includes(test) ? test : def;
    }
    
    /**
     * Coerce a value into a finite number.
     *
     * Contract:
     * - Returns a finite number if coercion succeeds.
     * - Returns `def` otherwise.
     * - Never throws.
     *
     * Semantics:
     * - Uses `Number()` for conversion (no partial parsing).
     * - Empty-ish values (`undefined`, `null`, "", false) are treated as invalid.
     * - Rejects NaN and Infinity.
     *
     * @param {*} value
     *     Value to coerce.
     *
     * @param {*} [def]
     *     Default value if coercion fails.
     *
     * @returns {number|*}
     */
    function toNumber(value, def = undefined) {
	if (lib.utils.isEmpty(value)) return def;

	const n = Number(value);
	return Number.isFinite(n) ? n : def;
    }
    
    return {
	isArray      : lib.array.is,
	toArray      : lib.array.to,

	isHash       : lib.hash.is,
	toHash       : lib.hash.to,
	deepCopy     : lib.hash.deepCopy,
	isScalar     : isScalar,
	toString     : lib.str.to,
	baseType     : baseType,
	isEmpty      : isEmpty,

	linkType     : linkType,
	clamp        : clamp,
	toNumber     : toNumber,
	getFunction  : lib.func.get,
	stripComments: lib.str.stripComments,
	lc           : lib.str.lc
    };
}
export default make;
