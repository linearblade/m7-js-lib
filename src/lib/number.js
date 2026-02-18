/**
 * Numeric coercion and guardrail helpers.
 *
 * Purpose:
 * - Convert loose input into bounded numeric forms
 * - Provide deterministic fallback behavior for malformed numeric text
 */
/**
 * Build the `lib.number` helper namespace.
 *
 * @param {Object} lib
 * @returns {{ clamp: Function, toInt: Function }}
 */
export function make(lib) {
    /**
     * Clamp a value between optional bounds.
     *
     * Contract:
     * - Coerces numeric strings for `n`, `min`, and `max`.
     * - If `n` is not a finite number after coercion, returns `def`.
     * - If `def` is omitted, defaults to `min`.
     * - Ignores invalid `min`/`max` bounds instead of throwing.
     *
     * @param {*} n
     * @param {*} min
     * @param {*} max
     * @param {*} [def]
     * @returns {*|number}
     */
    function clamp(n, min, max, def) {
	// default fallback
	if (def === undefined) def = min;
	
	// strict numeric coercion
	const num = (typeof n === "number")
              ? n
              : (typeof n === "string" && n !== "" ? Number(n) : NaN);

	if (!Number.isFinite(num)) return def;

	let out = num;

	// lower bound
	if (!lib.utils.isEmpty(min)) {
            const minNum = Number(min);
            if (Number.isFinite(minNum)) {
		out = Math.max(out, minNum);
            }
	}

	// upper bound
	if (!lib.utils.isEmpty(max)) {
            const maxNum = Number(max);
            if (Number.isFinite(maxNum)) {
		out = Math.min(out, maxNum);
            }
	}

	return out;
    }

    /**
     * Parse/coerce a value into an integer using strict legacy-safe rules.
     *
     * Semantics:
     * - Accepts numbers and numeric-ish strings only.
     * - Rejects strings with invalid characters, misplaced signs, or multiple dots/signs.
     * - Truncates finite numeric inputs (toward zero).
     * - Special policy: leading-dot values like ".5" or "-.5" return `0`.
     *
     * @param {*} val
     * @param {*} [def=0] Fallback when conversion fails.
     * @returns {number|*}
     */
    function toInt(val, def = 0) {
	const type = typeof val;
	if (!["number", "string"].includes(type)) return def;

	if (type === "number") {
            if (!Number.isFinite(val)) return def;
            return Math.trunc(val);
	}

	if (val.length < 1) return def;

	if (val.match(/[^+\-\d.]/g)) return def;

	if (lib.str.countChars(val, ".") > 1) return def;
	if (lib.str.countChars(val, ["+", "-"]) > 1) return def;

	if (val.indexOf("+") > 0 || val.indexOf("-") > 0) return def;

	const fChar = val.substr(0, 1);
	const lChar = val.substr(-1, 1);

	if (lChar === ".") return def;
	if (fChar === ".") return 0;

	const sign = (fChar === "+" || fChar === "-") ? fChar : null;
	const rem = sign ? val.substr(1) : val;

	if (rem.length < 1) return def;

	// ".5" or "-.5" => 0 by your policy
	if (rem.substr(0, 1) === ".") return 0;

	const num = Number(rem);
	if (!Number.isFinite(num)) return def;

	const res = (sign === "-" ? -1 : 1) * num;
	return Math.trunc(res);
    }
    

    /**
     * Public dispatch surface for `lib.number`.
     *
     * @type {{ clamp: Function, toInt: Function }}
     */
    const disp = {
	clamp,
	toInt
    };

    return disp;


}
export default make;
