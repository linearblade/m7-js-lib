//$SECTION -LIB.DOM.APPEND
export function make(lib) {
    /**
     * Resolve a target-ish input into a DOM Element.
     * Accepts:
     * - DOM Element
     * - selector string / id string (best-effort)
     */
    function resolveTarget(target) {
        if (!target) return null;

        // already a DOM node/element?
        if (lib.dom && typeof lib.dom.isDom === "function" && lib.dom.isDom(target)) {
            return target;
        }
        if (typeof Element !== "undefined" && target instanceof Element) {
            return target;
        }

        // string lookup
        if (typeof target === "string") {
            if (lib.dom && typeof lib.dom.getElement === "function") {
                return lib.dom.getElement(target);
            }
            // fallback: try id first, then selector
            const byId = document.getElementById(target);
            if (byId) return byId;
            try {
                return document.querySelector(target);
            } catch (e) {
                return null;
            }
        }

        return null;
    }

    /**
     * Resolve an element-ish input into a DOM Element.
     * (Same semantics as resolveTarget; named separately for readability.)
     */
    function resolveElement(e) {
        return resolveTarget(e);
    }

    function before(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target || !target.parentNode) return null;
        target.parentNode.insertBefore(e, target);
        return e;
    }

    function after(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target || !target.parentNode) return null;

        // Prefer library helper if present (keeps legacy semantics if any)
        if (lib.dom && typeof lib.dom.insertAfter === "function") {
            lib.dom.insertAfter(e, target);
            return e;
        }

        // Native fallback
        if (target.nextSibling) target.parentNode.insertBefore(e, target.nextSibling);
        else target.parentNode.appendChild(e);
        return e;
    }

    function prepend(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target) return null;

        if (target.firstChild) target.insertBefore(e, target.firstChild);
        else target.appendChild(e);

        return e;
    }

    function append(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target) return null;
        target.appendChild(e);
        return e;
    }

    /**
     * Insert using DOM-standard positions (mirrors insertAdjacentElement).
     * pos: "beforebegin" | "afterbegin" | "beforeend" | "afterend"
     */
    function adjacent(e, target, pos) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target) return null;

        const p = String(pos || "").toLowerCase();
        if (typeof target.insertAdjacentElement === "function") {
            try {
                target.insertAdjacentElement(p, e);
                return e;
            } catch (err) {
                // fall through to manual mapping
            }
        }

        // Manual mapping (works everywhere)
        if (p === "beforebegin") return before(e, target);
        if (p === "afterend") return after(e, target);
        if (p === "afterbegin") return prepend(e, target);
        // default to beforeend
        return append(e, target);
    }

    /**
     * Replace target with element.
     */
    function replace(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target || !target.parentNode) return null;
        target.parentNode.replaceChild(e, target);
        return e;
    }

    /**
     * Remove target from DOM.
     */
    function remove(target) {
        target = resolveTarget(target);
        if (!target || !target.parentNode) return null;
        target.parentNode.removeChild(target);
        return target;
    }

    /**
     * Empty a target (remove all children).
     */
    function empty(target) {
        target = resolveTarget(target);
        if (!target) return null;
        while (target.firstChild) target.removeChild(target.firstChild);
        return target;
    }

    /**
     * Convenience aliases for common positions.
     */
    const disp = {
        // original API (fixed)
        before: before,
        after: after,
        prepend: prepend,
        append: append,

        // missing but very handy “targeting” functions
        beforeBegin: function (e, target) { return adjacent(e, target, "beforebegin"); },
        afterBegin: function (e, target) { return adjacent(e, target, "afterbegin"); },
        beforeEnd: function (e, target) { return adjacent(e, target, "beforeend"); },
        afterEnd: function (e, target) { return adjacent(e, target, "afterend"); },

        adjacent: adjacent,
        replace: replace,
        remove: remove,
        empty: empty,

        // exposed in case other modules want the same coercion
        resolveTarget: resolveTarget
    };

    return disp;
}

export default make;
