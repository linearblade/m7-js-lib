# Function: lib.str.interp

[README](../../../../README.md) -> [API Index](../../INDEX.md) -> [Modules Index](../../modules/INDEX.md) -> [lib.str](../../modules/STR.md) -> [interp](./interp.md)

Source Module: `src/lib/str/interp.js`
Source Location: `src/lib/str/interp.js:103`

## Signature

```js
interp(tpl, scheme, opts)
```

## Summary

Interpolate `${...}` tokens in a string template with hash lookup and eval-based fallback modes.

## Parameters

* `tpl` (`string`): source string that may contain `${...}` tokens.
* `scheme` (`Object|Function`, optional):
  * hash mode: token bodies are looked up via `lib.hash.get(scheme, tokenBody)`
  * empty hash mode (`{}`): lookup is against host root (`lib._env.root` / global fallback)
  * function mode: called for each token as `scheme(tokenBody)`
  * default mode (no usable scheme): token bodies are evaluated with `eval`
* `opts` (`Object|boolean|number`, optional):
  * `eval`: evaluate the final interpolated output with `eval` (also forces `quote`)
  * `quote`: wrap each token result in single quotes before replacement
  * `tpl`: per-token formatter string; first `%s` is replaced with token value
  * `literal`: if `tpl` is exactly one token (`"${...}"`), return the raw resolved value

## Examples

```js
lib.str.interp("Hello ${name}", { name: "Jill" });
// "Hello Jill"

lib.str.interp("${a}+${b}", { a: 2, b: 3 }, { tpl: "Number(%s)" });
// "Number(2)+Number(3)"

lib.str.interp("${a}+${b}", { a: 2, b: 3 }, { tpl: "Number(%s)", eval: 1 });
// 5

lib.str.interp("${a}", { a: [1, 2, 3] }, { literal: 1 });
// [1, 2, 3]

lib.str.interp("${a}", { base: 5, a: (key, env) => env.base + 2 }, { literal: 1 });
// 7
```

## Notes

* This is a best-effort interpolation helper, not a parser.
* Token extraction is regex-based and intentionally permissive.
* In hash mode, function values are called as `fn(tokenKey, schemeObj)`.

## Returns

Return behavior is defined by the source JSDoc contract and implementation in the source module.

## Related

* Module page -> [../../modules/STR.md](../../modules/STR.md)
* Module function list -> [../../functions/INDEX.md](../../functions/INDEX.md)
* API index -> [../../INDEX.md](../../INDEX.md)
