export function install(lib){
    //takes a list and a list of names, and returns them as a hash.
    //the last arg is the hash,
    //parseArgs(args, {req: " ", opt:" ",arg: 1|0,pop:1|0}
    function parse(args, def, opts){
	let out = {}, defOpts = {pop:1, arg:0};
	opts = lib.utils.merge(defOpts, lib.utils.toHash(opts,'parms'));
	def = lib.utils.toHash(def);
	args = lib.utils.toArray(slice(args)); //convert potential 'Arguments' to array
	parms = lib.utils.toArray(opts['parms'], /\s+/);
	req = lib.utils.toArray(opts['req'], /\s+/);	
	//console.log('>>',parms,req,opts['req'],'<<');
	out = (opts.pop && lib.utils.baseType(args[args.length-1],'object') && !lib.dom.isDom(args[args.length-1]))?args.pop():{};
	out = lib.utils.merge(def,out);
	for (let i =0; i < parms.length; i++){
	    let key = parms[i], value;
	    if (i > args.length-1)break;
	    value = args[i];
	    lib.hash.set(out, key, value);
	}
	for (let i =0; i < req.length; i++){
	    let key = req[i];
	    if (!(key in out))return undefined;
	}
	return out;
	
    }
    //performs array slice on arguments object
    function slice(args,a,b=undefined){
	return Array.prototype.slice.call(args).slice(a,b);
    }

    function isArguments( item ) {
	return Object.prototype.toString.call( item ) === '[object Arguments]';
    }
    
    var disp = {
	'slice' : slice,
	'parse' : parse,
	'isArguments' : isArguments
	
    };
    return disp;
}
export default install;
