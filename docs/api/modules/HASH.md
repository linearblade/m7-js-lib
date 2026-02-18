# Module: lib.hash

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [lib.hash](./HASH.md)

Source: `src/lib/hash.js`

Plain-object utilities for deep path access, transforms, and filtering.

## Exported Functions

* [`get`](../functions/hash/get.md) - Safely get a nested value from an object using a dot-path.
* [`set`](../functions/hash/set.md) - Set a deep property on an object using a dotted path, creating missing intermediate objects as needed.
* [`legacySet`](../functions/hash/legacySet.md) - Legacy non-destructive dotted-path setter.
* [`expand`](../functions/hash/expand.md) - Expand a list of property paths from an object into an array of values.
* [`to`](../functions/hash/to.md) - Coerce any input into a hash (plain object).
* [`is`](../functions/hash/is.md) - Determine whether a value is a plain hash object.
* [`hasKeys`](../functions/hash/hasKeys.md) - Check that an object has all of the given keys / paths.
* [`append`](../functions/hash/append.md) - Shallow key/value decoration helper.
* [`merge`](../functions/hash/merge.md) - Deep merge two plain hashes (non-destructive).
* [`mergeMany`](../functions/hash/mergeMany.md) - Merge a list of hashes left-to-right.
* [`flatten`](../functions/hash/flatten.md) - Flatten a nested hash or array into a shallow key/value object.
* [`inflate`](../functions/hash/inflate.md) - Inflate a flat hash of key/value pairs into a nested object.
* [`exists`](../functions/hash/exists.md) - Check whether a deep property path exists.
* [`strip`](../functions/hash/strip.md) - Deep-strip unwanted values from a hash/array structure.
* [`filter`](../functions/hash/filter.md) - Filter an object or array by predicate.
* [`getUntilNotEmpty`](../functions/hash/getUntilNotEmpty.md) - Return the first non-null / non-undefined value found at any of the given paths.
* [`deepCopy`](../functions/hash/deepCopy.md) - Deep copy utility with class / DOM safeguards.
* [`keys`](../functions/hash/keys.md) - Return the enumerable keys of a hash.
* [`empty`](../functions/hash/empty.md) - Test whether a value is an empty hash (plain object with no keys).
* [`slice`](../functions/hash/slice.md) - Slice selected keys/paths from a record into a new object.

## Related

* Module index -> [./INDEX.md](./INDEX.md)
* Function index -> [../functions/INDEX.md](../functions/INDEX.md)
* API index -> [../INDEX.md](../INDEX.md)
