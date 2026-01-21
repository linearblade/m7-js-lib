//lib.js
export function install(lib){
    function toLib(text,opts){
	let rv;
	rv = exec(text, opts);
	lib.hash.set(lib,module, rv);

    };

    //makes a dispatch table to collect exports.
    function _makeDispatch(exp,dname='getDispatch'){
	let t = [],text="";
	text = "function "+dname+"(){return {";
	exp =exp?lib.utils.toArray(exp, " " ):[];
	for (let i=0; i < exp.length;i++){
	    t.push( exp[i] +' : '+exp[i]);
	};
	t.push ('__PACKAGE__ :(typeof __PACKAGE__ !== "undefined")? __PACKAGE__:undefined');
	//console.log(t);
	text =  text + t.join(',\n') + '};}';
	//console.log(text);
	return text;
    }

    /*
      parms : parameters of closure
      args : arguments to pass to closure
    */
    function _makeClosure(text, parms=undefined, args=undefined,opts){
	let prepend, postpend,rv;
	opts = lib.args.parse(arguments,{ 'text':"", parms:"",args:""}, "text parms args"); 
        prepend = "(function("+lib.utils.toString(opts.parms,1)+"){";
	postpend = '})('+lib.utils.toString(opts.args,1)+')';
	rv = [prepend , lib.utils.toString(opts.text,1) , postpend].join("\n");
	return rv;
	
    }
    function _makeDispatchCall(name='getDispatch'){
	return "return "+name+"();";
    }

    /*
      text : the code to build the closure around.
      dfunc : insert exporter function, requires export and dname
      dname: exporter function name, requires dname
      dcall : call exporter function
      export : list of exports, space delimited, or array of
      parms : parameters to pass to closure
      args : call the closure with these arguments

      {
      func: 1 | "foo" : if its 1, will use the default name. if its a non empty string, use that. if 0 or undefined, will not prepend exporter function.
      call : 1 :calls exporter function | 0: does not call an exporter function.
      name : name of exporter function.
      
      }
    */
    function dispatchClosure(text, opts){
	let dFunc, dCall,code,exports;
	opts = lib.args.parse(arguments,{ 'text':undefined, dfunc:1, dcall:1, dname:'getDispatch', "export":"",parms:"lib",args:"lib"}, "text export parms args");
	exports = lib.utils.isEmpty(opts['export'])?[]:lib.utils.toArray(opts['export']);
	dFunc = ('dfunc' in opts  )? _makeDispatch(exports,opts['dname']) :""; //&& exports.length
	dCall = ('dcall' in opts)? _makeDispatchCall(opts['dname']):"";
	//code = [dFunc, text,dCall].join("\n");
	if(exports.length){
	    //console.log('FOUND EXPORT',exports);
	}
	//code = [text,dFunc,dCall].join("\n");
	code = [dFunc,text,dCall].join("\n");
	//console.log(dFunc);
	return _makeClosure(code,opts['parms'],opts['args'] );
	
    }

    /*
      1. build a closure or not.
      2. determine eval mode.
      3. eval it.
      4. return the result.

      closure = 1|0
      verbose = 1|0
      dispatchOpts = ...
      eval = "direct|indirect"
      exec(text, "indirect", {export:" "})
      exec(text, modules);
    */
    //$exec
    function exec(text,opts){
	let ev, errorHeader;
	opts = lib.args.parse(arguments,{ 'text':undefined, verbose:1,eval:'direct'}, "text eval verbose");
	//console.log('eval is '+opts.eval + ' '+opts.exec);
	if (opts.exec){
	    code = opts.text;
	}else{
	    code = dispatchClosure(opts.text,opts);
	}
	errorHeader = `ERROR:\nfile: ${opts.src}\n`;
        try {
	    ev = (lib.utils.toString(opts.eval,{lc:1, force:1}) == 'indirect')?(0,eval)(code):eval(code);
        } catch (e) {
	    console.error(errorHeader,e);
	    eval('try { ' + code + ' } catch(err) { console.error("!!!>>"+err); }');
	    if (e instanceof SyntaxError) { //  && opts.verbose
                //console.log(e.message,e.stack);
	    }else {
		//console.log('there was an unspecified error loading this file ',e);
	    }
        }
	return ev;

    }

    /* 
       front end with presets for loading a lib.
       execLib(text, "exports go here");
    */
    function execLib(text, exports, opts){
	opts = lib.args.parse(arguments,{ 'text':undefined, verbose:1,eval:'indirect'}, "text export");
	opts = lib.utils.merge(opts, {exec:0});
	//console.log(`OPTS :`,opts);
	return exec(opts.text, opts);
    }

    var disp = {
        lib: toLib,
        exec: exec,
	execLib: execLib,
	_dispatch:_makeDispatch,
	_closure: _makeClosure,
	dispatchClosure:dispatchClosure,
	
        default: exec
    };
    return disp;

}
export default install;
