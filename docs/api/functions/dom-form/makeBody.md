# Function: lib.dom.form.makeBody

[README](../../../../README.md) -> [API Index](../../INDEX.md) -> [Modules Index](../../modules/INDEX.md) -> [lib.dom.form](../../modules/DOM_FORM.md) -> [makeBody](./makeBody.md)

Source Module: `src/lib/dom/form/index.js`
Source Location: `src/lib/dom/form/submit.js:65`

## Signature

```js
makeBody(collectedForm, opts = {})
```

## Summary

Create request body from collected form tuples.

## Parameters

* `collectedForm`: object with at least `parms` and optional `method`.
* `opts.method`: method override.
* `opts.contentType`: body encoding target.
* `opts.structured`: JSON shape mode (`true` inflates dotted keys).
* `opts.valueAsBody`: key name to extract and use as whole body.

## Behavior

* Returns `null` for GET requests.
* If `valueAsBody` is set, first matching key value is used as body.
* JSON mode returns `JSON.stringify(toJson(collectedForm, { inflate: structured }))`.
* URL-encoded mode returns query-string text from tuple list.
* Multipart mode returns `FormData` with one append per tuple.

## Returns

`null`, `string`, `FormData`, or scalar/object value when `valueAsBody` is used.

## Related

* Module page -> [../../modules/DOM_FORM.md](../../modules/DOM_FORM.md)
* `toJson` -> [./toJson.md](./toJson.md)
* `submit` -> [./submit.md](./submit.md)
* API index -> [../../INDEX.md](../../INDEX.md)

