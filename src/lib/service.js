// lib/service.js
/**
 * Lightweight in-memory service registry.
 *
 * Purpose:
 * - Register named services
 * - Retrieve/list registered services
 * - Optionally call conventional `start`/`stop` methods
 */
/**
 * Build the `lib.service` namespace.
 *
 * @param {Object} lib
 * @returns {{
 *   services: Object,
 *   set: Function,
 *   get: Function,
 *   start: Function,
 *   stop: Function,
 *   list: Function
 * }}
 */
export function make(lib) {
    const services = {};

    /**
     * Register a service by name.
     *
     * @param {string} name
     * @param {*} svc
     * @returns {*}
     */
    function set(name, svc) { services[name] = svc; return svc; }

    /**
     * Retrieve a service by name.
     *
     * @param {string} name
     * @returns {*}
     */
    function get(name) { return services[name]; }

    /**
     * List registered service names.
     *
     * @returns {Array<string>}
     */
    function list() {
	return Object.keys(services);
    }

    /**
     * Start a named service when it exposes `start()`.
     *
     * Semantics:
     * - If `service.start` exists and is callable, returns `service.start(...args)`.
     * - Otherwise returns the service value as-is.
     *
     * @param {string} name
     * @param {...*} args
     * @returns {*}
     */
    function start(name, ...args) {
	const s = services[name];
	if (s && typeof s.start === "function") return s.start(...args);
	return s;
    }

    /**
     * Stop a named service when it exposes `stop()`.
     *
     * Semantics:
     * - If `service.stop` exists and is callable, returns `service.stop(...args)`.
     * - Otherwise returns the service value as-is.
     *
     * @param {string} name
     * @param {...*} args
     * @returns {*}
     */
    function stop(name, ...args) {
	const s = services[name];
	if (s && typeof s.stop === "function") return s.stop(...args);
	return s;
    }

    /**
     * Public dispatch surface for `lib.service`.
     *
     * @type {{
     *   services: Object,
     *   set: Function,
     *   get: Function,
     *   start: Function,
     *   stop: Function,
     *   list: Function
     * }}
     */
    return { services, set, get, start, stop,list };
}
export default make;
