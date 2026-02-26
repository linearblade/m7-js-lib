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
```

## Notes

* String rows use `<name>[:arg0,arg1,key=value,...]`.
* Input may be string rows, hash rows, or a mixed array.
* Invalid rows throw an Error with row index and value context.
* Output rows always include operation key (`fn` or configured key), `pos`, `kv`, and `args`.

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
