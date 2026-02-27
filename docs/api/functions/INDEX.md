# API Function Index

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Function Index](./INDEX.md)

Function pages are grouped by module.

## Modules

* **lib._boot**
  * [install](./boot/install.md) - Install normalized environment metadata onto `lib._env`.
  * [resolveRoot](./boot/resolveRoot.md) - Resolve the best-available root object.
* **lib._http**
  * [get](./http/get.md) - Issue a simple async request (default `GET`) with callback dispatch.
  * [post](./http/post.md) - Convenience POST wrapper over `_request`.
  * [request](./http/request.md) - Issue a configurable async request.
* **lib.args**
  * [parse](./args/parse.md) - Parse a positional argument list into a hash.
  * [slice](./args/slice.md) - Slice an arguments-like object into a real array.
  * [isArguments](./args/isArguments.md) - Determine whether a value is an `Arguments` object.
* **lib.array**
  * [append](./array/append.md) - Wrap each item in `input` with a prefix and postfix.
  * [subtract](./array/subtract.md) - Return a copy of `list` with all values in `exclude` removed.
  * [trim](./array/trim.md) - Normalize a value into an array and trim whitespace from string elements.
  * [is](./array/is.md) - Check whether a value is an Array.
  * [to](./array/to.md) - Coerce any input into an array.
  * [len](./array/len.md) - Return array length, or 0 if not an array.
  * [filterStrings](./array/filterStrings.md) - Normalize an input into an array of non-empty strings.
* **lib.bool**
  * [intentTrue](./bool/intentTrue.md) - Detect affirmative intent.
  * [intentFalse](./bool/intentFalse.md) - Detect negative intent.
  * [is](./bool/is.md) - Is the value a real boolean (true or false)?
  * [isIntent](./bool/isIntent.md) - Does the value explicitly encode boolean intent?
  * [to](./bool/to.md) - Strict boolean conversion.
  * [byIntent](./bool/byIntent.md) - Intent-based boolean conversion.
  * [hasIntent](./bool/hasIntent.md) - Alias of `lib.bool.isIntent`.
  * [ish](./bool/ish.md) - Alias of `lib.bool.isIntent`.
  * [yes](./bool/yes.md) - Alias of `lib.bool.intentTrue`.
  * [no](./bool/no.md) - Alias of `lib.bool.intentFalse`.
* **lib.func**
  * [name](./func/name.md) - Attempt to retrieve immediate caller info from the stack.
  * [wrapper](./func/wrapper.md) - Wrap one function with post-applied arguments.
  * [postWrap](./func/postWrap.md) - Wrap a function chain with post-applied arguments.
  * [preWrap](./func/preWrap.md) - Wrap a function chain with pre-applied arguments.
  * [get](./func/get.md) - Resolve a function target.
  * [parseList](./func/parseList.md) - Parse a compact function-list DSL into normalized call records.
* **lib.hash**
  * [get](./hash/get.md) - Safely get a nested value from an object using a dot-path.
  * [set](./hash/set.md) - Set a deep property on an object using a dotted path, creating missing intermediate objects as needed.
  * [legacySet](./hash/legacySet.md) - Legacy non-destructive dotted-path setter.
  * [expand](./hash/expand.md) - Expand a list of property paths from an object into an array of values.
  * [to](./hash/to.md) - Coerce any input into a hash (plain object).
  * [is](./hash/is.md) - Determine whether a value is a plain hash object.
  * [hasKeys](./hash/hasKeys.md) - Check that an object has all of the given keys / paths.
  * [append](./hash/append.md) - Shallow key/value decoration helper.
  * [merge](./hash/merge.md) - Deep merge two plain hashes (non-destructive).
  * [mergeMany](./hash/mergeMany.md) - Merge a list of hashes left-to-right.
  * [flatten](./hash/flatten.md) - Flatten a nested hash or array into a shallow key/value object.
  * [inflate](./hash/inflate.md) - Inflate a flat hash of key/value pairs into a nested object.
  * [exists](./hash/exists.md) - Check whether a deep property path exists.
  * [strip](./hash/strip.md) - Deep-strip unwanted values from a hash/array structure.
  * [filter](./hash/filter.md) - Filter an object or array by predicate.
  * [getUntilNotEmpty](./hash/getUntilNotEmpty.md) - Return the first non-null / non-undefined value found at any of the given paths.
  * [deepCopy](./hash/deepCopy.md) - Deep copy utility with class / DOM safeguards.
  * [keys](./hash/keys.md) - Return the enumerable keys of a hash.
  * [empty](./hash/empty.md) - Test whether a value is an empty hash (plain object with no keys).
  * [slice](./hash/slice.md) - Slice selected keys/paths from a record into a new object.
* **lib.number**
  * [clamp](./number/clamp.md) - Clamp a value between optional bounds.
  * [toInt](./number/toInt.md) - Parse/coerce a value into an integer using strict legacy-safe rules.
* **lib.require**
  * [all](./require/all.md) - Require targets on the main `lib` object.
  * [lib](./require/lib.md) - Alias of `lib.require.all`.
  * [service](./require/service.md) - Require one or more registered services.
* **lib.service**
  * [set](./service/set.md) - Register a service by name.
  * [get](./service/get.md) - Retrieve a service by name.
  * [start](./service/start.md) - Start a named service when it exposes `start()`.
  * [stop](./service/stop.md) - Stop a named service when it exposes `stop()`.
  * [list](./service/list.md) - List registered service names.
* **lib.str**
  * [is](./str/is.md) - Determine whether a value is a string primitive.
  * [lc](./str/lc.md) - Lowercase helper with optional forced coercion.
  * [to](./str/to.md) - Coerce a value to a string (legacy-safe, normalized).
  * [stripComments](./str/stripComments.md) - Strip JavaScript-style comments from source text.
  * [countChars](./str/countChars.md) - Counts the total occurrences of one or more characters in a string.
  * [interp](./str/interp.md) - Interpolate `${...}` tokens with hash/eval resolution modes.
* **lib.utils**
  * [isArray](./utils/isArray.md) - Alias passthrough to `lib.array.is`.
  * [toArray](./utils/toArray.md) - Alias passthrough to `lib.array.to`.
  * [isHash](./utils/isHash.md) - Alias passthrough to `lib.hash.is`.
  * [toHash](./utils/toHash.md) - Alias passthrough to `lib.hash.to`.
  * [deepCopy](./utils/deepCopy.md) - Alias passthrough to `lib.hash.deepCopy`.
  * [isScalar](./utils/isScalar.md) - Determine whether a value is a scalar (leaf value).
  * [toString](./utils/toString.md) - Alias passthrough to `lib.str.to`.
  * [baseType](./utils/baseType.md) - Determine the base type of a value, optionally comparing against allowed types.
  * [isEmpty](./utils/isEmpty.md) - Determine whether a value should be treated as "empty".
  * [linkType](./utils/linkType.md) - Classify a link-like value or test membership against allowed types.
  * [clamp](./utils/clamp.md) - Clamp a value to an allowed set.
  * [toNumber](./utils/toNumber.md) - Coerce a value into a finite number.
  * [getFunction](./utils/getFunction.md) - Alias passthrough to `lib.func.get`.
  * [stripComments](./utils/stripComments.md) - Alias passthrough to `lib.str.stripComments`.
  * [lc](./utils/lc.md) - Alias passthrough to `lib.str.lc`.
* **lib.dom**
  * [get](./dom/get.md) - Get a value from a DOM element with a few legacy carve-outs.
  * [set](./dom/set.md) - Set a value on a DOM element using legacy-safe attribute/property rules.
  * [is](./dom/is.md) - Check whether a value is a DOM Element.
  * [isDom](./dom/isDom.md) - Check whether a value is a DOM Element.
  * [getElement](./dom/getElement.md) - Resolve an element reference.
  * [byId](./dom/byId.md) - Alias for document.getElementById.
  * [removeElement](./dom/removeElement.md) - Remove an element from the DOM.
  * [qs](./dom/qs.md) - Parse the current query string into a plain object.
  * [insertAfter](./dom/insertAfter.md) - Insert a DOM node immediately after another node.
  * [filterAttributes](./dom/filterAttributes.md) - Collect an element's attributes into a plain object, optionally filtering by regex.
  * [attempt](./dom/attempt.md) - Best-effort coercion from mixed input into a DOM node.
* **lib.dom.create**
  * [css](./dom-create/css.md) - Create a stylesheet link element with default CSS attributes merged with caller attrs.
  * [link](./dom-create/link.md) - Alias of `lib.dom.create.css`.
  * [js](./dom-create/js.md) - Create a script element with default JS attributes merged with caller attrs.
  * [element](./dom-create/element.md) - Create a generic element and apply attributes/content.
* **lib.dom.append**
  * [before](./dom-append/before.md) - Insert `e` before `target`.
  * [after](./dom-append/after.md) - Insert `e` after `target`.
  * [prepend](./dom-append/prepend.md) - Insert `e` as first child of `target`.
  * [append](./dom-append/append.md) - Insert `e` as last child of `target`.
  * [beforeBegin](./dom-append/beforeBegin.md) - Insert `e` immediately before `target` using adjacent positioning.
  * [afterBegin](./dom-append/afterBegin.md) - Insert `e` as the first child inside `target`.
  * [beforeEnd](./dom-append/beforeEnd.md) - Insert `e` as the last child inside `target`.
  * [afterEnd](./dom-append/afterEnd.md) - Insert `e` immediately after `target` using adjacent positioning.
  * [adjacent](./dom-append/adjacent.md) - Insert using DOM-standard positions (mirrors insertAdjacentElement).
  * [replace](./dom-append/replace.md) - Replace target with element.
  * [remove](./dom-append/remove.md) - Remove target from DOM.
  * [empty](./dom-append/empty.md) - Empty a target (remove all children).
  * [resolveTarget](./dom-append/resolveTarget.md) - Resolve a target-ish input into a DOM Element.
* **lib.dom.form**
  * [submit](./dom-form/submit.md) - Submit from a trigger or collected payload through native or request-envelope flow.
  * [collect](./dom-form/collect.md) - Alias of `collectForm`.
  * [collectForm](./dom-form/collectForm.md) - Collect a form into `{ url, method, parms, form, event }`.
  * [toJson](./dom-form/toJson.md) - Convert trigger/collected form into JSON-like object (inflated or flat).
  * [makeUrl](./dom-form/makeUrl.md) - Build final URL, appending query params for GET.
  * [makeHeader](./dom-form/makeHeader.md) - Build request headers from method/body/content type inputs.
  * [makeBody](./dom-form/makeBody.md) - Build request body using JSON/urlencoded/form-data rules.
  * [getDomKV](./dom-form/getDomKV.md) - Read one element into `{key,value}` entry (or list of entries).
  * [arrayToQS](./dom-form/arrayToQS.md) - Convert key/value tuple list into query string.
  * [arrayToHash](./dom-form/arrayToHash.md) - Convert key/value tuple list into object with repeat keys as arrays.
* **lib.dom.transform**
  * [element](./dom-transform/element.md) - Bind a data scheme into one element subtree.
  * [list](./dom-transform/list.md) - Clone a template for each row and apply `transformElement`.

## Related

* Modules index -> [../modules/INDEX.md](../modules/INDEX.md)
* API index -> [../INDEX.md](../INDEX.md)
