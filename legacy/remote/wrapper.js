//lib.hash.set(lib, "remote.wrapper", (function(lib){
export function install(lib){
    let disp;
    let assets;

    function storeJson(opts){
	let [src,dst,doEval,load,action] = lib.hash.expand(opts, "src dst eval load action");
	return function (req,opts){
	    let id = opts['id'] || dst;
	    //console.log(`storing as json (${dst})`);
	    //obj.assets[id]=(id && req && ('responseText' in req))?lib.json.decode(req.responseText): undefined;
	    if(opts.debug)console.log(opts);
	    if (id && req && ('responseText' in req)){
		let rText = opts['strip']?lib.utils.stripComments(req.responseText,opts):req.responseText;
		lib.hash.set(window,id, lib.json.decode( rText,  {errText:opts['url'],errSpan:20}) );
	    }
	    lib.utils.getFunction(load,1)(req,opts);
	}
	
    }

    function storeText(opts){
	let [src,dst,doEval,load,action] = lib.hash.expand(opts, "src dst eval load action");
	return function (req,opts){
	    let id = opts['id'] || dst;
	    console.log(`storing as text  (${dst}) ,`,id,'<<');
	    //obj.assets[id]=(id && req && ('responseText' in req))?req.responseText: undefined;
	    if (id && req && ('responseText' in req))lib.hash.set(window,id,req.responseText);
	    lib.utils.getFunction(load,1)(req,opts);
	}

    }

    function attachText(opts){
	let [src,dst,doEval,load,action] = lib.hash.expand(opts, "src dst eval load action");
	return function (req,opts){
	    let id = opts['id'] || dst;
	    console.log(`storing as text  (${dst}) ,`,id,'<<');
	    //obj.assets[id]=(id && req && ('responseText' in req))?req.responseText: undefined;
	    if (id && req && ('responseText' in req)){
		//lib.hash.set(obj.assets,id,req.responseText);
		let e;
		if (e= lib.dom.byId(id)){
		    let result = ""
		    if (opts.attachtype){
			e.innerHTML = (opts.attachtype+"").match(/pre/i)?(req.responseText+e.innerHTML):(e.innerHTML+req.responseText);
		    }else {
			e.innerHTML=req.responseText;
		    }
		}
		
	    }
	    lib.utils.getFunction(load,1)(req,opts);
	}

    }
    function storeRequest(opts){
	let [src,dst,doEval,load,action,id] = lib.hash.expand(opts, "src dst eval load action dst");
	return function (req,opts){
	    //console.log(`storing as request  (${dst})`);
	    //obj.assets[dst]=(dst && req)?req:undefined;
	    if (dst && req)lib.hash.set(window,dst,req);
	    lib.utils.getFunction(load,1)(req,opts);
	}
	
    }

    
    //default handler, passes the request to its load handler
    function def(opts){
	let [src,dst,doEval,load,action,id] = lib.hash.expand(opts, "src dst eval load action dst");
	return function(req,id){
	    lib.utils.getFunction(load,1)(req,id);
	}
    }
    function exec(opts){
	let [src,dst,doEval,load,action] = lib.hash.expand(opts, "src dst eval load action");
	return function (req,opts){
	    let ev,text;
	    text  = req.responseText;
	    if (opts['debug'] ==1)console.log(`inside setlibExec: ${action}`, opts);
	    ev = lib.js.exec(text, {exec:1, eval:doEval?doEval:'indirect'});
	    //console.log(ev);
	    lib.utils.getFunction(load,1)(req,opts);
	    
	}
	
    }
    //simple setup. doesnt look for package.
    function setLibSimple(opts){
	let [src,dst,doEval,load,action] = lib.hash.expand(opts, "src dst eval load action");
	return function (req,opts){
	    let ev,text;
	    text  = req.responseText;
	    if (opts['debug'] ==1)console.log(`inside setlibExec: ${action}`, opts);
	    //ev = lib.js.exec(text, {exec:1, eval:doEval?doEval:'indirect'});
	    ev = lib.js.exec(text, { eval:doEval?doEval:'indirect'});
	    //console.log(ev);
	    lib.hash.set(lib,dst, ev);
	    lib.utils.getFunction(load,1)(req,opts);
	    
	}
	
    }
    //checks allows you to ignore the dst, if you have a package set, alternately writes it as the src (probably a bad idea),
    //additionally you can set the merge behavior of the lib. you will want to do this if you are enhancing a built in library with additional functions.
    function setLib(opts){
	let [src,dst,doEval,load,action] = lib.hash.expand(opts, "src dst eval load action");
	//console.warn(opts);
	return function (req,opts){
	    let ev,text,target;
	    text  = req.responseText;
	    //console.log('inside setlib: ' +action, opts);

	    ev = lib.js.execLib(text, opts);
	    if (opts['debug']){
		console.log(ev, lib.hash.get(ev,'__PACKAGE__'));
		console.log(text);
	    }
	    //if(action == 'lib')lib.hash.set(lib,dst?dst:lib.hash.get(ev,'__PACKAGE__')?ev.__PACKAGE__:src, ev);

	    if(action.match(/lib|plugin/i)){

		target = dst?dst:lib.hash.get(ev,'__PACKAGE__')?ev.__PACKAGE__:src;
		//console.log(`dst =${dst}, package=${ev.__PACKAGE__}, src=${src}`);
		let c = lib.hash.get(lib,target);
		let d = {
		    "l": (l,r) =>{return lib.utils.merge(l,r);},
		    "r": (l,r) =>{return lib.utils.merge(r,l);},
		    "o": (l,r) =>{return r;},
		};
		let behavior = (opts['merge'] &&  opts['merge'] in d)?opts['merge']:'l';		
		if (opts['debug'])console.log(`setting ${target} with behavior ${behavior}`, d[behavior](lib.utils.isHash(c)?c:{},ev));

		if(action.match(/plugin/i ))target='plugin.'+target;
		lib.hash.set(lib,target, d[behavior](lib.utils.isHash(c)?c:{}, ev));
		//we arent using the framework, so setting up plugins is meaningless.
		//lib.app.bootstrap.plugin.registerLib(obj,target,opts);


	    }
	    lib.utils.getFunction(load,1)(req,opts,target); // used to be outside if


	}
    }


    disp = {
	lib:setLib,
	//plugin:setLib,
	//exec:setLibExec,
	exec:exec,
	json:storeJson,
	text:storeText,
	req:storeRequest,
	request:storeRequest,
	attach:attachText,
	def:def
    };
    return disp;

}


export default install;
