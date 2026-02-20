# Function: lib.dom.form.arrayToQS

[README](../../../../README.md) -> [API Index](../../INDEX.md) -> [Modules Index](../../modules/INDEX.md) -> [lib.dom.form](../../modules/DOM_FORM.md) -> [arrayToQS](./arrayToQS.md)

Source Module: `src/lib/dom/form/index.js`
Source Location: `src/lib/dom/form/collectForm.js:159`

## Signature

```js
arrayToQS(list, asArray = false)
```

## Summary

Convert tuple list (`[key, value]`) into URL-encoded query-string parts.

## Parameters

* `list`: tuple list.
* `asArray`: when true, returns array of `key=value` segments; otherwise joined string.

## Behavior

* Skips rows with nullish keys.
* Encodes key and value with `encodeURIComponent`.
* Nullish values become empty string values.

## Returns

String query (`"a=1&b=2"`) or array of segments.

## Related

* `makeUrl` -> [./makeUrl.md](./makeUrl.md)
* `makeBody` -> [./makeBody.md](./makeBody.md)
* Module page -> [../../modules/DOM_FORM.md](../../modules/DOM_FORM.md)
* API index -> [../../INDEX.md](../../INDEX.md)

