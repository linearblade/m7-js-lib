/**
 * Explicit-boolean intent helpers.
 *
 * Purpose:
 * - Distinguish explicit yes/no intent from generic JS truthiness
 * - Provide predictable conversion helpers for config-style inputs
 */
/**
 * Build the `lib.bool` helper namespace.
 *
 * @param {Object} lib
 * @returns {{
 *   intentTrue: Function,
 *   intentFalse: Function,
 *   is: Function,
 *   isIntent: Function,
 *   to: Function,
 *   byIntent: Function,
 *   hasIntent: Function,
 *   ish: Function,
 *   yes: Function,
 *   no: Function
 * }}
 */
export function make(lib){
    /**
     * Detect affirmative intent.
     *
     * Returns true if the value explicitly encodes affirmative intent.
     * This is NOT truthiness.
     *
     * Accepted values:
     *   - true
     *   - 1
     *   - "1"
     *   - "true"
     *   - "yes"
     * (case-insensitive for strings)
     *
     * @param {*} val
     * @returns {boolean}
     */
    function intentTrue(val) {
        const t = typeof val;
        if (t === 'undefined' || val === null) return false;
        if (t === 'number') return val === 1;
        if (t === 'boolean') return val === true;
        if (t === 'string') return /^(1|true|yes)$/i.test(val);
        return false;
    }

    /**
     * Detect negative intent.
     *
     * Returns true if the value explicitly encodes negative intent.
     * This is NOT truthiness.
     *
     * Accepted values:
     *   - false
     *   - 0
     *   - "0"
     *   - "false"
     *   - "no"
     * (case-insensitive for strings)
     *
     * @param {*} val
     * @returns {boolean}
     */
    function intentFalse(val) {
        const t = typeof val;
        if (t === 'undefined' || val === null) return false;
        if (t === 'number') return val === 0;
        if (t === 'boolean') return val === false;
        if (t === 'string') return /^(0|false|no)$/i.test(val);
        return false;
    }

    // ──────────────────────────────────────────────────────────────

    /**
     * Is the value a real boolean (true or false)?
     *
     * @param {*} val
     * @returns {boolean}
     */
    function is(val) {
        return typeof val === 'boolean';
    }

    /**
     * Does the value explicitly encode boolean intent?
     *
     * True if the value is:
     *   - a boolean, OR
     *   - an affirmative literal, OR
     *   - a negative literal
     *
     * @param {*} val
     * @returns {boolean}
     */
    function isIntent(val) {
        return is(val) || intentTrue(val) || intentFalse(val);
    }

    /**
     * Strict boolean conversion.
     *
     * Returns true only if the value === true.
     * All other values return false.
     *
     * @param {*} val
     * @returns {boolean}
     */
    function to(val) {
        return is(val) ? val : false;
    }

    /**
     * Intent-based boolean conversion.
     *
     * Returns true only if the value explicitly encodes affirmative intent.
     * All other values (including negative intent) return false.
     *
     * @param {*} val
     * @returns {boolean}
     */
    function byIntent(val) {
        return intentTrue(val);
    }

    // ──────────────────────────────────────────────────────────────

    /**
     * Public dispatch surface for `lib.bool`.
     */
    return {
        // Intent detectors
        intentTrue,
        intentFalse,

        // Type checks
        is,
        isIntent,

        // Conversions
        to,
        byIntent,

        // Aliases (shorthand / legacy-friendly)
	hasIntent : isIntent,
        ish       : isIntent,
        yes       : intentTrue,
        no        : intentFalse,

    };
}

export default make;
