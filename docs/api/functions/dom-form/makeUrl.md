# Function: lib.dom.form.makeUrl

[README](../../../../README.md) -> [API Index](../../INDEX.md) -> [Modules Index](../../modules/INDEX.md) -> [lib.dom.form](../../modules/DOM_FORM.md) -> [makeUrl](./makeUrl.md)

Source Module: `src/lib/dom/form/index.js`
Source Location: `src/lib/dom/form/submit.js:119`

## Signature

```js
makeUrl(collectedForm, opts = {})
```

## Summary

Resolve final submit URL for the current request.

## Parameters

* `collectedForm.url`: URL from form action.
* `collectedForm.method`: form method.
* `collectedForm.parms`: tuple list used for GET query build.
* `opts.url`: explicit URL override.
* `opts.method`: explicit method override.

## Behavior

* URL fallback chain:
  * `opts.url`
  * `collectedForm.url`
  * `lib._env.location.href`
  * `lib._env.root.location.href`
  * `""`
* For GET method, appends query string generated from `collectedForm.parms`.

## Returns

String URL.

## Related

* Module page -> [../../modules/DOM_FORM.md](../../modules/DOM_FORM.md)
* `submit` -> [./submit.md](./submit.md)
* API index -> [../../INDEX.md](../../INDEX.md)

