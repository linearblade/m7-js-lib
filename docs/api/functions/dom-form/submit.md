# Function: lib.dom.form.submit

[README](../../../../README.md) -> [API Index](../../INDEX.md) -> [Modules Index](../../modules/INDEX.md) -> [lib.dom.form](../../modules/DOM_FORM.md) -> [submit](./submit.md)

Source Module: `src/lib/dom/form/index.js`
Source Location: `src/lib/dom/form/submit.js:307`

## Signature

```js
submit(trigger, opts = {})
```

## Summary

Submit a form from either a DOM trigger element or an already collected payload.

## Parameters

* `trigger`: DOM element inside a form, or a collected-form object from `collectForm`.
* `opts.mode`: `"ajax"` (default) or `"form"` (native `form.submit()`).
* `opts.load(payload)`: success callback.
* `opts.error(payload)`: error callback.
* `opts.on(data, opts, envelope)`: pre-send hook; return `false` to cancel or return object to replace envelope.
* `opts.headers`: request headers merged into generated headers.
* `opts.contentType`: request encoding hint (default `application/x-www-form-urlencoded`).
* `opts.confirmMsg`: prompt message for `window.confirm`.
* `opts.debug`: enable debug logging.
* `opts.structured`: JSON mode shape control (`true` inflates dotted keys).
* `opts.url`: URL override.
* `opts.method`: method override.
* `opts.response`: response parser enum (`auto`, `json`, `text`); unknown values fall back to `auto`.
* `opts.valueAsBody`: key to extract and send as whole body.
* `opts.credentials`: forwarded into request envelope.
* `opts.timeoutMs`: forwarded into request envelope.

## Behavior

* Runs in fixed order: confirm -> header -> body -> on -> submit.
* Uses `makeUrl`, `makeHeader`, `makeBody` helpers to build request inputs.
* Normalizes `opts.response` to explicit parser modes only (`auto`/`json`/`text`), defaulting to `auto`.
* Builds envelope via `lib.request.makeEnvelope`.
* Sends via `lib.request.send` through internal `_handleSubmit`.
* Returns normalized payload with `ok`, `status`, `statusText`, `result`, `error`, `data`, and `opts`.

## Returns

`Promise<Object|undefined>` depending on mode, cancellation, and input validity.

## Related

* Module page -> [../../modules/DOM_FORM.md](../../modules/DOM_FORM.md)
* `makeHeader` -> [./makeHeader.md](./makeHeader.md)
* `makeBody` -> [./makeBody.md](./makeBody.md)
* `makeUrl` -> [./makeUrl.md](./makeUrl.md)
* API index -> [../../INDEX.md](../../INDEX.md)
