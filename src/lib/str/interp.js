const MOD = "[str.interp]";
let lastNamespace = null;

export function make(lib) {
    if (!lib || !lib.hash || !lib.array || !lib.func) {
        throw new Error(`${MOD} requires lib.hash, lib.array, and lib.func.`);
    }

    function escapeRegExp(string) {
        return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function escapeReplacement(string) {
        return String(string).replace(/\$/g, "$$$$");
    }

    function interpReplace(tpl, map) {
        let out = String(tpl);
        for (const k of Object.keys(map)) {
            const regexp = new RegExp(escapeRegExp(k), "g");
            const value = lib.array.is(map[k]) ? map[k][0] : map[k];
            out = out.replace(regexp, value);
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

    function interpVars(tpl, scheme = undefined, opts = undefined) {
        let mm;
        let rep;

        if (lib.hash.is(scheme)) {
            const env = Object.keys(scheme).length === 0 ? resolveHost() : scheme;
            scheme = function (v) {
                return lib.hash.get(env, v);
            };
        } else if (!lib.func.get(scheme)) {
            scheme = function (val) {
                return eval(val);
            };
        }

        opts = lib.hash.to(opts, "eval");
        if (opts.eval) opts.quote = 1;
        mm = interpMap(tpl);

        for (const k in mm) {
            const v = lib.array.is(mm[k]) ? mm[k][0] : mm[k];
            let nVal = scheme(v);

            if (opts.quote) {
                nVal = "'" + String(nVal).replaceAll("'", "\x5C\x27") + "'";
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
