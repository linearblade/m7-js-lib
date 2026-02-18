# Module: lib.dom

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [lib.dom](./DOM.md)

Source: `src/lib/dom/index.js`

DOM element resolution, attribute/property access, and helper entrypoints.

## Exported Functions

* [`get`](../functions/dom/get.md) - Get a value from a DOM element with a few legacy carve-outs.
* [`set`](../functions/dom/set.md) - Set a value on a DOM element using legacy-safe attribute/property rules.
* [`is`](../functions/dom/is.md) - Check whether a value is a DOM Element.
* [`isDom`](../functions/dom/isDom.md) - Check whether a value is a DOM Element.
* [`getElement`](../functions/dom/getElement.md) - Resolve an element reference.
* [`byId`](../functions/dom/byId.md) - Alias for document.getElementById.
* [`removeElement`](../functions/dom/removeElement.md) - Remove an element from the DOM.
* [`qs`](../functions/dom/qs.md) - Parse the current query string into a plain object.
* [`insertAfter`](../functions/dom/insertAfter.md) - Insert a DOM node immediately after another node.
* [`filterAttributes`](../functions/dom/filterAttributes.md) - Collect an element's attributes into a plain object, optionally filtering by regex.
* [`attempt`](../functions/dom/attempt.md) - Best-effort coercion from mixed input into a DOM node.

## Nested Namespaces

* `create` -> [lib.dom.create](./DOM_CREATE.md)
* `append` -> [lib.dom.append](./DOM_APPEND.md)

## Related

* Module index -> [./INDEX.md](./INDEX.md)
* Function index -> [../functions/INDEX.md](../functions/INDEX.md)
* API index -> [../INDEX.md](../INDEX.md)

