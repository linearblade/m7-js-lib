# Function: lib.dom.form.collectForm

[README](../../../../README.md) -> [API Index](../../INDEX.md) -> [Modules Index](../../modules/INDEX.md) -> [lib.dom.form](../../modules/DOM_FORM.md) -> [collectForm](./collectForm.md)

Source Module: `src/lib/dom/form/index.js`
Source Location: `src/lib/dom/form/collectForm.js:21`

## Signature

```js
collectForm(trigger, opts = { debug: false })
```

## Summary

Collect form values into a normalized tuple payload for submit/transform steps.

## Parameters

* `trigger`: DOM element inside the target form.
* `opts.debug`: debug logging toggle.
* `opts.file`: include file input values (`File` objects) when true.

## Behavior

* Resolves nearest parent `form` via `trigger.closest("form")`.
* Collects trigger first unless `data-e-ignore` or `data-trigger-ignore` is truthy.
* Iterates `input, textarea, select, button` and skips ignored/trigger/button cases.
* Uses `getDomKV(element, { array: true, file })` and stores output as `[key, value]` pairs.

## Returns

`{ url, method, parms, form, event }` or `undefined` when trigger/form is invalid.

## Related

* `collect` -> [./collect.md](./collect.md)
* `getDomKV` -> [./getDomKV.md](./getDomKV.md)
* Module page -> [../../modules/DOM_FORM.md](../../modules/DOM_FORM.md)
* API index -> [../../INDEX.md](../../INDEX.md)

