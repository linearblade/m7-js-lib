/**
 * lib.dom.form.submit
 *
 * Form-submit orchestration for lightweight DOM-driven flows.
 *
 * Design intent:
 * - Keep submit flow linear and easy to reason about.
 * - Keep DOM collection responsibilities in `collectForm`.
 * - Build a transport envelope and delegate network IO to `lib.request.send`.
 *
 * Submit pipeline:
 * 1) confirm
 * 2) header
 * 3) body
 * 4) on (caller may mutate/replace envelope)
 * 5) submit
 *
 * This module exports a `make(lib, deps)` factory and returns:
 * - `submit(trigger, opts)` (primary API)
 * - `makeUrl(collectedForm, opts)` (helper)
 * - `makeBody(collectedForm, opts)` (helper)
 * - `makeHeader(opts)` (helper)
 */
export function make(lib, deps = {}) {
    const collectForm = deps.collectForm;
    const arrayToQS = deps.arrayToQS;
    const toJson = deps.toJson;

    /**
     * Normalize content-type shorthands into explicit mime values.
     *
     * @param {*} v
     * @returns {string}
     */
    function normalizeContentType(v) {
	const ct = (v || '').toLowerCase().trim();
	if (ct === 'json' || ct === 'application/json') return 'application/json';
	if (ct === 'urlencoded' || ct === 'form' || ct === 'application/x-www-form-urlencoded') {
	    return 'application/x-www-form-urlencoded';
	}
	if (ct === 'formdata' || ct === 'multipart' || ct === 'multipart/form-data') {
	    return 'multipart/form-data';
	}
	return v || 'application/x-www-form-urlencoded';
    }

    /**
     * Build request body from collected form payload.
     *
     * Behavior:
     * - GET requests return `null`.
     * - `valueAsBody` (if provided) extracts a single collected value by key.
     * - JSON mode uses `toJson(collectedForm, { inflate: opts.structured })`.
     * - urlencoded mode uses `arrayToQS(collectedForm.parms)`.
     * - multipart mode builds `FormData`.
     *
     * @param {{ method?: string, parms: Array<[string, *]> }} collectedForm
     * @param {Object} [opts]
     * @param {string} [opts.method]
     * @param {string} [opts.contentType]
     * @param {boolean} [opts.structured]
     * @param {string|null} [opts.valueAsBody]
     * @returns {*}
     */
    function makeBody(collectedForm, opts = {}) {
	opts = lib.hash.to(opts, 'contentType');
	const method = String(opts.method || collectedForm?.method || 'POST').toUpperCase();
	if (method === 'GET') return null;

	const contentType = normalizeContentType(
	    opts.contentType || 'application/x-www-form-urlencoded'
	);
	const useStructured = !!opts.structured;
	const valueAsBody = opts.valueAsBody ?? null;

	if (valueAsBody) {
	    let useVal = '';
	    for (const [key, val] of collectedForm.parms) {
		if (key == valueAsBody) {
		    useVal = val;
		    break;
		}
	    }
	    return (typeof useVal === 'string') ? JSON.stringify(useVal) : useVal;
	}

	if (contentType === 'application/json') {
	    return JSON.stringify(toJson(collectedForm, { inflate: useStructured }));
	}

	if (contentType === 'application/x-www-form-urlencoded') {
	    return arrayToQS(collectedForm.parms);
	}

	const body = new FormData();
	for (const [k, v] of collectedForm.parms) body.append(k, v);
	return body;
    }

    /**
     * Build final request URL.
     *
     * Resolution order:
     * - opts.url
     * - collectedForm.url
     * - lib._env.location.href
     * - lib._env.root.location.href
     * - ""
     *
     * GET behavior:
     * - Appends query string built from `collectedForm.parms`.
     *
     * @param {{ url?: string, method?: string, parms?: Array<[string, *]> }} collectedForm
     * @param {Object} [opts]
     * @param {string} [opts.url]
     * @param {string} [opts.method]
     * @returns {string}
     */
    function makeUrl(collectedForm, opts = {}) {
	opts = lib.hash.to(opts, 'url');
	const method = String(opts.method || collectedForm?.method || 'GET').toUpperCase();

	let finalURL =
	      opts.url ||
	      collectedForm?.url ||
	      lib.hash.get(lib, "_env.location.href") ||
	      lib.hash.get(lib, "_env.root.location.href") ||
	      "";

	if (method === 'GET') {
	    const qs = arrayToQS(collectedForm?.parms || []);
	    if (qs) finalURL += (String(finalURL).includes('?') ? '&' : '?') + qs;
	}

	return finalURL;
    }

    /**
     * Build request headers.
     *
     * Rules:
     * - Always starts with `Accept: application/json`.
     * - Merges caller headers over defaults.
     * - Infers content-type from body when missing.
     * - Does not force Content-Type for FormData/multipart.
     *
     * @param {Object} [opts]
     * @param {string} [opts.method]
     * @param {Object} [opts.headers]
     * @param {string|null} [opts.contentType]
     * @param {*} [opts.body]
     * @returns {Object}
     */
    function makeHeader(opts = {}) {
	opts = lib.hash.to(opts, 'headers');
	const method = String(opts.method || 'POST').toUpperCase();
	let contentType = normalizeContentType(opts.contentType || null);
	const body = Object.prototype.hasOwnProperty.call(opts, 'body') ? opts.body : null;

	if ((!contentType || lib.utils.isEmpty(contentType)) && body) {
	    if (body instanceof FormData) contentType = 'multipart/form-data';
	    else if (typeof body === 'string') contentType = 'application/x-www-form-urlencoded';
	    else contentType = 'application/json';
	}

	const headers = Object.assign(
	    { 'Accept': 'application/json' },
	    (opts.headers && typeof opts.headers === "object") ? opts.headers : {}
	);

	if (body && method !== 'GET') {
	    if (contentType && contentType !== 'multipart/form-data' && !(body instanceof FormData)) {
		if (!headers['Content-Type']) {
		    headers['Content-Type'] = contentType;
		}
	    }
	}

	return headers;
    }

    /**
     * Dispatch envelope via `lib.request.send` and normalize callback payload.
     *
     * Callback payload shape:
     * - `ok`, `status`, `statusText`
     * - `result` (response body / returned payload)
     * - `resp` (reserved; currently null)
     * - `error` (Error/null)
     * - `data` (collected form object)
     * - `opts` (submit options used)
     *
     * @param {Object} input
     * @param {Object} input.envelope
     * @param {Object} input.data
     * @param {Object} input.opts
     * @param {Function|null} input.load
     * @param {Function|null} input.error
     * @returns {Promise<Object>}
     */
    async function _handleSubmit({ envelope, data, opts, load, error }) {
	try {
	    const out = await lib.request.send(envelope);
	    const base = lib.hash.to(out);
	    const payload = {
		ok: lib.bool.yes(base.ok),
		status: lib.number.toInt(base.status, 0),
		statusText: base.statusText || '',
		result: base.body,
		resp: null,
		error: lib.bool.yes(base.ok) ? null : (base.error || new Error(`HTTP ${lib.number.toInt(base.status, 0)}`)),
		data,
		opts
	    };

	    if (payload.ok) {
		if (typeof load === 'function') load(payload);
	    } else {
		if (typeof error === 'function') error(payload);
	    }

	    return payload;
	} catch (err) {
	    const payload = {
		ok: false,
		status: err?.status || 0,
		statusText: err?.statusText || err?.message || 'Network Error',
		result: null,
		resp: null,
		error: err,
		data,
		opts
	    };

	    if (typeof error === 'function') error(payload);
	    return payload;
	}
    }

    /**
     * Normalize submit input into a collected-form payload.
     *
     * Accepts either:
     * - collected-form shape (`{ form, parms, ... }`)
     * - DOM trigger element (collected via `collectForm`)
     *
     * @param {*} trigger
     * @returns {{ data: Object, domTrigger: * }|null}
     */
    function normalizeSubmitInput(trigger) {
	const isCollect = (x) => x && x.form && Array.isArray(x.parms);

	let data, domTrigger;

	if (isCollect(trigger)) {
            data = trigger;
            domTrigger = trigger.event || trigger.form;
	} else {
            if (!lib.dom.isDom(trigger)) {
		console.error('[form.submit] Invalid trigger element.');
		return null;
            }

            domTrigger = trigger;
            data = collectForm(trigger);

            if (!isCollect(data)) {
		console.error('[form.submit] Could not collect form data.');
		return null;
            }
	}

	return { data, domTrigger };
    }

    /**
     * Submit form data using native or AJAX transport.
     *
     * Main behavior:
     * - If `opts.confirmMsg` is set, asks for confirmation first.
     * - Accepts either a DOM trigger element or a pre-collected form payload.
     * - `mode: "form"` submits natively through `form.submit()`.
     * - Other modes use request envelope + `lib.request.send`.
     * - Optional `on(data, opts, envelope)` hook can mutate/replace envelope or cancel submit.
     *
     * Supported opts:
     * - `mode` (`"ajax"` default, `"form"` for native submit)
     * - `load(payload)` success callback
     * - `error(payload)` error callback
     * - `on(data, opts, envelope)` pre-send hook; return `false` to cancel; return object to replace envelope
     * - `headers` explicit request headers
     * - `contentType` request content type (`application/x-www-form-urlencoded` default)
     * - `confirmMsg` confirmation message shown via `window.confirm`
     * - `debug` enable debug logs
     * - `structured` controls JSON shaping (`true` => inflate dotted keys)
     * - `url` override target URL
     * - `method` override HTTP method
     * - `response` expected response parser hint (`json` -> force JSON parse; otherwise auto/text)
     * - `valueAsBody` key name to send as whole body value
     * - `credentials` forwarded into request envelope
     * - `timeoutMs` forwarded into request envelope
     *
     * @param {*} trigger
     * @param {Object} [opts]
     * @returns {Promise<Object|undefined>}
     */
    async function submit(trigger, opts = {}) {
	const {
            mode = 'ajax',
            load = null,
            error = null,
            on = null,
            contentType = 'application/x-www-form-urlencoded',
	    confirmMsg = null,
            debug = false,
	    structured: useStructured = false,
	    url: optsUrl = null,
	    method: optsMethod = null,
	    response:expectResponse = null,
	    valueAsBody = null
	} = opts;

	if (confirmMsg) {
	    const proceed = window.confirm(confirmMsg);
	    if (!proceed) {
		if (debug) console.debug('[form.submit] Submission cancelled by user confirmation');
		return;
	    }
	}

	const norm = normalizeSubmitInput(trigger);
	if (!norm) return;
	const { data } = norm;

	if (mode === 'form') {
            if (debug) console.debug('[form.submit] Submitting natively');
            data.form.submit();
            return;
	}

	const method = optsMethod || (data.method || 'POST').toUpperCase();
	const url = makeUrl(data, { method, url: optsUrl });

	const responseParse =
	      (expectResponse === 'json') ? 'json' :
	      (expectResponse ? 'text' : 'auto');

	const headers = makeHeader({
	    method,
	    headers: opts?.headers,
	    contentType,
	    body: null
	});

	const body = makeBody(data, {
	    method,
	    contentType,
	    structured: useStructured,
	    valueAsBody
	});

	let envelope = lib.request.makeEnvelope({
	    transport: 'http',
	    op: 'send',
	    url,
	    method,
	    headers,
	    contentType,
	    responseParse,
	    body,
	    credentials: opts?.credentials,
	    timeoutMs: opts?.timeoutMs
	});

	if (typeof on === 'function') {
            const res = on(data, opts, envelope);
            if (res === false) return;
            if (lib.hash.is(res)) envelope = res;
	}

	return _handleSubmit({
	    envelope,
	    data,
	    opts,
	    load,
	    error
	});
    }

    return {
	submit,
	makeUrl,
	makeBody,
	makeHeader,
    };
}

export default make;
