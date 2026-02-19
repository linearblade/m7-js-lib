**Findings (ordered by severity)**

[x] 2. [P1] Replacement values containing `$` are corrupted.  
`/Users/hr/personal/code/php/TileSphere/vendor/m7-js-lib/src/lib/str/interp.js:24`  
`String.replace` interprets `$` sequences in replacement strings (`$&`, `$$`, etc.). The helper at `:15` (`escapeReplacement`) exists but is unused.  
Repro: `lib.str.interp('X=${v}', { v: '$&' })` returns `X=${v}` (expected `X=$&`).

[x] 3. [P2] String-based function schemes are detected but not applied.  
`/Users/hr/personal/code/php/TileSphere/vendor/m7-js-lib/src/lib/str/interp.js:51`  
`lib.func.get(scheme)` is used only as a boolean check; its returned function is never assigned back. If `scheme` is a string path, `scheme(v)` at `:63` throws.  
Repro: `lib.str.interp('V=${x}', 'Math.abs')` throws `TypeError: scheme is not a function`.

[x] 4. [P2] Array interpolation values are truncated to first element.  
`/Users/hr/personal/code/php/TileSphere/vendor/m7-js-lib/src/lib/str/interp.js:23`  
`interpReplace` coerces any array value to `[0]`, so `${x}` with `{x:[1,2,3]}` becomes `1`, not `"1,2,3"`.

[x] 5. [P3] `replaceAll` may break compatibility on older runtimes.  
`/Users/hr/personal/code/php/TileSphere/vendor/m7-js-lib/src/lib/str/interp.js:66`  
If you still target older engines, this is a regression risk (other files in repo explicitly avoid `replaceAll` for compatibility).

