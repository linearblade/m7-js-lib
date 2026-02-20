# Module: lib.dom.form

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [lib.dom.form](./DOM_FORM.md)

Source: `src/lib/dom/form/index.js`

Form collection and lightweight submit orchestration helpers for DOM forms.

## Exported Functions

* [`submit`](../functions/dom-form/submit.md) - Submit from a trigger or collected payload through native or request-envelope flow.
* [`collect`](../functions/dom-form/collect.md) - Alias of `collectForm`.
* [`collectForm`](../functions/dom-form/collectForm.md) - Collect a form into `{ url, method, parms, form, event }`.
* [`toJson`](../functions/dom-form/toJson.md) - Convert trigger/collected form into JSON-like object (inflated or flat).
* [`makeUrl`](../functions/dom-form/makeUrl.md) - Build final URL, appending query params for GET.
* [`makeHeader`](../functions/dom-form/makeHeader.md) - Build request headers from method/body/content type inputs.
* [`makeBody`](../functions/dom-form/makeBody.md) - Build request body using JSON/urlencoded/form-data rules.
* [`getDomKV`](../functions/dom-form/getDomKV.md) - Read one element into `{key,value}` entry (or list of entries).
* [`arrayToQS`](../functions/dom-form/arrayToQS.md) - Convert key/value tuple list into query string.
* [`arrayToHash`](../functions/dom-form/arrayToHash.md) - Convert key/value tuple list into object with repeat keys as arrays.

## Related

* Parent module -> [./DOM.md](./DOM.md)
* Module index -> [./INDEX.md](./INDEX.md)
* Function index -> [../functions/INDEX.md](../functions/INDEX.md)
* API index -> [../INDEX.md](../INDEX.md)
