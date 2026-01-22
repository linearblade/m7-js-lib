export function install(lib) {
    lib.request = function (url, load, error, opts){
	let wrapper,id, store;
	opts = lib.args.parse(arguments,{url:undefined,load:undefined, error:undefined,method:'GET', body:undefined}, "url load error");

	wrapper = function(func, opts){
	    return function(req){
		lib.utils.getFunction(func,1)(req,opts);
	    };
	};
	load = wrapper(opts.load,opts);
	error = wrapper(opts.error,opts);
	lib._http.get(url, {load:load,error:error,method:opts.method,body:opts.body});
    };
};
export default install;

