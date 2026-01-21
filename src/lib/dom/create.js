//$SECTION -LIB.DOM.CREATE

export function make(lib) {
    // module-private (don’t use `this` for caching; keep ES module semantics clean)
    const special = {};

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

    return {
        css: css,
        link: css,
        js: js,
        element: element
    };
}

export default make;

