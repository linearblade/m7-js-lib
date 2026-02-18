//$SECTION -LIB.DOM.CREATE
/**
 * DOM element factory helpers.
 *
 * Purpose:
 * - Build `<script>`, `<link>`, and generic elements
 * - Apply attribute maps with legacy-friendly event attribute handling
 *
 * Environment:
 * - Browser DOM required (`document` + `addEventListener` APIs).
 */
/**
 * Build the `lib.dom.create` namespace.
 *
 * @param {Object} lib
 * @returns {{
 *   css: Function,
 *   link: Function,
 *   js: Function,
 *   element: Function
 * }}
 */
export function make(lib) {
    // module-private (don’t use `this` for caching; keep ES module semantics clean)
    const special = {};

    /**
     * Initialize special attribute handlers once.
     *
     * Current special handlers:
     * - `load`, `error`, `click` -> convert attribute value into listener function
     *   via `lib.func.get` and attach through `addEventListener(..., true)`.
     */
    function ensureSpecial() {
        if (special._init) return;

        const eventHandler = function (e, key, value) {
            const fun = lib.func.get(value);
            if (fun) e.addEventListener(key, fun, true);
        };

        // event-ish attributes that should become listeners
        special.load = eventHandler;
        special.error = eventHandler;
        special.click = eventHandler;

        special._init = true;
    }

    /**
     * Create a script element with default JS attributes merged with caller attrs.
     *
     * @param {string} url
     * @param {Object} [attrs]
     * @returns {HTMLScriptElement}
     */
    function js(url, attrs) {
        if (!lib.hash.is(attrs)) attrs = {};
        attrs = lib.hash.merge(
            {
                async: true,
                type: "text/javascript",
                src: url
            },
            attrs
        );
        return element("script", attrs);
    }

    /**
     * Create a stylesheet link element with default CSS attributes merged with caller attrs.
     *
     * @param {string} url
     * @param {Object} [attrs]
     * @returns {HTMLLinkElement}
     */
    function css(url, attrs) {
        if (!lib.hash.is(attrs)) attrs = {};
        attrs = lib.hash.merge(
            {
                rel: "stylesheet",
                type: "text/css",
                href: url
            },
            attrs
        );
        return element("link", attrs);
    }

    /**
     * Create a generic element and apply attributes/content.
     *
     * Semantics:
     * - `attrs` is normalized to hash.
     * - Known special keys (`load`, `error`, `click`) become event listeners.
     * - Other keys are applied with `setAttribute`.
     * - `content` (when non-nullish) is assigned to `textContent`.
     *
     * @param {string} tag
     * @param {Object} [attrs]
     * @param {*} [content]
     * @returns {Element}
     */
    function element(tag, attrs, content) {
        ensureSpecial();

        const e = document.createElement(tag);

        if (!lib.hash.is(attrs)) attrs = {};

        for (const key of Object.keys(attrs)) {
            const k = lib.utils.lc(key, true); // force lowercase
            if (special[k]) {
                special[k](e, key, attrs[key]);
            } else {
                e.setAttribute(key, attrs[key]);
            }
        }

        // Optional: set content if provided (legacy-friendly, but harmless)
        if (typeof content !== "undefined" && content !== null) {
            // If you ever want html vs text, add an option later; keep minimal now.
            e.textContent = String(content);
        }

        return e;
    }

    /**
     * Public dispatch surface for `lib.dom.create`.
     */
    return {
        css: css,
        link: css,
        js: js,
        element: element
    };
}

export default make;
