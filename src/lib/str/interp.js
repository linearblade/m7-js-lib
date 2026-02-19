const MOD = "[str.interp]";
let lastNamespace = null;

/*
  examples:

  lib.str.interp("${a} - 2", {a:2}) => "2 - 2"
  window.a = 3;
  lib.str.interp("${a} - 2", {}) => "3 - 2" // uses the global env
  lib.str.interp("${a -2} + 42")  // "1 + 42" //will eval
  lib.str.interp("Hello ${name}", {name:"Jill"}) => "Hello Jill"
  lib.str.interp("${a}+${b}", {a:2,b:3}, {tpl:"Number(%s)"}) => "Number(2)+Number(3)"
  lib.str.interp("${a}+${b}", {a:2,b:3}, {tpl:"Number(%s)", eval:1}) => 5
  lib.str.interp("${name}", {name:"O'Hara"}, {quote:1}) => "'O\\'Hara'"
  lib.str.interp("X=${v}", {v:"$&"}) => "X=$&"
  lib.str.interp("${a}", {a:(key)=>key+2}) => "a2"
  lib.str.interp("${a}", {a:[1,2,3]}, {literal:1}) => [1,2,3]
  
 */
/*
  legend:
  - tpl: source string with `${...}` tokens.
  - scheme:
      {k:v} -> token body is used as hash path/key lookup.
      {}    -> lookup against host root (`lib._env.root` / global fallback).
      function values in hash mode are called as fn(tokenKey, schemeObj).
      unset -> token body is evaluated with `eval`.
  - opts:
      eval  -> eval final interpolated output (also forces quote=1).
      quote -> wrap each resolved token in single quotes.
      tpl   -> per-token formatter; first `%s` is replaced with token value.
      literal -> if tpl is exactly one token (`"${...}"`), return raw resolved value.
*/
export function make(lib) {
    /*
    //unnecessary after inclusion. these will exist after construction of lib
    if (!lib || !lib.hash || !lib.array || !lib.func) {
        throw new Error(`${MOD} requires lib.hash, lib.array, and lib.func.`);
    }*/

    function escapeRegExp(string) {
        return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function escapeReplacement(string) {
        return String(string).replace(/\$/g, "$$$$");
    }

    function resolveHost() {
        const envRoot = lib.hash.get(lib, "_env.root");
        if (envRoot) return envRoot;
        if (typeof globalThis !== "undefined") return globalThis;
        if (typeof window !== "undefined") return window;
        if (typeof global !== "undefined") return global;
        return {};
    }

    function interpReplace(tpl, map) {
        let out = String(tpl);
        for (const k of Object.keys(map)) {
            const regexp = new RegExp(escapeRegExp(k), "g");
            const value = map[k];
            out = out.replace(regexp, escapeReplacement(value));
        }

        return out;
    }

    function interpMap(tpl) {
        const regex = new RegExp(/\${(.*?)}/, "g");
        const matchMap = {};
        let match;

        while ((match = regex.exec(String(tpl)))) {
            const k = match.shift();
            matchMap[k] = match;
        }
        return matchMap;
    }

    function interpWholeToken(tpl) {
        const match = String(tpl).match(/^\$\{(.*?)\}$/);
        return match ? match[1] : undefined;
    }

    /**
     * Interpolate `${...}` tokens inside a template string.
     *
     * Resolution modes:
     * - Hash scheme: token body is used as key/path for `lib.hash.get`.
     * - Empty hash (`{}`): lookups use host root (`lib._env.root`, then global fallback).
     * - Function value in hash mode: called as `fn(tokenKey, schemeObj)`.
     * - No usable scheme: token body is evaluated with `eval`.
     *
     * Options:
     * - `eval`: evaluate the final interpolated string (`quote` is forced on).
     * - `quote`: wrap each token value in single quotes.
     * - `tpl`: per-token formatter; first `%s` is replaced with token value.
     * - `literal`: when `tpl` is exactly one token (`"${...}"`), return raw resolved value.
     *
     * @param {string} tpl
     *   Template text containing `${...}` tokens.
     * @param {Object|Function} [scheme]
     *   Optional resolver source or resolver function.
     * @param {Object|boolean|number} [opts]
     *   Optional flags or shorthand for `{ eval: opts }`.
     * @param {boolean|number} [opts.eval]
     * @param {boolean|number} [opts.quote]
     * @param {string} [opts.tpl]
     * @param {boolean|number} [opts.literal]
     * @returns {*}
     *   Interpolated output (usually string), raw value in `literal` mode, or `Error` on final eval failure.
     */
    function interpVars(tpl, scheme = undefined, opts = undefined) {
        let mm;
        let rep;

        if (lib.hash.is(scheme)) {
            const env = Object.keys(scheme).length === 0 ? resolveHost() : scheme;
            scheme = function (v) {
                const value = lib.hash.get(env, v);
                if (typeof value === "function") {
                    return value(v, env);
                }
                return value;
            };
        } else if (!lib.func.get(scheme)) {
            scheme = function (val) {
                return eval(val);
            };
        }

        opts = lib.hash.to(opts, "eval");
        if (opts.eval) opts.quote = 1;

        if (opts.literal) {
            const wholeToken = interpWholeToken(tpl);
            if (wholeToken !== undefined) {
                return scheme(wholeToken);
            }
        }

        mm = interpMap(tpl);

        for (const k in mm) {
            const v = lib.array.is(mm[k]) ? mm[k][0] : mm[k];
            let nVal = scheme(v);

            if (opts.quote) {
                nVal = "'" + String(nVal).replace(/'/g, "\x5C\x27") + "'";
            }

            if (opts.tpl) {
                const tplFormat = lib.hash.get(opts, "tpl") + "";
                if (lib.hash.get(opts, "tpl")) {
                    nVal = tplFormat.replace(/\%s/i, nVal);
                }
            }

            mm[k] = nVal;
        }

        rep = interpReplace(tpl, mm);
        if (opts.eval) {
            try {
                rep = eval(rep);
            } catch (err) {
                rep = err;
            }
        }

        return rep;
    }



    return interpVars;
}

export default make;
