/**
 * Internal bootstrap HTTP transport.
 * Used ONLY during early runtime before higher-level request APIs exist.
 * Not intended for direct application use.
 *
 * Transport model:
 * - Uses `XMLHttpRequest` from `lib._env.root`.
 * - Asynchronous only.
 * - Callback-driven (`load` / `error` handlers).
 *
 * Scope:
 * - This is intentionally low-level and legacy-compatible.
 * - No retry, timeout policy, or request cancellation orchestration is provided.
 */

//lib._http = (function(lib){
/**
 * Build the internal HTTP helper namespace.
 *
 * Runtime dependencies:
 * - `lib._env.root.XMLHttpRequest`
 * - `lib.hash`, `lib.array`, `lib.func`
 *
 * @param {Object} lib
 * @returns {{
 *   get: Function,
 *   post: Function,
 *   request: Function
 * }}
 */
export function make(lib) {
    /**
     * Issue a simple async request (default `GET`) with callback dispatch.
     *
     * Semantics:
     * - Coerces `opts` via `lib.hash.to`.
     * - Uses `opts.method` when provided (default `"GET"`).
     * - Uses `opts.body` as request body.
     * - If `opts.credentials === true`, enables `withCredentials`.
     * - On completion:
     *   - `status >= 400` -> invokes resolved `opts.error`
     *   - otherwise -> invokes resolved `opts.load`
     *
     * @param {string} url
     * @param {Object|*} [opts]
     * @param {string} [opts.method="GET"]
     * @param {*} [opts.body]
     * @param {boolean} [opts.credentials]
     * @param {Function|string} [opts.load]
     * @param {Function|string} [opts.error]
     * @param {boolean} [opts.debug]
     * @returns {XMLHttpRequest}
     * @throws {Error} When `XMLHttpRequest` is unavailable.
     */
    function get (url, opts) {
        opts = lib.hash.to(opts);
        if (opts.debug) console.log('opts', opts);

        const XHR = lib._env?.root?.XMLHttpRequest;
        if (!XHR) throw new Error("XHR unavailable");

        const req = new XHR();
        const method = lib.hash.get(opts, 'method', "GET");

        // open (always async)
        req.open(method, url, true);

        // 4/16/24 -- added with credentials.
        if (opts.credentials === true) req.withCredentials = true;

        req.onreadystatechange = function () {
            if (req.readyState === XHR.DONE) {
                if (req.status >= 400) lib.func.get(opts.error, 1)(req);
                else lib.func.get(opts.load, 1)(req);
            }
        };

        req.send(lib.hash.get(opts, 'body'));
        return req;
    };
    
    /**
     * Issue a configurable async request.
     *
     * Adds support for:
     * - Header list (`opts.header`)
     * - URL-encoded content-type toggle (`opts.urlencoded`)
     * - Optional JSON parse of response (`opts.json === 1`)
     * - Captured request metadata on `req.request`
     *
     * Notes:
     * - Header entries are expected as hash-like items `{name, value}`.
     * - JSON parse failures are swallowed and recorded as `req.jsonData = undefined`.
     *
     * @param {string} url
     * @param {Object|*} [opts]
     * @param {string} [opts.method="GET"]
     * @param {Array|*} [opts.header]
     * @param {boolean} [opts.urlencoded]
     * @param {number|boolean} [opts.json]
     * @param {*} [opts.body]
     * @param {boolean} [opts.credentials]
     * @param {Function|string} [opts.load]
     * @param {Function|string} [opts.error]
     * @param {boolean} [opts.debug]
     * @returns {XMLHttpRequest}
     * @throws {Error} When `XMLHttpRequest` is unavailable.
     */
    function _request(url, opts) {
	opts = lib.hash.to(opts);

	const XHR = lib._env?.root?.XMLHttpRequest;
	if (!XHR) throw new Error("XHR unavailable");

	const req = new XHR();

	const method  = lib.hash.get(opts, 'method', "GET");
	const headers = lib.array.to(opts.header);

	// open (always async)
	req.open(method, url, true);

	// 4/16/24 -- added with credentials.
	if (opts.credentials === true) req.withCredentials = true;

	if (opts.urlencoded) {
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	}

	for (const h of headers) {
            if (lib.hash.is(h)) {
		req.setRequestHeader(h.name, h.value);
            }
	}

	req.request = {
            url,
            body: lib.hash.get(opts, 'body')
	};

	req.onreadystatechange = function () {
            if (req.readyState === XHR.DONE) {
		if (opts.json === 1) {
                    try {
			req.jsonData = JSON.parse(String(req.responseText));
                    } catch (e) {
			req.jsonData = undefined;
                    }
		}

		if (req.status >= 400) lib.func.get(opts.error, 1)(req);
		else lib.func.get(opts.load, 1)(req);
            }
	};

	if (opts.debug) console.log('sending', opts, req);

	req.send(lib.hash.get(opts, 'body'));
	return req;
    }

    /**
     * Convenience POST wrapper over `_request`.
     *
     * @param {string} url
     * @param {Object|*} [opts]
     * @returns {XMLHttpRequest}
     */
    function post(url,opts){
	opts = lib.hash.to(opts);
	opts.method='POST';
	return _request(url,opts);
    }
    
    /**
     * Public dispatch surface for `lib._http`.
     *
     * @type {{ get: Function, post: Function, request: Function }}
     */
    return  {
	get: get,
	post: post,
	request: _request
	
    };
}

export default make;
