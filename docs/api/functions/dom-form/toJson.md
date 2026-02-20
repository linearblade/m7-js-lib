# Function: lib.dom.form.toJson

[README](../../../../README.md) -> [API Index](../../INDEX.md) -> [Modules Index](../../modules/INDEX.md) -> [lib.dom.form](../../modules/DOM_FORM.md) -> [toJson](./toJson.md)

Source Module: `src/lib/dom/form/index.js`
Source Location: `src/lib/dom/form/collectForm.js:70`

## Signature

```js
toJson(input, opts = {})
```

## Summary

Convert form data into object form from either a trigger element or a collected payload.

## Parameters

* `input`: DOM trigger element or collected form object.
* `opts.inflate`: shape mode (default true). `true` inflates dotted keys; `false` keeps flat literal keys.

## Behavior

* If input is not already collected, calls `collectForm(input, opts)`.
* `inflate: true` returns nested object by expanding dotted keys.
* `inflate: false` returns flat object where repeated keys become arrays.

## Returns

JSON-like plain object or `undefined` if collection fails.

## Related

* `collectForm` -> [./collectForm.md](./collectForm.md)
* Module page -> [../../modules/DOM_FORM.md](../../modules/DOM_FORM.md)
* API index -> [../../INDEX.md](../../INDEX.md)
