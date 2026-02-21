# `lib.hash.set` Numeric Segment Hazard

`lib.hash.set` does **not** treat numeric segments as array indexes by default.

- Default: `lib.hash.set(obj, "addresses.0.line1", "x")`
  - `"0"` is a **string key** on an object.
  - Result shape: `{ addresses: { "0": { line1: "x" } } }`

If you want array semantics, pass `arrayIndex: true`:

- `lib.hash.set(obj, "addresses.0.line1", "x", { arrayIndex: true })`
  - Missing containers are created as arrays when the next segment is numeric.
  - Result shape: `{ addresses: [ { line1: "x" } ] }`

Important behavior:
- It only creates arrays on missing paths.
- It will **not** convert an already-existing object into an array.
- `lib.hash.get`/`exists` can traverse arrays using numeric path tokens (`"a.0.b"`).
