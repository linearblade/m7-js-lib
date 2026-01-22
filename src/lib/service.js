// lib/service.js
export function make(lib) {
    const services = {};

    function set(name, svc) { services[name] = svc; return svc; }
    function get(name) { return services[name]; }
    function list() {
	return Object.keys(services);
    }
    // optional conventions (not required)
    function start(name, ...args) {
	const s = services[name];
	if (s && typeof s.start === "function") return s.start(...args);
	return s;
    }

    function stop(name, ...args) {
	const s = services[name];
	if (s && typeof s.stop === "function") return s.stop(...args);
	return s;
    }

    return { services, set, get, start, stop,list };
}
export default make;
