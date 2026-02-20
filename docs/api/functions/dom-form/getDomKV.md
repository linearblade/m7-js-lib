# Function: lib.dom.form.getDomKV

[README](../../../../README.md) -> [API Index](../../INDEX.md) -> [Modules Index](../../modules/INDEX.md) -> [lib.dom.form](../../modules/DOM_FORM.md) -> [getDomKV](./getDomKV.md)

Source Module: `src/lib/dom/form/index.js`
Source Location: `src/lib/dom/form/collectForm.js:82`

## Signature

```js
getDomKV(element, opts = {})
```

## Summary

Read a DOM form element into key/value collection entries.

## Parameters

* `element`: target DOM element.
* `opts.array`: when true, always return an array of entries.
* `opts.file`: when true, include file input values as `File` objects.

## Behavior

* Default shape is `{ key, value }`; array mode returns `[{ key, value }, ...]`.
* `<select multiple>` returns one entry per selected option.
* `<input type="file">` returns one entry per selected file only when `opts.file` is truthy.
* File entries include `file: true` marker.
* Checkboxes/radios:
  * checked with no explicit value emits `"on"`
  * unchecked with `data-uncheck` emits that fallback value
  * unchecked without fallback emits nothing
* Supports `data-attr-name` for key attribute and `data-collect`/`data-attr-value` for value attribute selection.

## Returns

`undefined`, `{ key, value }`, `[]`, or `[{ key, value, file? }]` depending on options and element type.

## Related

* `collectForm` -> [./collectForm.md](./collectForm.md)
* Module page -> [../../modules/DOM_FORM.md](../../modules/DOM_FORM.md)
* API index -> [../../INDEX.md](../../INDEX.md)

