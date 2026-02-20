# Function: lib.dom.form.arrayToHash

[README](../../../../README.md) -> [API Index](../../INDEX.md) -> [Modules Index](../../modules/INDEX.md) -> [lib.dom.form](../../modules/DOM_FORM.md) -> [arrayToHash](./arrayToHash.md)

Source Module: `src/lib/dom/form/index.js`
Source Location: `src/lib/dom/form/collectForm.js:173`

## Signature

```js
arrayToHash(list)
```

## Summary

Convert tuple list (`[key, value]`) into object form with repeated keys aggregated as arrays.

## Parameters

* `list`: tuple list.

## Behavior

* Uses `lib.hash.set` so dotted keys become nested objects.
* First key occurrence stored as scalar.
* Repeat occurrences for same key are promoted to array and appended in encounter order.

## Returns

Plain object with nested paths and repeat-key arrays.

## Related

* `toJson` -> [./toJson.md](./toJson.md)
* Module page -> [../../modules/DOM_FORM.md](../../modules/DOM_FORM.md)
* API index -> [../../INDEX.md](../../INDEX.md)
