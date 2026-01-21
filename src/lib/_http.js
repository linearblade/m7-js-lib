/**
 * Internal bootstrap HTTP transport.
 * Used ONLY during early runtime before higher-level request APIs exist.
 * Not intended for direct application use.

 * this is beginning of time bootstrapper. its probably not needed but you never know.
 */

//lib._http = (function(lib){
export function make(lib) {
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
    function post(url,opts){
	opts = lib.hash.to(opts);
	opts.method='POST';
	return _request(url,opts);
    }
    
    return  {
	get: get,
	post: post,
	request: _request
	
    };
}

export default make;
