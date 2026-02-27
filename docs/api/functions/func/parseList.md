# Function: lib.func.parseList

[README](../../../../README.md) -> [API Index](../../INDEX.md) -> [Modules Index](../../modules/INDEX.md) -> [lib.func](../../modules/FUNC.md) -> [parseList](./parseList.md)

Source Module: `src/lib/func/parseList.js`
Source Location: `src/lib/func/parseList.js:17`

## Signature

```js
parseList(str, opts)
```

## Summary

Parse a compact function-list DSL into normalized call records.

## Usage

```js
// Default mode: args auto-select (kv when "=" appears, else pos)
lib.func.parseList("setTitle:Dashboard;notify:level=info,message=Ready");

// Use operation key "op" instead of "fn"
lib.func.parseList("show:hero=true", { fn: "op" });

// Force args output shape
lib.func.parseList("a:1,2; b:x=1", { args: "pos" }); // args is always positional array
lib.func.parseList("a:1,2; b:x=1", { args: "kv"  }); // args is always kv object

// Dot-path assignment into kv via lib.hash.set
lib.func.parseList("cfg:a.b=1,a.c=2", { dot: true, args: "kv" });
// kv => { a: { b: "1", c: "2" } }

// Repeated key collection
lib.func.parseList("cfg:foo=5,foo=4", { push: true, args: "kv" });
// kv => { foo: ["5", "4"] }
```

## Notes

* String rows use `<name>[:arg0,arg1,key=value,...]`.
* Input may be string rows, hash rows, or a mixed array.
* Invalid rows throw an Error with row index and value context.
* Output rows always include operation key (`fn` or configured key), `pos`, `kv`, and `args`.
* Hash rows with an existing `args` field keep that value; `parseList` does not overwrite it.
* String-parsed rows always compute `args` from mode (`pos` / `kv` / `auto`).
* `dot: true` (alias: `nested: true`) enables dot-path writes into `kv` via `lib.hash.set`.
* `push: true` (alias: `repeat: true`) accumulates repeated key assignments into arrays.

## Lazy Value Evaluation

If you want lazy/runtime value expansion, keep `parseList` as a structural parser and
evaluate arg values afterward with `lib.str.interp` using `${...}` tokens.

```js
const rows = lib.func.parseList("setTitle:${page.title};show:hero=${flags.hero}", { args: "kv" });

for (const row of rows) {
  if (lib.hash.is(row.args)) {
    for (const key in row.args) {
      const v = row.args[key];
      if (lib.str.is(v)) row.args[key] = lib.str.interp(v, scope); // scope is your runtime object
    }
  }
}
```

## Related

* Module page -> [../../modules/FUNC.md](../../modules/FUNC.md)
* Module function list -> [../../functions/INDEX.md](../../functions/INDEX.md)
* API index -> [../../INDEX.md](../../INDEX.md)
