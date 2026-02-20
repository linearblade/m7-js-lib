# Function: lib.dom.form.makeHeader

[README](../../../../README.md) -> [API Index](../../INDEX.md) -> [Modules Index](../../modules/INDEX.md) -> [lib.dom.form](../../modules/DOM_FORM.md) -> [makeHeader](./makeHeader.md)

Source Module: `src/lib/dom/form/index.js`
Source Location: `src/lib/dom/form/submit.js:154`

## Signature

```js
makeHeader(opts = {})
```

## Summary

Build request headers for form submit workflows.

## Parameters

* `opts.method`: request method (default `POST`).
* `opts.headers`: caller headers merged over defaults.
* `opts.contentType`: explicit content type hint.
* `opts.body`: optional body used for type inference.

## Behavior

* Always starts with `Accept: application/json`.
* If `contentType` is missing and `body` exists:
  * `FormData` -> multipart/form-data
  * `string` -> application/x-www-form-urlencoded
  * other objects -> application/json
* Adds `Content-Type` only when body exists, method is not GET, and body is not `FormData`.

## Returns

Plain header object.

## Related

* Module page -> [../../modules/DOM_FORM.md](../../modules/DOM_FORM.md)
* `submit` -> [./submit.md](./submit.md)
* API index -> [../../INDEX.md](../../INDEX.md)

