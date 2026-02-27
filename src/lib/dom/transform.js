/**
 * DOM transform helpers.
 *
 * Purpose:
 * - Populate DOM attributes/properties from a data scheme via `data-*` metadata
 * - Support map-driven transforms (`data-map-key`) and simple per-node bindings
 * - Provide list/template cloning convenience
 *
 * Notes:
 * - This module intentionally preserves legacy transform semantics from the
 *   standalone `m7-js-lib-dom-transform` package.
 */
export function make(lib) {
    function getDocument() {
        const envDoc = lib.hash.get(lib, "_env.root.document");
        if (envDoc) return envDoc;
        if (typeof document !== "undefined") return document;
        return undefined;
    }

    function makeValidator(scheme) {
        const root = lib.hash.get(lib, "_env.root");

        if (lib.hash.is(scheme)) {
            const env = Object.keys(scheme).length === 0 ? root : scheme;
            return function (path) {
                return lib.hash.get(env, path);
            };
        }

        if (!lib.func.get(scheme)) {
            return function (expr) {
                // Legacy behavior: expression evaluation fallback.
                return (0, eval)(expr);
            };
        }

        return undefined;
    }

    /**
     * Bind a data scheme into one element subtree.
     *
     * @param {Element|string|*} el
     * @param {Object|Function} scheme
     * @param {Object|number|boolean} [opts]
     */
    function transformElement(el, scheme, opts = {}) {
        opts = lib.hash.to(opts, "max_subs");
        const dataMap = opts.map;

        el = lib.dom.attempt(el);
        if (!lib.dom.is(el)) return console.log(`element ${el} is not dom`);

        let nodeList = dataMap
            ? el.querySelectorAll("[data-dst],[data-dst0],[data-map-key]")
            : el.querySelectorAll("[data-dst],[data-dst0]");
        nodeList = lib.args.slice(nodeList);
        nodeList.unshift(el);

        if (opts.debug > 0) {
            console.log("nodeList", nodeList);
            console.log("scheme", scheme);
            console.log("opts", opts);
        }

        let counter = 0;

        const keyList = opts.keys ? lib.array.to(opts.keys, /\s+/) : false;
        let allow = true;
        if (keyList && keyList.length) {
            console.error("keys are ", keyList);
            allow = {};
            for (const k of keyList) allow[k] = true;
        }

        for (const node of nodeList) {
            if (opts.debug > 1) console.log("node", node);

            // Apply map keyed by `data-map-key`.
            let mapList = node.getAttribute("data-map-key");
            mapList = lib.array.to(mapList, /\s+/);

            for (const mapTarget of mapList) {
                if (lib.utils.isEmpty(mapTarget)) continue;

                let mapItem = lib.hash.get(dataMap, mapTarget);
                if (!lib.array.is(mapItem) && !lib.hash.is(mapItem)) continue;
                if (allow === false || (lib.hash.is(allow) && allow[mapTarget] !== true)) continue;

                mapItem = lib.array.to(mapItem);

                MAP_LOOP:
                for (const item of mapItem) {
                    const [src, dst, type, func, append, validate] = lib.hash.expand(
                        item,
                        "src dst type func append validate"
                    );

                    if (validate) {
                        const vScheme = makeValidator(scheme);
                        const list = lib.array.to(validate, /\s+/);

                        for (const vItem of list) {
                            try {
                                if ([null, undefined].includes(vScheme(vItem))) continue MAP_LOOP;
                            } catch (err) {
                                continue MAP_LOOP;
                            }
                        }
                    }

                    let iVal =
                        type === "func" ? lib.utils.getFunction(func, true)(scheme, src, node) :
                        type === "eval" ? lib.str.interp(src, undefined, 1) :
                        type === "tpleval" ? lib.str.interp(src, scheme, 1) :
                        type === "tpl" ? lib.str.interp(src, scheme) :
                        lib.func.get(scheme) ? scheme(src) :
                        lib.hash.get(scheme, src);

                    if (opts.debug > 1) console.log(`ival is ${iVal}`);
                    if (append) iVal = lib.dom.get(node, dst) + iVal;
                    if (opts.debug > 1) console.log(`MAP set ${dst} to ${iVal}`);
                    if (dst) lib.dom.set(node, dst, iVal);
                }
            }

            for (let i = 0; i < (opts.max_subs || 10); i++) {
                let iVal = undefined;
                const dst = i ? node.getAttribute("data-dst" + i) :
                    node.getAttribute("data-dst") || node.getAttribute("data-dst0");
                const src = i ? node.getAttribute("data-src" + i) :
                    node.getAttribute("data-src") || node.getAttribute("data-src0");
                const tpl = i ? node.getAttribute("data-tpl" + i) :
                    node.getAttribute("data-tpl") || node.getAttribute("data-tpl0");
                const tplev = i ? node.getAttribute("data-tpl-eval" + i) :
                    node.getAttribute("data-tpl-eval") || node.getAttribute("data-tpl-eval0");
                const ev = i ? node.getAttribute("data-eval" + i) :
                    node.getAttribute("data-eval") || node.getAttribute("data-eval0");
                const append = lib.bool.yes(node.getAttribute("data-dst-append"));

                if (!(tpl || src || ev || tplev)) continue;
                if (opts.debug > 1) {
                    console.log(`interping on ev=${ev}, tplev=${tplev}, tpl=${tpl}, src=${src}`);
                }

                iVal = ev ? lib.str.interp(ev, undefined, 1) :
                    tplev ? lib.str.interp(tplev, scheme, 1) :
                    tpl ? lib.str.interp(tpl, scheme) :
                    lib.func.get(scheme) ? scheme(src) :
                    lib.hash.get(scheme, src);

                if (opts.debug > 1) console.log(`ival is ${iVal}`);
                if (append) iVal = lib.dom.get(node, dst) + iVal;
                if (opts.debug > 1) console.log(`set ${dst} to ${iVal}`);
                lib.dom.set(node, dst, iVal);
            }

            counter++;
        }

        if (opts.debug > 0) console.log(`set ${counter} nodes`);
    }

    /**
     * Clone a template for each row and apply `transformElement`.
     *
     * @param {Element|string} target
     * @param {Element|string} template
     * @param {Array|*} data
     * @param {Object} [opts]
     */
    function transformList(target, template, data, opts) {
        opts = lib.hash.to(opts, "append");
        data = lib.array.to(data);
        if (!data.length) return console.warn("list data is empty");

        const doc = getDocument();
        target = lib.dom.is(target) ? target : (doc ? doc.querySelector(target) : undefined);
        template = lib.dom.is(template) ? template : (doc ? doc.querySelector(template) : undefined);

        if (!target) return console.error(`target ${target} not found`);
        if (!template) return console.error(`template ${template} not found`);

        if (!lib.utils.toString(opts.append, 1).toLowerCase().match("append")) {
            target.innerHTML = "";
        }

        const env = { i: -1 };
        for (const row of data) {
            env.i++;
            const clone = template.cloneNode(1);
            target.appendChild(clone);

            const scheme = opts.scheme ? opts.scheme(env, data) : row;
            transformElement(clone, scheme, opts);
        }
    }

    return {
        element: transformElement,
        list: transformList,
    };
}

export default make;
