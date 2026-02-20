import make_http_request from "./http.js";

/**
 * Request dispatch namespace.
 *
 * Canonical entrypoint:
 * - lib.request.send(envelope, opts?)
 *
 * Initial transport coverage:
 * - http
 */
export function make(lib) {
    const transport = {
        http: make_http_request(lib),
    };

    function normalizeEncoding(v) {
        const ct = String(v || "").trim().toLowerCase();
        if (!ct) return undefined;
        if (ct === "json") return "application/json";
        if (ct === "urlencoded" || ct === "form") return "application/x-www-form-urlencoded";
        if (ct === "formdata" || ct === "multipart") return "multipart/form-data";
        return v;
    }

    function makeEnvelope(opts = {}) {
        opts = lib.hash.to(opts);

        const envelope = {
            transport: lib.str.to(lib.hash.get(opts, "transport"), true).trim().toLowerCase() || "http",
            op: lib.str.to(lib.hash.get(opts, "op"), true).trim().toLowerCase() || "send",
            endpoint: { url: lib.hash.get(opts, "url") },
            method: lib.str.to(lib.hash.get(opts, "method"), true).trim().toUpperCase() || "GET",
            headers: lib.hash.to(lib.hash.get(opts, "headers")),
            encoding: normalizeEncoding(lib.hash.get(opts, "contentType")),
            response: {
                parse: lib.str.to(lib.hash.get(opts, "responseParse"), true).trim().toLowerCase() || "auto",
                return: "payload"
            }
        };

        const body = lib.hash.get(opts, "body");
        if (body !== undefined && body !== null && envelope.method !== "GET") {
            envelope.body = body;
        }

        const credentials = lib.hash.get(opts, "credentials");
        if (credentials !== undefined) envelope.credentials = credentials;

        const timeoutMs = lib.hash.get(opts, "timeoutMs");
        if (timeoutMs !== undefined) envelope.timeoutMs = timeoutMs;

        return envelope;
    }

    function resolveTransportName(envelope) {
        const raw = lib.str.to(lib.hash.get(envelope, "transport"), true).trim().toLowerCase();
        return raw || "http";
    }

    async function send(envelope = {}, opts = {}) {
        envelope = lib.hash.to(envelope);
        opts = lib.hash.to(opts);

        const transportName = resolveTransportName(envelope);
        const tx = transport[transportName];

        if (!tx || typeof tx.send !== "function") {
            throw new Error(`[lib.request.send] Unsupported transport '${transportName}'`);
        }

        return tx.send(envelope, opts);
    }

    return {
        send,
        makeEnvelope,
        transport,
    };
}

export default make;
