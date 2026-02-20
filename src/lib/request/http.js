/**
 * HTTP request transport for lib.request.
 *
 * Envelope (subset):
 * - transport: "http" (defaulted upstream)
 * - endpoint.url OR endpoint.{scheme,host,port,path,query}
 * - method
 * - headers
 * - body
 * - encoding: json | urlencoded | formdata | multipart | text
 * - credentials.{mode,withCredentials}
 * - timeoutMs
 * - response.{parse,return,path}
 */
export function make(lib) {
    function toQueryString(hash) {
        const rows = [];

        for (const key in hash) {
            if (!Object.prototype.hasOwnProperty.call(hash, key)) continue;
            const value = hash[key];
            if (value === undefined || value === null) continue;

            if (Array.isArray(value)) {
                for (const v of value) {
                    if (v === undefined || v === null) continue;
                    rows.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
                }
                continue;
            }

            rows.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }

        return rows.join("&");
    }

    function resolveUrl(request) {
        const direct = lib.str.to(lib.hash.get(request, "endpoint.url"), true).trim();
        if (!lib.utils.isEmpty(direct)) return direct;

        const host = lib.str.to(lib.hash.get(request, "endpoint.host"), true).trim();
        if (lib.utils.isEmpty(host)) return undefined;

        const scheme = lib.str.to(lib.hash.get(request, "endpoint.scheme"), true).trim().toLowerCase() || "http";
        const port = lib.hash.get(request, "endpoint.port");
        let path = lib.str.to(lib.hash.get(request, "endpoint.path"), true).trim();

        if (lib.utils.isEmpty(path)) path = "/";
        if (path.charAt(0) !== "/") path = `/${path}`;

        let base = `${scheme}://${host}`;
        if (!lib.utils.isEmpty(port)) base += `:${port}`;

        const query = lib.hash.to(lib.hash.get(request, "endpoint.query"));
        const qs = toQueryString(query);
        if (qs) return `${base}${path}?${qs}`;
        return `${base}${path}`;
    }

    function getFetchFn() {
        if (typeof fetch === "function") return fetch;
        const envFetch = lib.hash.get(lib, "_env.root.fetch");
        if (typeof envFetch === "function") return envFetch.bind(lib.hash.get(lib, "_env.root"));
        throw new Error("[lib.request.http.send] fetch is not available in this runtime");
    }

    function normalizeEncoding(request, headers, body) {
        const explicit = lib.str.to(lib.hash.get(request, "encoding"), true).trim().toLowerCase();
        if (!lib.utils.isEmpty(explicit)) return explicit;

        const headerCT = String(headers["Content-Type"] || headers["content-type"] || "").toLowerCase();
        if (headerCT.includes("application/json")) return "json";
        if (headerCT.includes("application/x-www-form-urlencoded")) return "urlencoded";
        if (headerCT.includes("multipart/form-data")) return "formdata";

        if (body instanceof FormData) return "formdata";
        if (lib.hash.is(body) || Array.isArray(body)) return "json";
        return "";
    }

    function encodeBody({ method, body, headers, encoding }) {
        if (method === "GET" || method === "HEAD") return { body: undefined, headers };
        if (body === undefined || body === null) return { body: undefined, headers };

        let outBody = body;
        const outHeaders = Object.assign({}, headers);

        const setHeaderIfMissing = (k, v) => {
            if (!(k in outHeaders) && !(k.toLowerCase() in outHeaders)) outHeaders[k] = v;
        };

        const mode = String(encoding || "").toLowerCase();
        if (mode === "json" || mode === "application/json") {
            if (typeof outBody !== "string") outBody = JSON.stringify(outBody);
            setHeaderIfMissing("Content-Type", "application/json");
            return { body: outBody, headers: outHeaders };
        }

        if (mode === "urlencoded" || mode === "form" || mode === "application/x-www-form-urlencoded") {
            if (typeof outBody !== "string") {
                outBody = lib.hash.is(outBody) ? toQueryString(outBody) : String(outBody);
            }
            setHeaderIfMissing("Content-Type", "application/x-www-form-urlencoded");
            return { body: outBody, headers: outHeaders };
        }

        if (mode === "formdata" || mode === "multipart" || mode === "multipart/form-data") {
            if (!(outBody instanceof FormData)) {
                const fd = new FormData();
                if (lib.hash.is(outBody)) {
                    for (const key in outBody) {
                        if (!Object.prototype.hasOwnProperty.call(outBody, key)) continue;
                        const val = outBody[key];
                        if (Array.isArray(val)) {
                            for (const item of val) fd.append(key, item);
                        } else {
                            fd.append(key, val);
                        }
                    }
                } else {
                    fd.append("value", outBody);
                }
                outBody = fd;
            }
            return { body: outBody, headers: outHeaders };
        }

        if (lib.hash.is(outBody)) {
            outBody = JSON.stringify(outBody);
            setHeaderIfMissing("Content-Type", "application/json");
        }
        return { body: outBody, headers: outHeaders };
    }

    async function normalizeResponse(response) {
        const headers = {};
        if (response && response.headers && typeof response.headers.forEach === "function") {
            response.headers.forEach((v, k) => {
                headers[String(k).toLowerCase()] = v;
            });
        }

        const text = await response.text();
        const ct = String(headers["content-type"] || "").toLowerCase();
        let body = text;

        if (ct.includes("application/json") && text) {
            try { body = JSON.parse(text); } catch (err) { /* keep text */ }
        }

        return {
            ok: !!response.ok,
            status: response.status,
            statusText: response.statusText,
            url: response.url || null,
            headers,
            body,
            redirected: !!response.redirected,
        };
    }

    function parseJsonLoose(input) {
        if (typeof input !== "string") return input;
        const text = input.trim();
        if (!text) return input;
        try { return JSON.parse(text); } catch (err) { return input; }
    }

    function resolveResponseOutput(payload, responseCfg) {
        responseCfg = lib.hash.to(responseCfg);
        const parseMode = lib.str.to(lib.hash.get(responseCfg, "parse"), true).trim().toLowerCase() || "auto";
        const returnView = lib.str.to(lib.hash.get(responseCfg, "return"), true).trim().toLowerCase() || "payload";
        const body = payload ? payload.body : undefined;
        const headers = lib.hash.to(payload && payload.headers);
        const ct = lib.str.to(headers["content-type"], true).trim().toLowerCase();

        let parsedBody = body;
        if (parseMode === "json") parsedBody = parseJsonLoose(body);
        else if (parseMode === "text") parsedBody = (body === undefined || body === null) ? "" : lib.str.to(body, true);
        else if (parseMode === "auto" && typeof body === "string" && ct.includes("application/json")) parsedBody = parseJsonLoose(body);

        let out = payload;
        if (returnView === "body") out = parsedBody;
        else if (returnView === "json") out = parseJsonLoose(parsedBody);
        else if (returnView === "text") out = (parsedBody === undefined || parsedBody === null) ? "" : lib.str.to(parsedBody, true);
        else if (returnView === "headers") out = headers;
        else if (returnView === "status") out = payload ? payload.status : undefined;

        const path = lib.str.to(lib.hash.get(responseCfg, "path"), true).trim();
        if (!lib.utils.isEmpty(path)) return lib.hash.get(out, path);
        return out;
    }

    async function send(envelope = {}, opts = {}) {
        envelope = lib.hash.to(envelope);
        opts = lib.hash.to(opts);

        const url = resolveUrl(envelope);
        if (lib.utils.isEmpty(url)) {
            throw new Error("[lib.request.http.send] request endpoint URL is required");
        }

        const method = lib.str.to(lib.hash.get(envelope, "method"), true).trim().toUpperCase() || "GET";
        const headers = Object.assign({}, lib.hash.to(lib.hash.get(envelope, "headers")));
        const rawBody = lib.hash.get(envelope, "body");
        const encoding = normalizeEncoding(envelope, headers, rawBody);
        const encoded = encodeBody({ method, body: rawBody, headers, encoding });

        const requestInit = {
            method,
            headers: encoded.headers,
        };

        if (encoded.body !== undefined) requestInit.body = encoded.body;

        const credentialsMode = lib.str.to(lib.hash.get(envelope, "credentials.mode"), true).trim();
        const withCredentials = lib.bool.yes(lib.hash.get(envelope, "credentials.withCredentials"));
        if (!lib.utils.isEmpty(credentialsMode)) requestInit.credentials = credentialsMode;
        else if (withCredentials) requestInit.credentials = "include";

        const timeoutMs = lib.number.toInt(lib.hash.get(envelope, "timeoutMs"), 0);
        let timer = null;
        if (timeoutMs > 0 && typeof AbortController !== "undefined") {
            const controller = new AbortController();
            requestInit.signal = controller.signal;
            timer = setTimeout(() => controller.abort(), timeoutMs);
        }

        const fetchFn = getFetchFn();
        let payload;
        try {
            const response = await fetchFn(url, requestInit);
            payload = await normalizeResponse(response);
        } catch (err) {
            payload = {
                ok: false,
                status: 0,
                statusText: err?.message || "Network Error",
                url,
                headers: {},
                body: null,
                error: err,
            };
        } finally {
            if (timer) clearTimeout(timer);
        }

        const out = resolveResponseOutput(payload, lib.hash.get(envelope, "response"));
        return out;
    }

    return { send };
}

export default make;
