//lib.func
export function install(lib){
    function wrapper(fun){
	fun = lib.utils.getFunction(fun);
	if(!fun)return undefined;
	args = lib.args.slice(arguments,1);
	return  function (){
	    let fullArgs = lib.args.slice(arguments).concat( args);
	    fun(...fullArgs);
	}
    }

    /* in progress. check pre/postWrap for now
       chain("foo"|foo, ...args);
       chain("foo bar"|[foo,bar], ...args);
       chain({f:funs, e:err,t:test,a:args      });
       chain("istring lower, match", "$rv");
    */


    /*
      preWrap(funs, args); postWrap(funs, args);
      wraps a list of functions with predefined vars, returns a wrapper
      to be called with additional arguments, (usually an event Handler)
      ex: req.onclick = preWrap("writeComment updateValue", {})(this);
      addEventListener('click',preWrap("writeComment updateValue",{}););

      note: eventually after figuring out an intuitive parameter format,
      all will be merged into 'chain'
    */

    
    function postWrap(funs){
	let args,wrap;
	args = lib.args.slice(arguments,1);
	funs = lib.array.to(funs,/\s+/);
	wrap = function(){
	    let rv = undefined,name=undefined;
	    for (fun of funs){
		//name=(typeof(fun) == 'string')?fun:"anon fucc"
		let fullArgs = lib.args.slice(arguments).concat( args);
		fun = lib.utils.getFunction(fun);
		if(!fun)return undefined;

		rv = fun(...fullArgs);
	    }
	    //console.log('PW returning',rv,name);
	    return rv;
	}
	return wrap;
    }
    
    function preWrap(funs){
	let args,wrap;
	args = lib.args.slice(arguments,1);
	funs = lib.array.to(funs,/\s+/);
	wrap = function(){
	    let  rv=undefined;
	    for (fun of funs){
		//let fullArgs = lib.args.slice(arguments).concat( args);
		let fullArgs = args.concat( lib.args.slice(arguments));
		fun = lib.utils.getFunction(fun);
		if(!fun)return undefined;

		rv = fun(...fullArgs);
	    }
	    return rv;
	}
	return wrap;
    }


    //clean this up to provide better info
    function name(){
	let stack = new Error().stack,
	    caller = stack.split('\n')[2].trim();
	return caller;
	
    }

    
    var disp = {
	name : name,
	wrapper : wrapper,
	postWrap: postWrap,
	preWrap: preWrap,
	get : lib.utils.getFunction
    };
    return disp;
}

export default install;
