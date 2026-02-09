

# --- begin: legacy/app/bootstrap/append.js ---


//$SECTION -LIB.APP.BOOTSTRAP.APPEND
export function make(lib) {

    let mScript= function (item,opts={}){
	var url = lib.utils.linkType(item.url,'relative')?(item.base?item.base:"")+item.url:item.url;
        return lib.dom.create.js(url, item['attrs']);
    };
    let mCss= function (item,opts={}){
	var url = lib.utils.linkType(item.url,'relative')?(item.base?item.base:"")+item.url:item.url;
        return lib.dom.create.css(url, item['attrs']);
    };
    let def = function(item,opts={}){
	//console.log('in default',item);
        return lib.dom.create.element(item.tag, item['attrs'],item.content);
    }
    var disp = {
        script : mScript,
        js : mScript,
        css :  mCss,
	link :  mCss,
        'default': def
    };
    return disp;
}
export default make;


# --- end: legacy/app/bootstrap/append.js ---



# --- begin: legacy/event.js ---

//lib.event
export function install(lib) {
    function setEventListeners(events){
	events = lib.utils.toArray(events);
	console.log('setting event listeners');
	if (!lib.utils.isArray(events)) return undefined ;
	for (i in events){
	    if (lib.utils.isArray(events[i])) events[i] = lib.args.parse(events[i], {},"target event handler options" );
	    console.log(events[i]);
	    let e ;
	    if (!lib.utils.isHash(events[i]))continue;
	    e= lib.dom.getElement(events[i].target) || lib.dom.getElement(events[i].id);
	    if (e){
		console.log('adding event for '+(events[i].id || events[i].target)+ ': ' +events[i].handler);
		//console.log(getFunction(events[i].handler));
		e.addEventListener(events[i].event, lib.utils.getFunction(events[i].handler), events[i].options);
	    }
	}
    }
    
    function radioSet(list=[],event,on,off,options,ws){
	let events = [],eList = [];
	list = lib.utils.toArray(list);
	on = lib.utils.getFunction(on);
	console.log(`checking if on defined (${on})`);
	if (!on) return 0;
	off = lib.utils.getFunction(off);

	
	for (let i = 0, item=list[i]; i <list.length;item=list[++i]){
	    console.log(`i=${i} , item=${item}, event=${event}, on=${on}, off=${off}`);
	    let eventItem = undefined; //event,handler,options
	    let target,selector,wrapper;
	    if (lib.dom.isDom(item)){
		target = lib.dom.getElement(item);
	    }else if(lib.utils.isArray(item)){
		target = lib.dom.getElement(item[0]);
		selector = item[1];
	    }else if(lib.utils.isHash(item)){
		target = lib.dom.getElement(lib.hash.get(item,"t"));
		selector = lib.hash.get(item,"s");
	    }else if (lib.utils.baseType(item, 'string')){
		console.log(`item is a string ${item} ${i}`);
		target = lib.dom.getElement(item);
		selector = item;
	    }
	    //console.log(`trying ${selector}`);
	    if (!target) continue;
	    eList.push({target:target,selector:selector});
	    //console.log(`setting ${selector}`);
	    wrapper = function(eList, target, selector,ws){
		return function (e){
		    let pp = {
			selector : selector,
			target :target,
			ws : ws,
			current : {target:target, selector:selector}
		    };

		    on(e,pp);
		    if(!off) return;
		    for (i in eList){
			let le = eList[i];
			pp['current'] = le;
			if (e.target == le.target){
			    //console.log(`on ${pp.selector} ${e.target.id} == ${le}`);
			    //on(e,pp);
			}else {
			    //console.log(`off ${pp.selector} ${e.target.id} != ${le}`);
			    
			    off(e,pp);
			}
		    }
		}
	    };
	    eventItem = {
		target: target,
		event : event,
		handler : wrapper(eList, target,selector, ws),
		options : options
	    };
	    events.push(eventItem);
	}
	console.log(events);
	if (events.length)setEventListeners(events);

    }
    
    

    function getDispatch(){
	return {
	    set: setEventListeners,
	    radioSet: radioSet
	    
	};
    }
    return getDispatch();
};
export default install;


# --- end: legacy/event.js ---



# --- begin: legacy/js.js ---

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


# --- end: legacy/js.js ---



# --- begin: legacy/json.js ---


//lib.json = (function(lib){

export function install(lib){

    //decodes text into obj.
    function decode(text, opts){
	let rec;
	opts = lib.args.parse(arguments,{verbose:1, text:undefined,errSpan:10,err:0}, "text"); 
	try {
	    rec = JSON.parse(opts.text);
        } catch (e) {
	    if ( (opts.verbose || opts.err) && e instanceof SyntaxError) {
		let rem = e.message.substr(e.message.toLowerCase().indexOf("position ") );
		let patt = /position (\d+)/i;
		//e.message.substr(e.message.toLowerCase().indexOf("position ") ).
		let errMsg = `error parsing json ${opts['errText']?['(',opts['errText'],')'].join(''):''}\n`;
                console.error(errMsg, [e.message,rem,text]);
		let pos = 0;
		if (match =  patt.exec( e.message)){
		    if (match.length > 1)
			pos = match[1];
		}
		if (!lib.utils.isEmpty(pos)){
		    //console.log(`textlengh=${text.length}, pos=${pos}`);
		    console.err(text.substr(pos-opts.errSpan>0?pos-opts.errSpan:0, opts.errSpan*2)); //pos+10<text.length?pos+10:undefined
		}
		if(opts.err)
		    throw Error("json decoding error.");
		//text.substr(
	    }
	    rec = undefined;
        }
	return rec;
    }

    //encodes a json string from an object.
    function encode(obj, opts){
	let text;
	opts = lib.args.parse(lib.args.slice(arguments,1),{verbose:1, obj:undefined}, ""); 
	try {
	    text = JSON.stringify(obj);
        } catch (e) {
	    if (opts.verbose && e instanceof SyntaxError) {
                console.log("error encoding json\n", e.message);
	    }
	    text = undefined;
        }
	return text;
    }
    
    var disp = {
	stringify: encode,
	encode: encode,
	decode: decode,
	parse: decode,

    };
    return disp;
    

}
export default install;


# --- end: legacy/json.js ---



# --- begin: legacy/remote/wrapper.js ---

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


# --- end: legacy/remote/wrapper.js ---



# --- begin: legacy/repo.js ---

export function install (lib) {
    let disp, currentRepo, repos= {};
    repos['main'] = new URL(document.currentScript.src).origin;
    let defaults = {
        load: function (r,opts){console.log('loaded: '+lib.hash.get(r, "responseURL")+(lib.utils.isEmpty(arguments[2])?'':`\ntarget: ${arguments[2]}`) )},
        error: function (r,opts){
            try {
                console.error(`error loading :`+lib.hash.get(r,"responseURL")+`\nstatus: `+
                              lib.hash.get(r,"status") + " " +lib.hash.get(r,'statusText'),arguments);
            }catch(err){
                console.error(err);
                console.error('error loading:',arguments);
            }

        }
    };
    /*
      let currentScript = document.currentScript;
      console.log(currentScript.src);
      const url = new URL(currentScript.src);
      console.log(url);
      // Get the domain (hostname) of the URL
      const domain = url.hostname;
    */

    function applyRequest(src, action,exports, opts){
        let load,error,url,base,param;
        action = lib.utils.toString(arguments[1],{lc:1, force:1}); //check to see if short hand was used...
        action = lib.utils.toString(action,{lc:1, force:1});

        param = `src action ${action.match(/lib|plugin/i)?"export":""} dst load error`;
        //console.log(`param = ${param}`);
        opts = lib.args.parse(arguments,{'src':0,'type':'export'},param);
        //console.log('applying request...',opts);
        action = lib.utils.toString(opts.action,{lc:1, force:1});

        if (opts['nowrap'] == true){ //this is for loadPackage, it needs to wrap over this.
	    load = opts['load'];
        }else {
	    load=wrapLoad(opts);
        }

        error = opts.error || defaults['error'];
	base = opts['base']?opts['base']:repos['main'];
        url = lib.utils.linkType(opts.src,['relative','absolute'])?
	    base+opts.src:
	    opts.src;
	if(lib.bool.isTrue(opts.debug)){
	    console.log(`request(${action}) ${url} `+ (opts['dst']?`as ${opts['dst']}`:""));
	    console.log([load,error,opts]);
	}
	lib.request(url, load, error,opts); //opts.desc
        return ;
    }

    
    function setRepo(name, url=undefined){
	if (lib.utils.isEmpty(url) ){
	    [name,repo] = ['main', name];
	    
	}
	repos[name] = url;
	
    }
    function getRepo(name=undefined){
	if (lib.utils.isEmpty(name))
	    return repos;
	return repos[name];
    }
    function pullLib(src,dst,opts){
	opts = lib.hash.to(opts,"exec");
	let base = repos['main'];
	let url = base + src;

	
	let loader = function(r,info){
	    console.log("pulled "+info.url);
	    if (!dst) opts.exec=true;
	    let resp = lib.js.exec(r.responseText,opts);
	    lib.hash.set(lib,'ws.response', {r:r, payload: info,opts});
	    if(dst)
		lib.hash.set(lib, dst,resp);
	};
	let error = function(r,info){
	    console.error(["file not found", info.url]);
	}
	lib.request(url, loader, error)
    }

    function pullSingle(src , dst, action, opts){
	let itmHandler,request;
	request = lib.args.parse(arguments, {overwrite:1,nowrap:false},"src dst action load error  options" );

	if(!request.src)
	    return console.error('no source specified');
	
	//request.desc = request.src;
        action = lib.utils.toString(request['action'],{force:1, lc:1});
        itmHandler = wrapLoad(request); //$FIX -- used to be this.wrapLoad
	if(!request['overwrite'] && request['dst']){
	    if( action.match(/lib/) && lib.hash.get(lib, request.dst)){
                return console.error(`already LOADED LIB ${request['dst']} - `,opts);
	    }else if ( lib.hash.get(window, [request.dst])){
		return console.error(`ALREADY STORED ${request.src} to ${request.dst}`);
	    }
	}

	applyRequest(request);
	
    }
    //see PKG_EXAMPLE.js for format.

    function loadRemotePackage(pkg, pkgList=undefined,opts){
	if(lib.utils.baseType(pkg,'string'))
	    pkg = {'package':pkg};
	//lib.request = function (url, load, error, opts)
	pkgList = lib.utils.toArray(lib.utils.deepCopy(pkgList));
	let load = function (r){
	    let resp = r.responseText;
	    let dec =lib.json.decode(resp,{verbose:1});
	    if(!dec){
		console.error("error decoding json");
		return;
	    }
	    if(lib.utils.isArray(dec)){
		for (i in dec){
		    if(pkg['load'])dec[i]['load'] = pkg['load'];
		    if(pkg['error'])dec[i]['error'] = pkg['error'];
		}
		pkgList = pkgList.concat(dec);
	    }else{
		if(pkg['load'])dec['load'] = pkg['load'];
		if(pkg['error'])dec['error'] = pkg['error'];
		
		pkgList = pkgList.unshift(dec);
	    }
	    if(pkg['_load']){
		let list=lib.utils.toArray(pkg['_load']);
		for (let i=0; i < list.length;i++)
		    lib.utils.getFunction(list[i],1)(pkg,r);
	    }else {
		console.log(`package loaded ${pkg['package']}`);
	    }
	    loadPackage(pkgList, opts);
	    return;
	}
	let error = function(r){
	    if (pkg['_error'] ) {
		let list=lib.utils.toArray(pkg['_error']);
		for (let i=0; i < list.length;i++)
		    lib.utils.getFunction(list[i],1)(pkg,r);
		return;
	    }else {
		console.error([
		    'something went wrong while loading the package remotely',
		    pkg['package'],
		    pkg,
		    r
		]);
	    }
	}
	lib.request(pkg['package'], load, error, opts);

    }
    function loadPackage(pkgList,opts){
	//console.log('loading package...');
	pkgList = lib.utils.toArray(lib.utils.deepCopy(pkgList));
	opts = lib.utils.toHash(opts, {def:{overwrite:0}});
	let pkg, loadList,requests,tags=[],tagOpts={}, prepend, pkgHandler,runWrapper,runSequence =0,runEvents,eRun=0;
	pkg = pkgList.shift(0);
	//console.log('OPTS IS', opts);
	runEvents = function(pp){
	    let events = lib.hash.get(pp, "pkg.event");
	    events = lib.utils.baseType(events, ['string','array'])?lib.utils.toArray(events):undefined;
	    if(!events)return 0;
	    lib.event.set(events);
	    return 1;
	}

	runWrapper = function(pp,list,pkgs,opts){ //aka pkgHandler()
	    return function(){
		//console.log('in run wrapper',arguments,'-----',pp);
		
		for (let i=0; i < list.length;i++){
		    //console.log(`list i=${i} (${list[i]}`);
		    let fname = lib.utils.baseType(list[i],'string')?list[i]:
			(lib.utils.baseType(list[i],'function') && list[i].name)?list[i].name:'anonymous function';
		    
		    //console.log(`>>running[load] ${fname}`);
		    if (lib.utils.baseType(list[i],'string') && list[i].toLowerCase() == 'runevents'){
			runEvents(pp);
			eRun = 1;
		    }else
			lib.utils.getFunction(list[i],1)(pp);
		}
		if(!eRun)runEvents(pp);
		
		if(pkgs.length)loadPackage(pkgs,opts);
	    }
	}

	/*beging current items : split off the items we are working on right now.*/
	//pkgBase = lib.hash.get(pkg,"base") || this.base;
	loadList=lib.utils.toArray(pkg['load']);

	if(pkg['package']) {
	    console.log('loading remote package');
	    return loadRemotePackage(pkg,pkgList);
	}
	
	//console.log('>>loadlist:',loadList);
	requests = lib.utils.toArray(lib.hash.get(pkg, 'request.items')); //used to be cLib
	//console.log('>>requests', requests);
	/*
	//$FIX -- disable tags for now.
	tags = lib.utils.toArray(lib.hash.get(pkg, 'tag.items')); //used to be append
	tagOpts = lib.utils.toHash(lib.hash.get(pkg, 'tag.opts'));
	*/
	//console.log('load list:'+loadList.length);
	/*end current items*/
	prepend = {
	    //bs:this, // $FIX -- removed this. no longer in framework.
	    lib:lib,
	    pkg:pkg
	};
	//loadlist = current functions to run, pkgList = remaining packages.
	pkgHandler = runWrapper(prepend,loadList,pkgList,opts); //runlist

	if (!requests.length && !tags.length){
	    pkgHandler();
	    return 1;
	}
	console.log(pkg, requests);
	{
	    let controller = new lib.sync.controller(pkgHandler, prepend);
	    
	    let missed = 0;
	    if(requests.length){
		for (let i=0; i < requests.length;i++){
		    //console.log("trying" , requests[i]);
		    let itmHandler, dst, action;
		    action = lib.utils.toString(requests[i]['action'],{force:1, lc:1});
		    requests[i]['nowrap'] =true;
		    itmHandler = wrapLoad(requests[i]); //$FIX -- used to be this.wrapLoad
		    if(!requests[i]['overwrite'] && !opts['overwrite'] &&  action.match(/lib/) && requests[i].dst && lib.hash.get(lib, requests[i]['dst'])){
			console.warn(`already LOADED LIB ${requests[i]['src']} - `,opts);
			missed++;
			continue;
			
		    }else if (!opts['overwrite'] && requests[i]['dst'] && lib.hash.get(window, [requests[i]['dst']])){
			console.warn('ALREADY STORED '+requests[i]['src']);
			missed++;
			continue;
		    }


		    lib.hash.set(requests[i], 'load', controller.wrapper('request'+i,itmHandler ));
		    //console.log('passing to applyrequest', requests[i]);
		    applyRequest(lib.utils.merge({base:pkg['base']},requests[i]));
		}

	    }


	    /*
	    //$fix -- re enable later
	    //disable tags for now
	    //console.log('onto tags...',tags.length);
	    if(tags.length){
	    for (let i=0; i < tags.length;i++){
	    let itmHandler = lib.hash.get(tags[i],'load');
	    //console.log('checking '+tags[i]['track']);
	    if(!opts['overwrite'] && tags[i]['track'] && this.dom.lookup(tags[i]['track'])){
	    console.log('ALREADY ATTACHED ',tags[i]);
	    missed++;
	    continue;
	    }
	    lib.hash.set(tags[i], 'load', tags[i]['rload']==0?itmHandler:controller.wrapper('tag'+i,itmHandler ));
	    this.createElement(lib.utils.merge({base:pkg['base']},tags[i]));
	    }

	    }
	    */
	    if (missed >= tags.length+requests.length)pkgHandler();;

	}
	
	
	return 1;
    }
    function wrapLoad(opts){
	let load;
	//opts['load']= lib.hash.get(opts,'load') || this.defaults['load'];
	if (!('load' in opts))opts['load'] = defaults['load'];
	//console.log('itm handler1', opts['load']);
	//console.log('wrapping',opts);
	//$fix -- used to be 
	//let action = (opts['action'] in lib.app.bootstrap.remote.wrapper)?opts['action']:'def';
	let action = (opts['action'] in lib.remote.wrapper)?opts['action']:'def';
	load = lib.remote.wrapper[(opts['action'] in lib.remote.wrapper)?opts['action']:'def'](opts);
	//console.log(`it handler2 ${opts['action']} - ${action}`, load);
	return load;
	
    }

    

    

    
    disp = {
	pullSingle: pullSingle,
	pull: pullLib,
	set: setRepo,
	get: getRepo,
	loadPackage:loadPackage,
	loadRemotePackage:loadRemotePackage
    };
    return disp;
    
};

export default install;


# --- end: legacy/repo.js ---



# --- begin: legacy/request.js ---

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



# --- end: legacy/request.js ---



# --- begin: legacy/sync.js ---

//$lib.sync.controller
export function install(lib) {
    class syncLoader {
	constructor(opts = {}) {

	    opts = lib.args.parse(arguments,{ 'load':undefined}, "load prepend require"); //lib.args.slice(arguments,1)
	    this.controller = {check:{}, run:{},lock:undefined};
	    this.onLoad = lib.utils.getFunction(opts.load);
	    this.prepend = opts.prepend;

	    this.require(opts.require);

	}

	require(id){
	    id = lib.utils.toArray(id, /\s+/);
	    for (let i in id){
		this.controller.check[id[i]] = 1;
	    }
	    return 1;
	}
	set(id) {
	    //console.log('>>setting '+id,this.controller);
	    if (!(id in this.controller.check))return 0;
	    this.controller.run[id]= 1;
	    if (this.loaded()){
		if (!lib.utils.isEmpty(this.controller.lock)) {
		    //console.log('locked by' + id);
		    return 0;
		} //fix later with promise
                this.controller.lock=id;
		//console.log('>>MADE HERE');
		lib.utils.getFunction(this.onLoad,1)(this.prepend, id, ...lib.args.slice(arguments,1));
		return 1;
	    }
	    return 0;
	}
	
	loaded (id=undefined){
	    if (id){
		if (!(id in this.controller.check))return 0;
		return  (this.controller.run[id] == 1)?1:0;
	    }
	    for (k in this.controller.check){
                if (this.controller.run[k] !=1){
		    //console.log('returning from id:'+k+' / '+this.controller.run[k]);
		    return 0;
                }
	    }
	    return 1;
	    
	}

	//require an id, and run it when its triggered.
	wrapper(id,itemHandler) {
	    this.require(id);
	    let obj = this;
	    return function(){
		//console.log('firing wrapper with ',arguments);
		lib.utils.getFunction(itemHandler,1)(...arguments);
		obj.set(id);
	    }
	}
	
	
    }

    var disp = {
	controller : syncLoader
    };
    return disp;
}
export default install;


# --- end: legacy/sync.js ---



# --- begin: src/index.js ---

// index.js
import make_boot from "./lib/_boot.js";

import make_bool from "./lib/bool.js";
import make_array from "./lib/array.js";
import make_hash from "./lib/hash.js";
import make_number from "./lib/number.js";

import make_utils from "./lib/utils.js";
import make_str from "./lib/str.js";
import make_func from "./lib/func.js";

import make_dom from "./lib/dom/index.js";
import make_args from "./lib/args.js";

import make_http from "./lib/_http.js";
import make_service from "./lib/service.js";
import make_require from './lib/require.js';
const lib = {};
export default lib;
export { lib };

// ─────────────────────────────────────────
// boot / startup utilities (no deps)
// ─────────────────────────────────────────

// attach boot logic (functions live here)
lib._boot = make_boot(lib);

// run boot once at startup (populates lib._env)
lib._boot.install();

// ─────────────────────────────────────────
// Core / primitive utilities (minimal deps)
// ─────────────────────────────────────────

lib.bool   = make_bool(lib);
lib.array  = make_array(lib);
lib.hash   = make_hash(lib);
lib.number = make_number(lib);
lib.str    = make_str(lib);
lib.func   = make_func(lib);

// ─────────────────────────────────────────
// Utility layers (depend on primitives)
// ─────────────────────────────────────────

// utils currently contains core normalizers (baseType/isEmpty/etc) + aliases
lib.utils = make_utils(lib);



// ─────────────────────────────────────────
// DOM layer (depends on utils/func/hash/array)
// ─────────────────────────────────────────

lib.dom = make_dom(lib);
//lib.hash.set(lib,'dom.create', make_dom_create(lib) );
//lib.hash.set(lib,'dom.append', make_dom_append(lib) );

// ─────────────────────────────────────────
// facilities and services  (depends on hash/array/dom/utils)
// ─────────────────────────────────────────
lib.service = make_service(lib);
lib.require = make_require(lib);

// ─────────────────────────────────────────
// Args helper (depends on hash/array/dom/utils)
// ─────────────────────────────────────────

lib.args = make_args(lib);

// ─────────────────────────────────────────
// Transport / IO (depends on _env + hash/array/func)
// ─────────────────────────────────────────

lib._http = make_http(lib);


# --- end: src/index.js ---



# --- begin: src/lib/_boot.js ---

// lib/_env.js
export function make(lib) {
    function resolveRoot(explicit) {
        if (explicit) return explicit;
        if (typeof globalThis !== "undefined") return globalThis;
        if (typeof window !== "undefined") return window;
        if (typeof global !== "undefined") return global;
        return undefined;
    }

    function install(opts = {}) {
        // NOTE: no lib.utils dependency here if you want zero deps:
        opts = (opts && typeof opts === "object") ? opts : { root: opts };

        const root = resolveRoot(opts.root);
        const isBrowser = !!(root && root.document && root.location);

        lib._env = {
            root,
            isBrowser,
            isNode: !!(root && root.process && root.process.versions && root.process.versions.node),
            // cache location if present (so callers never touch `window`)
            location: isBrowser ? root.location : undefined
        };

        return lib._env;
    }

    return { install, resolveRoot };
}
export default make;



# --- end: src/lib/_boot.js ---



# --- begin: src/lib/_http.js ---

/**
 * Internal bootstrap HTTP transport.
 * Used ONLY during early runtime before higher-level request APIs exist.
 * Not intended for direct application use.

 * this is beginning of time bootstrapper. its probably not needed but you never know.
 */

//lib._http = (function(lib){
export function make(lib) {
    function get (url, opts) {
        opts = lib.hash.to(opts);
        if (opts.debug) console.log('opts', opts);

        const XHR = lib._env?.root?.XMLHttpRequest;
        if (!XHR) throw new Error("XHR unavailable");

        const req = new XHR();
        const method = lib.hash.get(opts, 'method', "GET");

        // open (always async)
        req.open(method, url, true);

        // 4/16/24 -- added with credentials.
        if (opts.credentials === true) req.withCredentials = true;

        req.onreadystatechange = function () {
            if (req.readyState === XHR.DONE) {
                if (req.status >= 400) lib.func.get(opts.error, 1)(req);
                else lib.func.get(opts.load, 1)(req);
            }
        };

        req.send(lib.hash.get(opts, 'body'));
        return req;
    };
    
    function _request(url, opts) {
	opts = lib.hash.to(opts);

	const XHR = lib._env?.root?.XMLHttpRequest;
	if (!XHR) throw new Error("XHR unavailable");

	const req = new XHR();

	const method  = lib.hash.get(opts, 'method', "GET");
	const headers = lib.array.to(opts.header);

	// open (always async)
	req.open(method, url, true);

	// 4/16/24 -- added with credentials.
	if (opts.credentials === true) req.withCredentials = true;

	if (opts.urlencoded) {
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	}

	for (const h of headers) {
            if (lib.hash.is(h)) {
		req.setRequestHeader(h.name, h.value);
            }
	}

	req.request = {
            url,
            body: lib.hash.get(opts, 'body')
	};

	req.onreadystatechange = function () {
            if (req.readyState === XHR.DONE) {
		if (opts.json === 1) {
                    try {
			req.jsonData = JSON.parse(String(req.responseText));
                    } catch (e) {
			req.jsonData = undefined;
                    }
		}

		if (req.status >= 400) lib.func.get(opts.error, 1)(req);
		else lib.func.get(opts.load, 1)(req);
            }
	};

	if (opts.debug) console.log('sending', opts, req);

	req.send(lib.hash.get(opts, 'body'));
	return req;
    }
    function post(url,opts){
	opts = lib.hash.to(opts);
	opts.method='POST';
	return _request(url,opts);
    }
    
    return  {
	get: get,
	post: post,
	request: _request
	
    };
}

export default make;


# --- end: src/lib/_http.js ---



# --- begin: src/lib/args.js ---

//lib/args.js
/**
 * Argument parsing helpers.
 *
 * This module provides lightweight utilities for:
 * - Slicing `arguments` objects
 * - Detecting `Arguments`
 * - Mapping positional arguments into a hash using a simple schema
 *
 * NOTE:
 * - This is legacy-adjacent code.
 * - Behavior is permissive and loosely validated.
 * - Intended for internal convenience, not strict argument validation.
 */

export function make(lib){
    /**
     * Parse a positional argument list into a hash.
     *
     * High-level behavior:
     * - Converts an `arguments` object or array-like input into a real array
     * - Optionally pops a trailing object and treats it as an options hash
     * - Assigns positional arguments to named keys
     * - Merges defaults and overrides
     * - Optionally enforces required keys
     *
     * Semantics (LOCKED / legacy-safe):
     * - If `opts.pop` is truthy and the last argument is a plain object
     *   (but NOT a DOM element), it is removed from the args list and used
     *   as the initial output object.
     * - `def` provides default values and is merged first.
     * - Positional arguments are mapped in order to `opts.parms`.
     * - Required keys listed in `opts.req` must exist in the final output
     *   or the function returns `undefined`.
     *
     * Options:
     * - parms {string|Array<string>}:
     *     Space-delimited string or array of parameter names that positional
     *     arguments will be assigned to.
     *
     * - req {string|Array<string>}:
     *     Space-delimited string or array of required keys.
     *
     * - pop {number|boolean} (default: 1):
     *     If truthy, pop a trailing object from args and treat it as overrides.
     *
     * - arg {number|boolean} (legacy, currently unused):
     *     Present for backward compatibility; no effect in current implementation.
     *
     * Notes:
     * - No type checking is performed on argument values.
     * - DOM elements are explicitly excluded from being treated as option hashes.
     * - Uses lib.hash.set for deep assignment of positional values.
     *
     * @param {Arguments|Array} args
     *     The arguments object or array-like input to parse.
     *
     * @param {Object} [def]
     *     Default values for the output hash.
     *
     * @param {Object} [opts]
     *     Parsing options (see above).
     *
     * @returns {Object|undefined}
     *     Parsed argument hash, or undefined if required keys are missing.
     */

    //parseArgs(args, {req: " ", opt:" ",arg: 1|0,pop:1|0}
    function parse(args, def, opts){
	let out = {}, defOpts = {pop:1, arg:0};
	opts = lib.hash.merge(defOpts, lib.hash.to(opts,'parms'));
	def = lib.hash.to(def);
	args = lib.array.to(slice(args)); //convert potential 'Arguments' to array
	const parms = lib.array.to(opts['parms'], /\s+/);
	const req = lib.array.to(opts['req'], /\s+/);	
	//console.log('>>',parms,req,opts['req'],'<<');
	out = (opts.pop && lib.utils.baseType(args[args.length-1],'object') && !lib.dom.isDom(args[args.length-1]))?args.pop():{};
	out = lib.hash.merge(def,out);
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

    /**
     * Slice an arguments-like object into a real array.
     *
     * Behavior:
     * - Converts `arguments` or array-like objects into a true Array
     * - Applies Array.prototype.slice semantics
     *
     * This exists primarily to normalize `arguments` objects.
     *
     * @param {Arguments|Array} args
     *     Arguments object or array-like input.
     *
     * @param {number} [a]
     *     Start index.
     *
     * @param {number} [b]
     *     End index (exclusive).
     *
     * @returns {Array}
     */
    
    function slice(args,a,b=undefined){
	return Array.prototype.slice.call(args).slice(a,b);
    }

    /**
     * Determine whether a value is an `Arguments` object.
     *
     * Uses Object.prototype.toString for detection.
     *
     * Notes:
     * - This is reliable across realms but slower than simple heuristics.
     * - Primarily used for defensive checks in legacy code.
     *
     * @param {*} item
     * @returns {boolean}
     */
    function isArguments( item ) {
	return Object.prototype.toString.call( item ) === '[object Arguments]';
    }
    
    return  {	slice,parse,isArguments    };
}
export default make;


# --- end: src/lib/args.js ---



# --- begin: src/lib/array.js ---

/**
 * lib.array
 * ----------
 * Small array helpers that wrap common lib.utils conversions.
 *
 * Export style:
 *   make(lib) -> { append, subtract, is, to }
 */
export function make(lib) {


    /**
     * Check whether a value is an Array.
     *
     * @param {*} arg
     * @returns {boolean}
     */
    function is(arg) {
	return (typeof arg === 'object') && Array.isArray(arg);
    }
    //legacy. leave it.
    function toArrayold (list){
	if (!list)return [];
	return (is(list))?list:[list] ;
    }
    
    function to_old(list, split) {
        if (!list) return [];
        if (is(list)) return list;
        // If a split token is provided and list is a string, split it (RegExp supported)
        if (!lib.utils.isEmpty(split) && typeof list === 'string') {
            return list.split(split);
        }

        return [list];
    }
    
    

    /**
     * Coerce any input into an array.
     *
     * Design:
     * - This is a TOTAL function: it never throws and always returns an Array.
     * - Coercion and normalization are preferred over validation or rejection.
     *
     * Contract (locked):
     * - ALWAYS returns an Array.
     * - Falsy values (null, undefined, false, 0, "") → [].
     * - Arrays are returned as-is unless trimming is explicitly enabled.
     * - If `opts.split` is provided and the input is a string, the string is split
     *   using the given string or RegExp.
     * - Otherwise, non-array input is wrapped into a single-element array.
     * - Optional trimming via `opts.trim` applies to string values only.
     *
     * Trimming semantics:
     * - When `opts.trim` is true:
     *   - Leading/trailing whitespace is removed from string values.
     *   - Empty strings ("") resulting from trimming or splitting are removed.
     * - Non-string elements are preserved as-is.
     *
     * Notes:
     * - This function performs no type enforcement beyond coercion.
     * - Returned arrays may be modified in-place by trimming.
     * - Intended for defensive normalization of configuration and user input.
     *
     * @param {*} list
     *     Value to coerce into an array.
     *
     * @param {Object} [opts]
     *     Optional coercion options.
     *
     * @param {string|RegExp} [opts.split]
     *     Token or RegExp used to split string input.
     *
     * @param {boolean} [opts.trim]
     *     If true, trim whitespace from string values and remove empty strings.
     *
     * @returns {Array}
     *     Normalized array representation of the input.
     */


    

    function to(list, opts) {
	opts = lib.hash.to(opts, "split");

	const split  = opts.split ? opts.split :  null;
	const doTrim = opts.trim  ? opts.trim  :  false;


	if (!list) return [];
	if (is(list)) return doTrim?arrayTrim(list):list;

	
	let out;

	//its not an array here, so just return.
	if (!lib.str.is(list))
	    return [list];
	
        if (doTrim) list = list.trim();
        out = split ? list.split(split) : [list];
	//now its definately an array.
	return doTrim?arrayTrim(out) : out;
    }


    /**
 * Normalize a value into an array and trim whitespace from string elements.
 *
 * Contract:
 * - ALWAYS returns a new Array.
 * - Non-array input is wrapped into a single-element array.
 * - String elements are `.trim()`med.
 * - Empty strings ("") are removed after trimming.
 * - Non-string elements are preserved as-is.
 *
 * Notes:
 * - The original input value is never mutated.
 * - If an array is provided, its reference is not preserved.
 * - This is a coercive normalization helper, not a validator.
 *
 * @param {*} input
 *     Value to normalize and trim.
 *
 * @returns {Array}
 *     A new array with trimmed string elements and empty strings removed.
 */

    function arrayTrim(input) {
    const src = is(input) ? input : [input];
    const out = [];

    for (const v of src) {
        if (lib.str.is(v)) {
            const t = v.trim();
            if (t) out.push(t);
        } else {
            out.push(v);
        }
    }

    return out;
}
    

    /**
     * Return a copy of `list` with all values in `exclude` removed.
     *
     * Inputs may be arrays or whitespace-delimited strings (via to()).
     * Removal is by strict equality using Array#indexOf (string/number matching).
     *
     * @param {Array|string} list
     * @param {Array|string} exclude
     * @returns {Array}
     */
    function arraySubtract(list, exclude) {
        let out = to(list, /\s+/);
        out = out.slice(); // non-destructive
        const exList = to(exclude, /\s+/);

        for (const ex of exList) {
            let index;
            while ((index = out.indexOf(ex)) !== -1) {
                out.splice(index, 1);
            }
        }
        return out;
    }

    /**
     * Wrap each item in `input` with a prefix and postfix.
     *
     * Accepts array, string, or number. Strings are split on whitespace.
     * Returns undefined for unsupported input types.
     *
     * @param {Array|string|number} input
     * @param {string} [pre=""]
     * @param {string} [post=""]
     * @returns {Array|undefined}
     */
    function arrayAppend(input, pre = "", post = "") {
        if (!lib.utils.baseType(input, ["array", "string", "number"])) return undefined;

        const list = to(input, /\s+/);
        const output = [];

        for (let i = 0; i < list.length; i++) {
            output[i] = pre + list[i] + post;
        }
        return output;
    }

    /**
     * Return array length, or 0 if not an array.
     *
     * @param {*} val
     * @returns {number}
     */
    function len(val){
	if(!lib.array.is(val) ) return 0;
	return val.length;
    }

    /**
     * Normalize an input into an array of non-empty strings.
     *
     * This helper is intentionally strict and predictable.
     * It is used to sanitize loosely-typed inputs such as selectors,
     * pipeline names, stack lists, and other config-driven string arrays.
     *
     * Behavior:
     * - Accepts a scalar or array input
     * - Strings are trimmed; empty strings are discarded
     * - Finite numbers may be converted to strings (enabled by default)
     * - Booleans may be converted to strings (disabled by default)
     * - All other types are ignored (objects, arrays, functions, null, etc.)
     *
     * @param {*} val
     *        Input value to normalize (string, number, boolean, array, or mixed).
     *
     * @param {Object} [opts]
     * @param {RegExp} [opts.splitter]
     *        Optional splitter used when normalizing string input.
     *
     * @param {boolean} [opts.numbers=true]
     *        Whether finite numbers should be converted to strings.
     *
     * @param {boolean} [opts.booleans=false]
     *        Whether booleans should be converted to strings.
     *
     * @returns {string[]}
     *          Array of sanitized, non-empty strings.
     */
    function filterStrings(val, opts = {}) {
	opts = lib.hash.to(opts, 'splitter');
	const allowNumbers = (opts.numbers !== false);
	const allowBooleans = !!opts.booleans;
	const splitter = opts.splitter;

	const list = lib.array.to(val, splitter);

	const out = [];

	for (let i = 0; i < list.length; i++) {
            const v = list[i];

            if (typeof v === "string") {
		const s = v.trim();
		if (s) out.push(s);
		continue;
            }

            if (allowNumbers && typeof v === "number" && Number.isFinite(v)) {
		out.push(String(v));
		continue;
            }

            if (allowBooleans && typeof v === "boolean") {
		out.push(String(v));
		continue;
            }

            // everything else is intentionally dropped:
            // objects, arrays, functions, null, undefined, symbols
	}

	return out;
    }    
    return {
        append: arrayAppend,
        subtract: arraySubtract,
	trim : arrayTrim,
	is,
	to,
	len,
	filterStrings
    };
}

export default make;


# --- end: src/lib/array.js ---



# --- begin: src/lib/bool.js ---

export function make(lib){
    /**
     * Detect affirmative intent.
     *
     * Returns true if the value explicitly encodes affirmative intent.
     * This is NOT truthiness.
     *
     * Accepted values:
     *   - true
     *   - 1
     *   - "1"
     *   - "true"
     *   - "yes"
     * (case-insensitive for strings)
     */
    function intentTrue(val) {
        const t = typeof val;
        if (t === 'undefined' || val === null) return false;
        if (t === 'number') return val === 1;
        if (t === 'boolean') return val === true;
        if (t === 'string') return /^(1|true|yes)$/i.test(val);
        return false;
    }

    /**
     * Detect negative intent.
     *
     * Returns true if the value explicitly encodes negative intent.
     * This is NOT truthiness.
     *
     * Accepted values:
     *   - false
     *   - 0
     *   - "0"
     *   - "false"
     *   - "no"
     * (case-insensitive for strings)
     */
    function intentFalse(val) {
        const t = typeof val;
        if (t === 'undefined' || val === null) return false;
        if (t === 'number') return val === 0;
        if (t === 'boolean') return val === false;
        if (t === 'string') return /^(0|false|no)$/i.test(val);
        return false;
    }

    // ──────────────────────────────────────────────────────────────

    /**
     * Is the value a real boolean (true or false)?
     */
    function is(val) {
        return typeof val === 'boolean';
    }

    /**
     * Does the value explicitly encode boolean intent?
     *
     * True if the value is:
     *   - a boolean, OR
     *   - an affirmative literal, OR
     *   - a negative literal
     */
    function isIntent(val) {
        return is(val) || intentTrue(val) || intentFalse(val);
    }

    /**
     * Strict boolean conversion.
     *
     * Returns true only if the value === true.
     * All other values return false.
     */
    function to(val) {
        return is(val) ? val : false;
    }

    /**
     * Intent-based boolean conversion.
     *
     * Returns true only if the value explicitly encodes affirmative intent.
     * All other values (including negative intent) return false.
     */
    function byIntent(val) {
        return intentTrue(val);
    }

    // ──────────────────────────────────────────────────────────────

    return {
        // Intent detectors
        intentTrue,
        intentFalse,

        // Type checks
        is,
        isIntent,

        // Conversions
        to,
        byIntent,

        // Aliases (shorthand / legacy-friendly)
	hasIntent : isIntent,
        ish       : isIntent,
        yes       : intentTrue,
        no        : intentFalse,

    };
}

export default make;


# --- end: src/lib/bool.js ---



# --- begin: src/lib/dom/append.js ---

//$SECTION -LIB.DOM.APPEND
export function make(lib) {
    /**
     * Resolve a target-ish input into a DOM Element.
     * Accepts:
     * - DOM Element
     * - selector string / id string (best-effort)
     */
    function resolveTarget(target) {
        if (!target) return null;

        // already a DOM node/element?
        if (lib.dom && typeof lib.dom.isDom === "function" && lib.dom.isDom(target)) {
            return target;
        }
        if (typeof Element !== "undefined" && target instanceof Element) {
            return target;
        }

        // string lookup
        if (typeof target === "string") {
            if (lib.dom && typeof lib.dom.getElement === "function") {
                return lib.dom.getElement(target);
            }
            // fallback: try id first, then selector
            const byId = document.getElementById(target);
            if (byId) return byId;
            try {
                return document.querySelector(target);
            } catch (e) {
                return null;
            }
        }

        return null;
    }

    /**
     * Resolve an element-ish input into a DOM Element.
     * (Same semantics as resolveTarget; named separately for readability.)
     */
    function resolveElement(e) {
        return resolveTarget(e);
    }

    function before(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target || !target.parentNode) return null;
        target.parentNode.insertBefore(e, target);
        return e;
    }

    function after(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target || !target.parentNode) return null;

        // Prefer library helper if present (keeps legacy semantics if any)
        if (lib.dom && typeof lib.dom.insertAfter === "function") {
            lib.dom.insertAfter(e, target);
            return e;
        }

        // Native fallback
        if (target.nextSibling) target.parentNode.insertBefore(e, target.nextSibling);
        else target.parentNode.appendChild(e);
        return e;
    }

    function prepend(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target) return null;

        if (target.firstChild) target.insertBefore(e, target.firstChild);
        else target.appendChild(e);

        return e;
    }

    function append(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target) return null;
        target.appendChild(e);
        return e;
    }

    /**
     * Insert using DOM-standard positions (mirrors insertAdjacentElement).
     * pos: "beforebegin" | "afterbegin" | "beforeend" | "afterend"
     */
    function adjacent(e, target, pos) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target) return null;

        const p = String(pos || "").toLowerCase();
        if (typeof target.insertAdjacentElement === "function") {
            try {
                target.insertAdjacentElement(p, e);
                return e;
            } catch (err) {
                // fall through to manual mapping
            }
        }

        // Manual mapping (works everywhere)
        if (p === "beforebegin") return before(e, target);
        if (p === "afterend") return after(e, target);
        if (p === "afterbegin") return prepend(e, target);
        // default to beforeend
        return append(e, target);
    }

    /**
     * Replace target with element.
     */
    function replace(e, target) {
        e = resolveElement(e);
        target = resolveTarget(target);
        if (!e || !target || !target.parentNode) return null;
        target.parentNode.replaceChild(e, target);
        return e;
    }

    /**
     * Remove target from DOM.
     */
    function remove(target) {
        target = resolveTarget(target);
        if (!target || !target.parentNode) return null;
        target.parentNode.removeChild(target);
        return target;
    }

    /**
     * Empty a target (remove all children).
     */
    function empty(target) {
        target = resolveTarget(target);
        if (!target) return null;
        while (target.firstChild) target.removeChild(target.firstChild);
        return target;
    }

    /**
     * Convenience aliases for common positions.
     */
    const disp = {
        // original API (fixed)
        before: before,
        after: after,
        prepend: prepend,
        append: append,

        // missing but very handy “targeting” functions
        beforeBegin: function (e, target) { return adjacent(e, target, "beforebegin"); },
        afterBegin: function (e, target) { return adjacent(e, target, "afterbegin"); },
        beforeEnd: function (e, target) { return adjacent(e, target, "beforeend"); },
        afterEnd: function (e, target) { return adjacent(e, target, "afterend"); },

        adjacent: adjacent,
        replace: replace,
        remove: remove,
        empty: empty,

        // exposed in case other modules want the same coercion
        resolveTarget: resolveTarget
    };

    return disp;
}

export default make;


# --- end: src/lib/dom/append.js ---



# --- begin: src/lib/dom/create.js ---

//$SECTION -LIB.DOM.CREATE

export function make(lib) {
    // module-private (don’t use `this` for caching; keep ES module semantics clean)
    const special = {};

    function ensureSpecial() {
        if (special._init) return;

        const eventHandler = function (e, key, value) {
            const fun = lib.func.get(value);
            if (fun) e.addEventListener(key, fun, true);
        };

        // event-ish attributes that should become listeners
        special.load = eventHandler;
        special.error = eventHandler;
        special.click = eventHandler;

        special._init = true;
    }

    function js(url, attrs) {
        if (!lib.hash.is(attrs)) attrs = {};
        attrs = lib.hash.merge(
            {
                async: true,
                type: "text/javascript",
                src: url
            },
            attrs
        );
        return element("script", attrs);
    }

    function css(url, attrs) {
        if (!lib.hash.is(attrs)) attrs = {};
        attrs = lib.hash.merge(
            {
                rel: "stylesheet",
                type: "text/css",
                href: url
            },
            attrs
        );
        return element("link", attrs);
    }

    function element(tag, attrs, content) {
        ensureSpecial();

        const e = document.createElement(tag);

        if (!lib.hash.is(attrs)) attrs = {};

        for (const key of Object.keys(attrs)) {
            const k = lib.utils.lc(key, true); // force lowercase
            if (special[k]) {
                special[k](e, key, attrs[key]);
            } else {
                e.setAttribute(key, attrs[key]);
            }
        }

        // Optional: set content if provided (legacy-friendly, but harmless)
        if (typeof content !== "undefined" && content !== null) {
            // If you ever want html vs text, add an option later; keep minimal now.
            e.textContent = String(content);
        }

        return e;
    }

    return {
        css: css,
        link: css,
        js: js,
        element: element
    };
}

export default make;



# --- end: src/lib/dom/create.js ---



# --- begin: src/lib/dom/index.js ---

//$SECTION -LIB.DOM
import make_dom_create from './create.js';
import make_dom_append from './append.js';

export function make(lib) {


    /**
     * Check whether a value is a DOM Element.
     *
     * @param {*} o
     * @returns {boolean}
     */
    function isDom(o) {
        return (
            typeof Element !== "undefined" &&
		o instanceof Element
        );
    }

    /**
     * Resolve an element reference.
     *
     * Semantics:
     * - If `id` is already a DOM Element, return it.
     * - Otherwise treat `id` as an element id string.
     *
     * @param {string|Element} id
     * @returns {Element|null}
     */
    function getElement(id) {
        if (isDom(id)) return id;
        return document.getElementById(id);
    }

    /**
     * Alias for document.getElementById.
     *
     * @param {string} id
     * @returns {Element|null}
     */
    function byId(id) {
        return document.getElementById(id);
    }

    /**
     * Remove an element from the DOM.
     *
     * Semantics:
     * - Accepts an Element or an element id.
     * - If element does not exist, returns undefined.
     * - Returns the removed element on success.
     *
     * @param {string|Element} e
     * @returns {Element|undefined}
     */
    function removeElement(e) {
        const el = getElement(e);
        if (!el || !el.parentNode) return undefined;
        el.parentNode.removeChild(el);
        return el;
    }


    /**
     * Parse the current query string into a plain object.
     *
     * LEGACY-ADJACENT (modernized):
     * - This used to write to a global `urlParams` object and return nothing.
     * - This version returns an object and does NOT mutate globals.
     *
     * Environment:
     * - Browser-only (requires `lib._env.location`)
     * - Reads from `lib._env.location.search`
     *
     * Parsing rules / limitations:
     * - Simple regex parsing (not URLSearchParams)
     * - "+" is decoded as space (legacy form behavior)
     * - Repeated keys: last one wins (overwrites)
     * - No special handling for arrays, nested keys, or type coercion
     *
     * Throws:
     * - Error if called outside a browser environment (no `lib._env.location`)
     *
     * @returns {Object} Map of query keys to decoded string values.
     */
    function qs() {
	if (!lib._env || !lib._env.location) {
            throw new Error("[lib.dom.qs] Browser-only: lib._env.location is not available");
	}

	let match;
	const pl = /\+/g;
	const search = /([^&=]+)=?([^&]*)/g;
	const decode = (s) => decodeURIComponent(String(s).replace(pl, " "));
	const query = String(lib._env.location.search || "").replace(/^\?/, "");

	const params = {};
	while ((match = search.exec(query))) {
            params[decode(match[1])] = decode(match[2]);
	}
	return params;
    }

    /**
     * Legacy shim for query parsing.
     *
     * Behavior:
     * - Calls `qs()` to parse query params
     * - Writes results to `lib._env.root.urlParams`
     * - Returns the same object
     *
     * Notes:
     * - Prefer `qs()` in all modern code.
     * - This exists only for backward compatibility with code that expects
     *   a global-ish `urlParams`.
     *
     * @returns {Object} Same object returned by `qs()`.
     */
    function qsLegacy() {
	const params = qs();
	if (lib._env && lib._env.root) {
            lib._env.root.urlParams = params;
	}
	return params;
    }



    /**
     * Insert a DOM node immediately after another node.
     *
     * @param {Node} newNode
     * @param {Node} existingNode
     */
    function insertAfter(newNode, existingNode) {
	if (!existingNode || !existingNode.parentNode) return;
	existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
    }



    //todo allow total data set upload later
    function set(e,attr,val){

	attr = lib.utils.toString(attr, { force: 1 });
	if (!lib.dom.isDom(e) || !attr) return undefined;

	let m;

	if ((m = attr.match(/^(set|add|remove|toggle)Class$/i))) {
	    const lc = m[1].toLowerCase();

	    val = lib.utils.toString(val, { force: 1 });
	    if (!val) return undefined;

	    const map = {
		set: () => { e.className = val; },
		add: () => { e.classList.add(val); },
		remove: () => { e.classList.remove(val); },
		toggle: () => e.classList.toggle(val),
	    };

	    return map[lc]();
	}

	const attrParts = lib.array.to(attr, '.'); // attr is already normalized to string earlier

	if (attrParts.length && String(attrParts[0]).toLowerCase() === 'dataset') {
	    if (attrParts.length < 2) return undefined;

	    const path = attrParts.slice(1); // remove "dataset"
	    lib.hash.set(e.dataset, path, val);
	    return lib.hash.get(e.dataset, path);
	}
	
	
	if (m= attr.match(/^(tagName|value|name|text|innerText|textContent|innerHTML|type|href|src|disabled|selected|checked)$/i)){

	    let map= {
		"tagname" : "tagName",
		"value" : "value",
		"name" : "name",
		"text" : "textContent",
		"textcontent" : "textContent",
		"innertext" : "innerText",
		"innerhtml" : "innerHTML",
		"type" : "type",
		"href" : "href",
		"src" : "src",
		"disabled":"disabled",
		"selected":"selected",
		"checked" : "checked"
	    };
	    let lc = m[1].toLowerCase();
	    return  e[(lc in map)?map[lc]:m[1]] = val; 
        }


	if (lib.array.to(attr, '.').length > 1) {
	    lib.hash.legacySet(e, attr, val); //generally works on dom.
	} else {
	    e.setAttribute(attr, val); //otherwise use the standard method!
	}

	//handle either way!
	return get(e, attr);   
	
	//return e.getAttribute(attr,val);
	

    }
    
    //work in progress. collect all the carvout properties , and make it insenstive , fixing for later.

    /**
     * Get a value from a DOM element with a few legacy carve-outs.
     *
     * Behavior (LOCKED):
     * - If `e` is not a DOM Element: returns undefined.
     * - If `attr` is falsy: returns `e`.
     * - If attr starts with "dataset":
     *     - "dataset"        -> returns e.dataset
     *     - "dataset.foo.bar"-> returns lib.hash.get(e.dataset, "foo.bar")
     * - If attr matches a supported direct property name:
     *     tagName, value, name, text, textContent, innerHTML, type
     *   -> returns e[prop]
     * - Otherwise returns e.getAttribute(attr)
     *
     * @param {Element} e
     * @param {string} [attr]
     * @returns {*}
     */
    function get(e, attr) {
	if (!lib.dom.isDom(e)) return undefined;
	if (!attr) return e;

	let m;

	// dataset / dataset.foo.bar
	m = String(attr).match(/^dataset(\.)?(.*)$/i);
	if (m) {
            if (m[1]) return lib.hash.get(e.dataset, m[2]);
            return e.dataset;
	}

	
	// style.display (explicit carve-out; NOT a general style path system)
	// - "style.display" -> e.style.display
	// - "style"         -> e.style (CSSStyleDeclaration)
	m = attr.match(/^style(\.)?(.*)$/i);
	if (m) {
            if (!m[1]) return e.style; // "style"
            if (String(m[2]).toLowerCase() === "display") return e.style.display;
            return undefined; // refuse other style.* to avoid pretending we support it
	}


	// direct property carve-outs
	m = String(attr).match(/^(tagName|value|name|text|textContent|innerHTML|type)$/i);
	if (m) {
            // preserve original behavior: return e[m[1]]
            // (note: when matched case-insensitively, m[1] is the matched token, not necessarily canonical casing)
            return e[m[1]];
	}

	return e.getAttribute(attr);
    }


    // Takes a nebulous target and attempts to squeeze a DOM node from it
    function attemptDom(input, barf = false) {
        // Check if input is empty or already a DOM element
        let node = lib.utils.isEmpty(input) ? null :                                // Handle empty input
            lib.dom.is(input) ? input :                                      // It's already a DOM element
            typeof input === 'object' && input.target ? input.target :       // Likely an event handler
            lib.dom.getElement(input) ?? document.querySelector(input);      // Try getting DOM or query selector

        // Optionally throw an error if not found
        if (!node && barf) {
            throw Error(`cannot derive a dom node from :`,input);
        }

        return node;
    }

    /**
     * Collect an element's attributes into a plain object, optionally filtering by regex.
     *
     * Behavior (LOCKED / legacy-safe):
     * - Reads attribute names via e.getAttributeNames()
     * - If `regex` is provided, only matching attributes are included.
     * - If opts.strip is truthy and regex matches:
     *     - output key becomes the substring AFTER the matched portion (m[0])
     *     - value is read via e.getAttribute(attrName)
     * - Otherwise:
     *     - output key is the full attribute name
     *     - value is read via lib.dom.get(e, attrName)
     *
     * @param {Element} e
     * @param {RegExp} [regex]
     * @param {Object|boolean} [opts]  (coerced via lib.hash.to(opts,"strip"))
     * @returns {Object}
     */
    function filterAttributes(e, regex, opts) {
	if (!lib.dom.isDom(e)) return {};

	opts = lib.hash.to(opts, "strip");

	const list = e.getAttributeNames();
	const out = {};

	for (const k of list) {
            if (regex) {
		const m = k.match(regex);
		if (!m) continue;

		if (opts.strip) {
                    const stripKey = k.substr(k.indexOf(m[0]) + m[0].length);
                    out[stripKey] = e.getAttribute(k);
                    continue;
		}
            }

            out[k] = lib.dom.get(e, k);
	}

	return out;
    }

    /**
     * INTENTIONALLY UNEXPORTED / INCOMPLETE -- not sure why it was never completed. but it staying in until I decide what to do with it.
     * Parse data-* attributes into a nested object.
     *
     * Semantics (LOCKED / legacy-safe):
     * - Reads attributes matching /^data-<prefix>/ (prefix optional).
     * - Strips the matched prefix from attribute names.
     * - Converts `config.delim` (default "-") into "." and inflates via lib.hash.set.
     * - Values are attribute strings.
     *
     * Config:
     * - prefix : optional prefix after "data-" (e.g. "foo" matches data-foo-*)
     * - delim  : delimiter inside the remaining key (default "-")
     *
     * @param {Element} e
     * @param {Object|string} [config]
     * @returns {Object|undefined}
     */
    function parseDataSet(e, config) {
	if (!lib.dom.is(e)) return undefined;

	config = Object.assign(
            { out: 'cc', delim: '-', prefix: '' },
            parseStringSimple(config) || {}
	);

	let prefix = lib.utils.toString(config.prefix || "", 1).trim();
	if (!lib.utils.isEmpty(prefix) && prefix.substr(-1, 1) !== '-') {
            prefix += '-';
	}

	// filterAttributes expects opts; passing 1 becomes {strip:1} via lib.hash.to()
	const rec = filterAttributes(e, new RegExp("^data-" + prefix), 1);

	const out = {};

	for (const key in rec) {
            // ES6-safe delimiter replacement (avoid replaceAll)
            const tKey = config.delim ? String(key).split(config.delim).join(".") : key;
            lib.hash.set(out, tKey, rec[key]);
	}

	return out;
    }
    
    return {
	get: get,
	set: set,
	is: isDom,
	isDom: isDom,
	getElement: getElement,
	byId: byId,
	removeElement: removeElement,
	qs:qs,
	insertAfter:insertAfter,
	filterAttributes,
	create: make_dom_create(lib),
	append: make_dom_append(lib),
	attempt : attemptDom
    };
}

export default make;


# --- end: src/lib/dom/index.js ---



# --- begin: src/lib/func.js ---

//lib.func

export function make(lib){
    const DUMMY_FN = function () {};

    /**
     * Resolve a function reference from various input forms.
     *
     * Accepted inputs:
     * - A function reference (returned as-is)
     * - A string name on the resolved root object (e.g. "myFunc")
     * - A dotted path string (e.g. "obj.method.submethod", "Math.max")
     *
     * Options:
     * - dummy {boolean|number}:
     *     If truthy, returns a no-op function instead of `undefined`
     *     when resolution fails.
     *
     * - bind {boolean}:
     *     If true, binds the resolved function to its immediate parent
     *     object in the path (e.g. "obj.method" binds to `obj`).
     *     Useful for APIs and methods that depend on `this`.
     *
     * - root {Object}:
     *     Explicit root object to resolve names against.
     *     Defaults to `lib._env.root` (resolved during boot).
     *
     * Limitations / Notes:
     * - This is NOT a parser or tokenizer.
     * - Binding is best-effort and may not work for all native APIs
     *   (some rely on internal slots).
     * - Arrow functions and already-bound functions ignore binding.
     * - This function performs lookup only — it never invokes the result.
     *
     * Examples:
     *   getFunction("Math.max")
     *   getFunction("util.format", { root: myLib })
     *   getFunction("handler", { root: someObj, bind: true })
     *
     * Legacy note:
     * - Previously accepted a positional `dummy` argument.
     *   This is still supported via opts coercion.
     *
     * @param {Function|string|undefined} f
     * @param {Object|boolean|number} [opts]
     * @returns {Function|undefined}
     */
    function getFunction(f, opts) {
	opts = lib.hash.to(opts, 'dummy');
	const root = opts.root || lib.hash.get(lib, '_env.root');

	if (!f || !root) return opts.dummy ? DUMMY_FN : undefined;
	if (typeof f === "function") return f;
	if (typeof f !== "string") return opts.dummy ? DUMMY_FN : undefined;

	let fn = lib.hash.get(root, f);
	if (typeof fn !== "function") return opts.dummy ? DUMMY_FN : undefined;

	if (opts.bind) {
	    let parent = root;
	    const parts = lib.array.to(f, '.');
	    if (parts.length > 1) parent = lib.hash.get(root, parts.slice(0, -1));
	    if (parent) { try { fn = fn.bind(parent); } catch (e) {} }
	}
	
	return fn;
    }

    
    /**
     * Create a wrapped function with trailing (post-applied) arguments.
     *
     * Behavior:
     * ---------
     * - Resolves `fun` via lib.utils.getFunction (string or function).
     * - Captures any arguments passed AFTER `fun` at wrap time.
     * - Returns a new function.
     * - When the returned function is called:
     *     1. Its runtime arguments are collected
     *     2. The captured arguments are appended to the end
     *     3. The resolved function is invoked with the combined arguments
     *
     * This is effectively a "post-apply" / partial-application helper.
     *
     * Example:
     * --------
     *   const fn = wrapper('doThing', 1, 2);
     *   fn('a', 'b');
     *   // calls doThing('a', 'b', 1, 2)
     *
     * Notes:
     * ------
     * - If `fun` cannot be resolved, returns undefined.
     * - Uses lib.args.slice to safely handle `arguments` objects.
     * - Semantics are preserved from legacy implementation.
     */
    function wrapper(fun) {
	const fn = lib.utils.getFunction(fun);
	if (!fn) return undefined;

	const tailArgs = lib.args.slice(arguments, 1);

	return function () {
	    const callArgs = lib.args.slice(arguments).concat(tailArgs);
	    return fn(...callArgs);
	};
    }
    /* in progress. check pre/postWrap for now
       chain("foo"|foo, ...args);
       chain("foo bar"|[foo,bar], ...args);
       chain({f:funs, e:err,t:test,a:args      });
       chain("istring lower, match", "$rv");
    */


    /**
     * NOTE:
     * -----
     * preWrap and postWrap are legacy-style higher-order helpers
     * retained for backward compatibility and simple handler composition.
     * Newer systems (delegator, ActiveTags) provide more expressive chaining.
     */

    /**
     * Wrap a sequence of functions and apply trailing (post-applied) args.
     *
     * Behavior:
     * ---------
     * - `funs` may be a whitespace-delimited string or an array-like list.
     * - Captures any args after `funs` at wrap time (tail args).
     * - Returns a function which, when called, will:
     *     1) build callArgs = runtimeArgs + tailArgs
     *     2) resolve each function via lib.utils.getFunction
     *     3) invoke each in order with callArgs
     *     4) return the last function's return value
     *
     * Early exit:
     * -----------
     * - If any function in the chain cannot be resolved, returns undefined.
     *
     * Example:
     * --------
     *   const fn = postWrap("a b", 1, 2);
     *   fn("x"); // calls: a("x",1,2) then b("x",1,2)
     */
    function postWrap(funs) {
	const tailArgs = lib.args.slice(arguments, 1);
	const list = lib.array.to(funs, /\s+/);

	return function () {
	    let rv;

	    const runtimeArgs = lib.args.slice(arguments);
	    const callArgs = runtimeArgs.concat(tailArgs);

	    for (let item of list) {
		const fn = lib.utils.getFunction(item);
		if (!fn) return undefined;
		rv = fn(...callArgs);
	    }

	    return rv;
	};
    }    

    /**
     * Wrap a sequence of functions and apply leading (pre-applied) args.
     *
     * Behavior:
     * ---------
     * - `funs` may be a whitespace-delimited string or an array-like list.
     * - Captures any args after `funs` at wrap time (head args).
     * - Returns a function which, when called, will:
     *     1) build callArgs = headArgs + runtimeArgs
     *     2) resolve each function via lib.utils.getFunction
     *     3) invoke each in order with callArgs
     *     4) return the last function's return value
     *
     * Early exit:
     * -----------
     * - If any function in the chain cannot be resolved, returns undefined.
     *
     * Example:
     * --------
     *   const fn = preWrap("a b", 1, 2);
     *   fn("x"); // calls: a(1,2,"x") then b(1,2,"x")
     */
    function preWrap(funs) {
	const headArgs = lib.args.slice(arguments, 1);
	const list = lib.array.to(funs, /\s+/);

	return function () {
	    let rv;

	    const runtimeArgs = lib.args.slice(arguments);
	    const callArgs = headArgs.concat(runtimeArgs);

	    for (let item of list) {
		const fn = lib.utils.getFunction(item);
		if (!fn) return undefined;
		rv = fn(...callArgs);
	    }

	    return rv;
	};
    }

    /**
     * Attempt to retrieve the caller location/name from the call stack.
     *
     * IMPORTANT:
     * ----------
     * This is a DEBUG / DIAGNOSTIC helper only.
     *
     * Behavior:
     * ---------
     * - Creates an Error to capture the current stack trace.
     * - Extracts the immediate caller line from the stack.
     * - Returns a trimmed string describing the callsite.
     *
     * Caveats:
     * --------
     * - Stack trace formats are engine-dependent.
     * - Minified / bundled code may produce meaningless output.
     * - Not suitable for logic, routing, or production identifiers.
     *
     * Typical use:
     * ------------
     * - Logging
     * - Debug traces
     * - Developer diagnostics
     */
    function name() {
	const err = new Error();
	if (!err.stack) return undefined;

	const lines = err.stack.split('\n');
	if (lines.length < 3) return undefined;

	return lines[2].trim();
    }
    
    var disp = {
	name : name,
	wrapper : wrapper,
	postWrap: postWrap,
	preWrap: preWrap,
	get : getFunction
    };
    return disp;
}

export default make;


# --- end: src/lib/func.js ---



# --- begin: src/lib/hash.js ---

//lib.hash = (function(lib){
export function make(lib) {


    
    /**
     * Determine whether a value is a plain hash object.
     *
     * Semantics (locked):
     * - Must be truthy
     * - Must NOT be an array
     * - Must be a plain Object (not a class instance, DOM node, etc.)
     *
     * This is intentionally stricter than a generic "object" check.
     *
     * @param {*} obj
     * @returns {boolean}
     */
    function is(obj) {
        if (!obj) return false;
        if (Array.isArray(obj)) return false;

        // Reject non-plain objects (classes, DOM nodes, etc.)
        /*
        if (!obj.hasOwnProperty('constructor') && obj.constructor !== Object) {
            return false;
        }
        */
        if (!Object.prototype.hasOwnProperty.call(obj, 'constructor') && obj.constructor !== Object) {
            return false;
        }

        return true;
    }
    
    /**
     * Test whether a value is an empty hash (plain object with no keys).
     *
     * Contract:
     * - Returns true ONLY if the value is a hash AND has zero enumerable keys.
     * - Returns false for null, undefined, non-objects, arrays, and non-empty hashes.
     *
     * @param {*} value
     * @returns {boolean}
     */
    function empty(value) {
	return lib.hash.is(value) && Object.keys(value).length === 0;
    }

    /**
     * Return the enumerable keys of a hash.
     *
     * Contract:
     * - Returns an array of keys ONLY if the value is a hash.
     * - Returns an empty array for all other inputs (null, undefined, arrays, primitives).
     * - Never throws.
     *
     * @param {*} value
     * @returns {Array<string>}
     */
    function keys(value) {
	return lib.hash.is(value) ? Object.keys(value) : [];
    }
        /**
     * Coerce any input into a hash (plain object).
     *
     * Contract:
     * - Always returns a hash.
     * - If `obj` is already a hash, return it unchanged.
     * - Otherwise return an empty hash, or (if `hotkey` is provided)
     *   wrap the value: { [hotkey]: obj }.
     *
     * Notes:
     * - This function is intentionally permissive; it is a normalization helper.
     * - Legacy merge/opts behavior previously existed here, but is not active in
     *   the current implementation (unreachable code removed).
     *
     * @param {*} obj
     * @param {string} [hotkey]
     * @returns {Object}
     */
    function to(obj, hotkey) {
        if (is(obj)) return obj;

        const out = {};
        if (!lib.utils.isEmpty(hotkey) && lib.str.is(hotkey) ) {
            out[hotkey] = obj;
        }
        return out;
    }
    
    /**
     * Deep copy utility with class / DOM safeguards.
     *
     * Performs a recursive copy of plain objects and arrays.
     * Non-plain objects (class instances, DOM elements, etc.)
     * are returned by reference unless explicitly forced.
     *
     * Behavior:
     * - Scalars (string, number, boolean, null, undefined) are returned as-is.
     * - Arrays are deep-copied element-by-element.
     * - Plain objects (hashes) are deep-copied key-by-key.
     * - Class instances are NOT traversed by default and are returned by reference.
     * - DOM Elements are NOT copied and are returned by reference.
     *
     * Options:
     * - force {number|boolean}:
     *     If truthy (=== 1), forces traversal of non-plain objects.
     *     Use with caution — prototypes are NOT preserved.
     *
     * - debug {boolean}:
     *     If true, logs when traversal is skipped due to class detection.
     *
     * Notes:
     * - This function does NOT preserve prototypes.
     * - Enumerable inherited properties WILL be copied (for...in semantics).
     * - Designed for config / manifest / data objects, not arbitrary class graphs.
     *
     * @param {*} inObject
     *     The value to deep-copy.
     *
     * @param {Object} [opts]
     *     Optional behavior flags.
     *
     * @returns {*}
     *     A deep copy of the input for arrays and plain objects,
     *     or the original reference for unsupported object types.
     */
    
    function deepCopy(inObject, opts = {}) {
	opts = to(opts);

	if (typeof inObject !== "object" || inObject === null) {
            return inObject;
	}

	const isElement =
              (typeof Element !== "undefined") &&
              (inObject instanceof Element);

	if (
            opts.force !== 1 &&
		!isElement &&
		!lib.array.is(inObject) &&
		!is(inObject)
	) {
            if (opts.debug) {
		const cname =
                      (inObject &&
                       inObject.constructor &&
                       inObject.constructor.name) ||
                      "<unknown>";
		console.log(
                    "not traversing, its probably a class " + cname
		);
            }
            return inObject;
	}

	const outObject = Array.isArray(inObject) ? [] : {};

	for (const key in inObject) {
            outObject[key] = deepCopy(inObject[key], opts);
	}

	return outObject;
    }


    /**
     * Safe hash lookup with fallback.
     *
     * Returns the value associated with `key` in `hash` if the key exists,
     * otherwise returns the provided default.
     *
     * Notes:
     * - Uses the `in` operator, so inherited enumerable properties
     *   are considered present.
     * - Does NOT check for own-properties only.
     *
     * @param {string} key
     *     Key to look up.
     *
     * @param {Object} hash
     *     Object to query.
     *
     * @param {*} def
     *     Default value to return if key is not present.
     *
     * @returns {*}
     *     The value at `hash[key]` if present, otherwise `def`.
     */
    function hashOr(key, hash, def) {
	return (key in hash) ? hash[key] : def;
    }


    /**
     * Deep merge two plain hashes (non-destructive).
     *
     * Semantics:
     * - Returns `undefined` unless BOTH inputs are hashes (per lib.hash.is).
     * - Deep-copies both inputs before merging (does not mutate caller objects).
     * - Iterates enumerable properties of `right` and merges into `left`.
     * - Uses a type-pair dispatch table:
     *     hh : object + object  -> recursive merge
     *     aa : array  + array   -> concat (returns new array)
     *     as : array  + scalar  -> push scalar into array
     *     default              -> overwrite with right
     *
     * Options:
     * - opts.disp: optional override/extension of the dispatch table.
     *   Example:
     *     { disp: { ss: (l,r)=> String(l)+String(r) } }
     *
     * Note:
     * - This version fixes an old bug where the recursive handler (hh) accidentally
     *   captured the `opts` from the FIRST call ever made to merge(). Recursion now
     *   uses the current call’s `opts` consistently.
     *
     * @param {Object} left
     * @param {Object} right
     * @param {Object} [opts]
     * @returns {Object|undefined}
     */
    function merge(left, right, opts) {
	if (!(is(left) && is(right))) return undefined;

	// Non-destructive behavior
	left = deepCopy(left);
	right = deepCopy(right);

	const hmap = { array: 'a', object: 'h' };

	// Base dispatch table for this call (important: no cross-call capture)
	const baseDisp = {
            hh: function (l, r) { return merge(l, r, opts); }, // recursion uses CURRENT opts
            as: function (l, r) { l.push(r); return l; },
            aa: function (l, r) { return l.concat(r); },
            'default': function (l, r) { return r; }
	};

	// Merge in user dispatch overrides (if any)
	const disp =
              (is(opts) && ('disp' in opts))
              ? Object.assign({}, baseDisp, opts.disp)
              : baseDisp;

	for (const p in right) {
            const lt = hashOr(lib.utils.baseType(left[p]), hmap, 's');
            const rt = hashOr(lib.utils.baseType(right[p]), hmap, 's');
            let type = lt + rt;

            if (!(type in disp)) type = 'default';
            left[p] = disp[type](left[p], right[p]);
	}

	return left;
    }
    
    function mergeMany(list, opts) {
	// Only keep actual hashes; lib.hash.merge returns undefined unless both are hashes
	list = lib.array.to(list).filter(x => lib.hash.is(x));
	
	if (list.length === 0) return {};
	
	let out = lib.utils.deepCopy(list[0]);
	
	for (let i = 1; i < list.length; i++) {
            out = lib.hash.merge(out, list[i], opts) || out;
	}
	return out;
    }

    /**
     * Safely get a nested value from an object using a dot-path.
     *
     * Supports array indexes in paths:
     *   - "foo.0.bar"  => foo[0].bar
     *
     * Semantics (kept):
     * - If an intermediate hop cannot be traversed, returns `def`.
     * - On the final key, returns value unless it is `undefined` (then returns `def`).
     *
     * @param {object|array} E
     * @param {string|array} prop
     * @param {*} def
     * @returns {*}
     */
    function hashGet(E, prop, def) {
	if (!lib.utils.baseType(E, 'object') && !lib.utils.baseType(E, 'array')) return def;

	const parts = lib.array.to(prop, '.');
	if (!parts) {
            console.log('wasnt able to parse array from prop: ' + prop);
            return def;
	}

	let ptr = E;

	for (let i = 0; i < parts.length; i++) {
            const keyRaw = parts[i];

            // Must be traversable *as a container* to continue
            const ptrIsObj = lib.utils.baseType(ptr, 'object');
            const ptrIsArr = lib.utils.baseType(ptr, 'array');
            if (!ptrIsObj && !ptrIsArr) return def;

            // If current container is an array, prefer numeric index when key looks like an int.
            // Otherwise, treat as normal property access.
            let key = keyRaw;
            if (ptrIsArr) {
		// accept "0", "1", "2" ... (no negatives, no floats)
		// NOTE: arr["0"] works anyway; converting to number is mainly clarity + guards.
		if (typeof keyRaw === 'string' && /^[0-9]+$/.test(keyRaw)) {
                    key = parseInt(keyRaw, 10);
		}
            }

            const val = ptr[key];

            // Traverse if next value is object OR array
            const valIsObj = lib.utils.baseType(val, 'object');
            const valIsArr = lib.utils.baseType(val, 'array');

            if (valIsObj || valIsArr) {
		ptr = val;
		continue;
            }

            // Not traversable: if not at end, fail
            if (i < parts.length - 1) return def;

            // Last hop: undefined means "missing", everything else is valid
            return (val === undefined) ? def : val;
	}

	return ptr;
    }


    /**
     * Return the first non-null / non-undefined value found at any of the given paths.
     *
     * @param {Object} rec   Source object
     * @param {string|Array} list  Space-delimited paths or array of paths
     * @param {*} [def]     Default value if none found
     * @returns {*}
     */
    function getUntilNotEmpty(rec, list, def) {
	list = lib.array.to(list, /\s+/);

	for (let i = 0; i < list.length; i++) {
            const key = list[i];
            const val = lib.hash.get(rec, key);

            // Accept anything except null / undefined
            if (!lib.utils.baseType(val, "null undefined")) {
		return val;
            }
	}

	return def;
    }    
    /*

    //legacy hash set. cannot do destructive setting. ironically, it works amazingly well on the dom tree where the new sauce doesn't.

    sets a property within the hash. uses the same property methodology  as getProperty.
    
    if a intervening hash key does not exist, it will not be created and will return 0
    else, returns 1 (success)
    */


    function legacySet(E, prop, value){
	//console.log('value is '+value);
	if (lib.utils.baseType(E,'object')) {

	    var parts = lib.array.to(prop,'.');
	    if (parts){
		var ptr = E;
		parts.forEach (function(item,index) {
		    var Type = lib.utils.baseType(  ptr[item]);
		    //console.log(item + ' ' + Type);
		    if (lib.utils.baseType(  ptr[item], 'object')) {
			ptr = ptr[item];
		    }else {
			if (index < parts.length -1 ){
			    console.log('cannot set property. unable to traverse object deeper at [\''+item + '\'] ... type is not object (' +Type+')' );
			    return 0;
			}else {
			    ptr[item] = value;
			    return 1;
			}
		    }
		    
		    
		} );

		
	    }else {
		console.log('wasnt able to parse array from prop: '+prop);
		return 0;
		E[prop] = value;
		return 1;
	    }
	}else {
	    return 0;
	}
    }

    /**
     * Set a deep property on an object using a dotted path, creating missing
     * intermediate containers as needed.
     *
     * Locked behavior:
     * - Default: all segments are treated as object keys (e.g. "2" is key "2").
     * - If opts.arrayIndex === true:
     *   - non-negative integer segments ("0","1","2",...) are treated as array indexes
     *     ONLY when creating a missing container (or when the current container is already an array).
     *   - never coerces an existing object into an array.
     * - Negative integers and non-integers are always treated as string keys.
     *
     * @param {Object|Array} rec
     * @param {string|string[]} prop Dotted path ("a.b.c") or path array (["a","b","c"])
     * @param {*} value
     * @param {Object} [opts]
     * @param {boolean} [opts.arrayIndex=false]
     * @returns {Object|Array|*} mutated record (or `value` if path is empty)
     */
    function hashSet(rec, prop, value, opts) {
	opts = to(opts, 'arrayIndex');
	const useArrayIndex = opts.arrayIndex === true;

	if (prop === 0) prop = "0"; //lib.array.to always coerces to [] minimally
	prop = lib.array.to(prop, '.');
	if (!prop.length) return value;

	const isIndex = (s) =>
              (typeof s === 'string' || typeof s === 'number') &&
              /^(0|[1-9]\d*)$/.test(String(s));

	// normalize root container (allow array root if first segment is index)
	if (!lib.utils.baseType(rec, ['object', 'array'])) {
            rec = (useArrayIndex && isIndex(prop[0])) ? [] : {};
	}

	const head = prop[0];
	const tail = prop.slice(1);
	const last = tail.length === 0;

	const key =
              (useArrayIndex && Array.isArray(rec) && isIndex(head))
              ? Number(head)
              : String(head);

	if (last) {
            rec[key] = value;
            return rec;
	}

	let next = rec[key];

	// IMPORTANT: arrays are valid containers; don't clobber them
	if (!lib.utils.baseType(next, ['object', 'array'])) {
            const nextSeg = tail[0];
            next = (useArrayIndex && isIndex(nextSeg)) ? [] : {};
            rec[key] = next;
	}

	hashSet(next, tail, value, opts);
	return rec;
    }

    /**
     * Check whether a deep property path exists.
     *
     * Semantics:
     * - Structural existence check by default.
     * - Falsy values (undefined, null, false, 0) are valid unless `truthy` is set.
     * - Supports array indexes in paths ("a.0.b").
     *
     * Options:
     * - truthy {boolean|number}:
     *     If true, requires the resolved value to be truthy.
     *
     * @param {Object|Array} rec
     * @param {string|Array<string|number>} prop
     * @param {Object|boolean} [opts]
     * @returns {boolean}
     */
    function exists(rec, prop, opts) {
	opts = to(opts, 'truthy');
	const requireTruthy = opts.truthy === true;

	if (!lib.utils.baseType(rec, ['object', 'array'])) return false;

	const parts = lib.array.to(prop, '.');
	let ptr = rec;

	for (let i = 0; i < parts.length; i++) {
            const keyRaw = parts[i];

            if (!lib.utils.baseType(ptr, ['object', 'array'])) {
		return false;
            }

            let key = keyRaw;
            if (Array.isArray(ptr) && /^[0-9]+$/.test(String(keyRaw))) {
		key = Number(keyRaw);
            }

            if (!(key in ptr)) {
		return false;
            }

            ptr = ptr[key];
	}

	return requireTruthy ? !!ptr : true;
    }    
    /**
     * Expand a list of property paths from an object into an array of values.
     *
     * - `exp` may be a space-delimited string or an array of strings.
     * - String form is split on whitespace.
     * - Array form is treated as literal entries (no splitting).
     * - Each entry is resolved via lib.hash.get (deep paths supported).
     *
     * @param {Object} opts
     * @param {string|Array<string>} exp
     * @returns {Array<any>}
     */
    function expand(opts, exp) {
	const list = lib.array.to(exp, /\s+/);
	const rv = [];

	for (let i = 0; i < list.length; i++) {
	    rv.push(hashGet(opts, list[i]));
	}
	return rv;
    }    


    /**
     * Shallow key/value decoration helper.
     *
     * - When `key === 1`, decorates keys with `pre` and `post`.
     * - Otherwise, decorates string/number values only.
     * - Non-scalar values are passed through unchanged.
     * - Input is not mutated.
     *
     * @param {Object} input
     * @param {string} [pre=""]
     * @param {string} [post=""]
     * @param {number} [key=0]  If truthy, operate on keys instead of values
     * @returns {Object|undefined}
     */
    function hashAppend(input, pre = "", post = "", key = 0) {
	if (!is(input)) return undefined;

	const output = {};
	const keys = Object.keys(input);

	for (const k of keys) {
	    const val = input[k];

	    if (key) {
		output[pre + k + post] = val;
	    } else if (lib.utils.baseType(val, ["string", "number"])) {
		output[k] = pre + val + post;
	    } else {
		output[k] = val;
	    }
	}

	return output;
    }
    

    /**
     * Flatten a nested hash or array into a shallow key/value object.
     *
     * Rules:
     * - Objects use `opts.delim` between keys (default ".")
     * - Arrays use `opts.array` between parent and index (default ".")
     * - Scalar values become leaf entries
     *
     * Examples:
     *   flatten({ a: { b: 1 } })
     *   → { "a.b": 1 }
     *
     *   flatten({ a: [ { b: 1 }, 2 ] })
     *   → { "a.0.b": 1, "a.1": 2 }
     *
     * Options:
     * - prefix : internal recursion prefix (string)
     * - delim  : object key delimiter (string, default ".")
     * - array  : array index delimiter (string, default ".")
     *
     * Notes:
     * - Non-hash / non-array inputs return undefined.
     * - Enumeration order follows native `for...in` behavior (legacy-safe).
     *
     * @param {Object|Array} rec   Input structure to flatten
     * @param {string|Object} [opts]  Optional config or config string
     * @returns {Object|undefined}
     */
    function flatten(rec, opts) {
	let out = {};

	opts = Object.assign(
	    { prefix: "", delim: ".", array: "." },
	    parseStringSimple(opts) || {}
	);

	// preserve your legacy prefix logic
	let prefix = lib.utils.isEmpty(opts.prefix) ? "" : opts.prefix;

	if (lib.array.is(rec)) {
	    for (const i in rec) {
		const v = rec[i];

		if (lib.utils.isScalar(v)) {
		    out[prefix + opts.array + i] = v;
		} else {
		    const val = flatten(v, Object.assign({}, opts, { prefix: prefix + opts.array + i }));
		    // FIX: merge returned flat keys into out (do NOT assign a merged object to one key)
		    out = Object.assign({}, out, val);
		}
	    }
	    return out;
	}

	if (is(rec)) {
	    const nextPrefix =
		  prefix === "" ? "" : prefix + (opts.delim || "");

	    for (const key in rec) {
		const v = rec[key];

		if (lib.utils.isScalar(v)) {
		    out[nextPrefix + key] = v;
		} else {
		    const val = flatten(
			v,
			Object.assign({}, opts, { prefix: nextPrefix + key })
		    );
		    out = Object.assign({}, out, val);
		}
	    }
	    return out;
	}

	return undefined;
    }
    



    /**
     * Inflate a flat hash of key/value pairs into a nested object.
     *
     * Example:
     *   inflate({ "a.b": 1, "c.d.e": 2 })
     *   → { a: { b: 1 }, c: { d: { e: 2 } } }
     *
     * Config:
     * - config.delim (default "."):
     *   If provided, occurrences of `delim` in each key are converted to "." before
     *   passing into lib.hash.set (which interprets "." as a path separator).
     *
     * Notes:
     * - Returns undefined unless `rec` is a hash.
     * - Values are assigned as-is (no cloning).
     * - Later keys can overwrite earlier branches depending on lib.hash.set behavior.
     *
     * @param {Object} rec
     * @param {string|Object} [config]  String parsed by parseStringSimple, or an object.
     * @returns {Object|undefined}
     */
    function inflate(rec, config) {
	if (!is(rec)) return undefined;

	const out = {};
	config = Object.assign({}, { delim: "." }, parseStringSimple(config) || {});

	for (const key in rec) {
	    // If delim is ".", this is a no-op and preserves original behavior.
	    // Avoid String.prototype.replaceAll for wider ES6 compatibility.
	    const tKey = config.delim ? String(key).split(config.delim).join(".") : key;
	    hashSet(out, tKey, rec[key]);
	}

	return out;
    }


    // leaving this here unlinked, b/c it will eventually be replaced with slackparse.
    /**
     * Parse a simple delimited key/value string into an object.
     *
     * Supported formats:
     * - Pairs are separated by semicolons (`;`)
     * - Keys and values may be separated by `:` or `=`
     * - The first valid separator in each pair is used
     *
     * Examples:
     *   "a:1; b=2"        → { a: "1", b: "2" }
     *   "foo=bar;baz:qux" → { foo: "bar", baz: "qux" }
     *
     * Behavior notes:
     * - If `str` is already a hash, it is returned as-is.
     * - Empty or non-string input returns `undefined`.
     * - Whitespace is trimmed from keys and values.
     * - Invalid fragments (no `:` or `=`) are ignored.
     * - Values are always returned as strings.
     *
     * This is a lightweight legacy helper and will eventually
     * be replaced by a more robust parser.
     *
     * @param {string|Object|undefined} str
     * @returns {Object|undefined}
     */
    function parseStringSimple(str = undefined) {
	if (is(str)) return str;

	str = lib.utils.toString(str);
	if (lib.utils.isEmpty(str)) return undefined;

	const out = {};
	const parts = str.split(";");

	for (let p of parts) {
	    p = p.trim();
	    const pc = p.indexOf(":");
	    const pe = p.indexOf("=");

	    if (pc < 1 && pe < 1) continue;

	    const subdelim =
		  (pc === -1) ? "=" :
		  (pe === -1) ? ":" :
		  (pc < pe) ? ":" : "=";

	    const pair = p.split(subdelim, 2);
	    const key = (pair[0] !== undefined) ? String(pair[0]).trim() : "";
	    const value = (pair[1] !== undefined) ? String(pair[1]).trim() : "";

	    out[key] = value;
	}

	return out;
    }


    /**
     * Deep-strip unwanted values from a hash/array structure.
     *
     * Total-function design:
     * - Always returns a value (or undefined only when explicitly compacting away an empty container).
     * - Does NOT mutate the input.
     *
     * Default behavior (LOCKED):
     * - Removes ONLY `undefined` values.
     * - Preserves: null, false, 0, "".
     * - Recurses into plain hashes and arrays.
     * - Does NOT compact containers unless requested.
     *
     * Options:
     * - strip: Array<any>
     *     Values to remove using strict equality (===). Default: [undefined]
     *
     * - compact: boolean
     *     Sugar for { compactArrays:true, compactObjects:true }
     *
     * - compactArrays: boolean
     *     If true, removed array entries are omitted and arrays are reindexed.
     *     If false, array positions are preserved (removed entries become undefined).
     *
     * - compactObjects: boolean
     *     If true, empty objects/arrays encountered as children are removed from parents.
     *     If false, empty containers are preserved.
     *
     * Notes:
     * - "Plain hash" detection uses lib.hash.is (lib.hash.is).
     * - Arrays are treated as arrays; objects with numeric keys are NOT converted.
     *
     * @param {*} value
     * @param {Object} [opts]
     * @returns {*}
     */
    function strip(value, opts) {
	opts = to(opts);

	// Defaults
	const stripList = Array.isArray(opts.strip) ? opts.strip : [undefined];

	const compact = (opts.compact === true);
	const compactArrays = (opts.compactArrays === true) || compact;
	const compactObjects = (opts.compactObjects === true) || compact;

	const shouldStrip = (v) => {
            for (let i = 0; i < stripList.length; i++) {
		if (v === stripList[i]) return true;
            }
            return false;
	};

	const isEmptyContainer = (v) => {
            if (Array.isArray(v)) return v.length === 0;
            if (is(v)) return Object.keys(v).length === 0;
            return false;
	};

	const walk = (v) => {
            // Strip leaf
            if (shouldStrip(v)) return undefined;

            // Array
            if (Array.isArray(v)) {
		if (!v.length) return v; // preserve empty array unless parent compacts it

		if (compactArrays) {
                    const out = [];
                    for (let i = 0; i < v.length; i++) {
			const child = walk(v[i]);
			if (child === undefined) continue;

			// if compactObjects, allow child container to disappear
			if (compactObjects && isEmptyContainer(child)) continue;

			out.push(child);
                    }
                    return out;
		}

		// preserve indices
		const out = new Array(v.length);
		for (let i = 0; i < v.length; i++) {
                    const child = walk(v[i]);
                    out[i] = child; // may be undefined (by design)
		}
		return out;
            }

            // Plain hash
            if (is(v)) {
		const out = {};
		for (const k in v) {
                    const child = walk(v[k]);
                    if (child === undefined) continue;

                    if (compactObjects && isEmptyContainer(child)) continue;

                    out[k] = child;
		}
		return out;
            }

            // Other types: return as-is
            return v;
	};


	const out = walk(value);

	// If compactObjects is on and the root becomes an empty container, allow it to vanish.
	if (compactObjects && isEmptyContainer(out)) return undefined;

	return out;
    }

    
    /**
     * Check that an object has all of the given keys / paths.
     *
     * Semantics:
     * - `obj` must be a plain hash.
     * - `keys` may be an array or whitespace-delimited string.
     * - Each key/path is checked via lib.hash.exists (deep paths supported).
     * - If opts.truthy is true, values must exist AND be truthy.
     *
     * @param {Object} obj
     * @param {string|Array<string>} keys
     * @param {Object|boolean} [opts]
     * @returns {boolean}
     */
    function hasKeys(obj, keys, opts) {
        if (!is(obj)) return false;

        opts = to(opts, 'truthy');
        const list = lib.array.to(keys, /\s+/);

        for (let i = 0; i < list.length; i++) {
            if (!exists(obj, list[i], opts)) return false;
        }
        return true;
    }

    /**
     * Slice selected keys/paths from a record into a new object.
     *
     *  PHP  to JS port of hash::slice(). for original (and still better. b/c I neglected to port all features to php, see Perl version , probably sliceIf)
     *
     * @param {Object} rec                Source record
     * @param {string|string[]} list      Space-delimited string or array of keys/paths. If empty, uses Object.keys(rec).
     * @param {string|Object} [opts]      Options; supports opts.set flags (string)
     * @returns {Object}                  New object containing selected paths
     *
     * Flags (opts.set):
     * - truthy => "force set": include keys even if they don't exist (value will be undefined)
     * - 'l'    => when not force-set: skip empty-string "" and null values
     * - 'd'    => when not force-set: skip null values
     */
    function slice(rec, list, opts) {
	if (!lib.hash.is(rec)) return {};

	opts = lib.hash.to(opts, "set") ;
	const flags = String(opts.set ?? "");
	const forceSet = lib.bool.yes(flags);

	// Normalize list
	list = lib.array.to(list, {trim:true, split: /\s+/}).filter(Boolean);;
	if (!lib.array.len(list) ) list = keys(list);

	const out = {};

	for (const key of list) {
            const val = hashGet(rec, key);

            if (hasKeys(rec, key) || forceSet) {
		if (!forceSet) {
                    // 'l' flag: skip empty string or null
                    if (flags.includes("l")) {
			if ((typeof val === "string" && val.length < 1) || val === null) continue;
                    }
                    // 'd' flag: skip null
                    if (flags.includes("d")) {
			if (val === null) continue;
                    }
		}
		lib.hash.set(out, key, val);
            }
	}

	return out;
    }

    
    const disp = {
	get: hashGet,
	set: hashSet,
	legacySet: legacySet,
	expand: expand,
	to,
	is,
	hasKeys,
	append:hashAppend,
	merge:merge,
	mergeMany,
	flatten: flatten,
	inflate: inflate,
	exists,
	strip,
	getUntilNotEmpty,
	deepCopy,
	keys,
	empty,
	slice
    };

    return disp;
    

}
export default make;


# --- end: src/lib/hash.js ---



# --- begin: src/lib/number.js ---

export function make(lib) {
    function clamp(n, min, max, def) {
	// default fallback
	if (def === undefined) def = min;
	
	// strict numeric coercion
	const num = (typeof n === "number")
              ? n
              : (typeof n === "string" && n !== "" ? Number(n) : NaN);

	if (!Number.isFinite(num)) return def;

	let out = num;

	// lower bound
	if (!lib.utils.isEmpty(min)) {
            const minNum = Number(min);
            if (Number.isFinite(minNum)) {
		out = Math.max(out, minNum);
            }
	}

	// upper bound
	if (!lib.utils.isEmpty(max)) {
            const maxNum = Number(max);
            if (Number.isFinite(maxNum)) {
		out = Math.min(out, maxNum);
            }
	}

	return out;
    }
    function toInt(val, def = 0) {
	const type = typeof val;
	if (!["number", "string"].includes(type)) return def;

	if (type === "number") {
            if (!Number.isFinite(val)) return def;
            return Math.trunc(val);
	}

	if (val.length < 1) return def;

	if (val.match(/[^+\-\d.]/g)) return def;

	if (lib.str.countChars(val, ".") > 1) return def;
	if (lib.str.countChars(val, ["+", "-"]) > 1) return def;

	if (val.indexOf("+") > 0 || val.indexOf("-") > 0) return def;

	const fChar = val.substr(0, 1);
	const lChar = val.substr(-1, 1);

	if (lChar === ".") return def;
	if (fChar === ".") return 0;

	const sign = (fChar === "+" || fChar === "-") ? fChar : null;
	const rem = sign ? val.substr(1) : val;

	if (rem.length < 1) return def;

	// ".5" or "-.5" => 0 by your policy
	if (rem.substr(0, 1) === ".") return 0;

	const num = Number(rem);
	if (!Number.isFinite(num)) return def;

	const res = (sign === "-" ? -1 : 1) * num;
	return Math.trunc(res);
    }
    

    const disp = {
	clamp,
	toInt
    };

    return disp;


}
export default make;


# --- end: src/lib/number.js ---



# --- begin: src/lib/require.js ---

// lib/require.js
/**
 * Dependency gate / resolver utilities.
 *
 * Purpose:
 * - Validate that dot-path targets exist on a root object
 * - Optionally return resolved values (array or map)
 * - Designed for bootstrap + runtime dependency checks
 *
 * Default semantics (m7):
 * - "exists" means: path resolves to a non-nullish value (NOT null/undefined)
 * - If opts.allowFalsy === false, the leaf must be truthy (!!val)
 */

export function make(lib) {
    /**
     * Require targets on an arbitrary root object.
     *
     * @param {Object} root
     * @param {string|Array<string>} targets
     * @param {Object|boolean} [opts]
     * @param {string}  [opts.mod='[require]']
     * @param {boolean} [opts.allowFalsy=true]  // true => allow false/0/"" but not null/undefined
     * @param {boolean} [opts.returnMap=false]
     * @param {boolean} [opts.die=true]         // if false, returns partial results (no throw)
     * @returns {Array<any>|Object}
     */
    function all(targets, opts) {
	opts = lib.hash.to(opts, "mod");

	const mod        = lib.hash.get(opts, "mod", "[require]");
	const allowFalsy = lib.hash.get(opts, "allowFalsy", true);
	const returnMap  = lib.hash.get(opts, "returnMap", false);
	const die        = lib.hash.get(opts, "die", true);

	// root is lib itself (by design)
	const root = lib;

	const list = lib.array.to(targets, /\s+/);

	const outArr = [];
	const outMap = {};
	const missing = [];

	for (const path of list) {
            // fast structural existence check
            if (!lib.hash.exists(root, path)) {
		missing.push(path);
		continue;
            }

            const val = lib.hash.get(root, path);

            // m7 default: must not be nullish
            const ok = allowFalsy
		  ? (val !== undefined && val !== null)
		  : !!val;

            if (!ok) {
		missing.push(path);
		continue;
            }

            outArr.push(val);
            outMap[path] = val;
	}

	if (missing.length && die) {
            throw new Error(
		`${mod} missing required targets: ${missing.join(", ")}`
            );
	}

	return returnMap ? outMap : outArr;
    }
    /**
     * Require targets on the main lib object.
     *
     * @param {string|Array<string>} targets
     * @param {Object|boolean} [opts]
     * @returns {Array<any>|Object}
     */
    function libReq(targets, opts) {
        return all(lib, targets, opts);
    }

    /**
     * Require one or more registered services.
     *
     * Semantics (m7):
     * - Service must exist in lib.service.services
     * - Default: service value must be non-nullish
     * - Optionally require truthy service entries
     *
     * @param {string|Array<string>} names
     * @param {Object|boolean} [opts]
     * @returns {Array<any>|Object}
     */
    function service(names, opts) {
	opts = lib.hash.to(opts, "mod");

	const mod        = lib.hash.get(opts, "mod", "[require.service]");
	const allowFalsy = lib.hash.get(opts, "allowFalsy", true);
	const returnMap  = lib.hash.get(opts, "returnMap", false);
	const die        = lib.hash.get(opts, "die", true);

	if (!lib.service || !lib.utils.baseType(lib.service.services, "object")) {
            if (die) throw new Error(`${mod} lib.service unavailable`);
            return returnMap ? {} : [];
	}

	const list = lib.array.to(names, /\s+/);

	const outArr = [];
	const outMap = {};
	const missing = [];

	for (const name of list) {
            const svc = lib.service.get(name);

            const ok = allowFalsy
		  ? (svc !== undefined && svc !== null)
		  : !!svc;

            if (!ok) {
		missing.push(name);
		continue;
            }

            outArr.push(svc);
            outMap[name] = svc;
	}

	if (missing.length && die) {
            throw new Error(`${mod} missing required services: ${missing.join(", ")}`);
	}

	return returnMap ? outMap : outArr;
    }

    
    return {
        all,
        lib: libReq,
	service
    };
}

export default make;


# --- end: src/lib/require.js ---



# --- begin: src/lib/service.js ---

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


# --- end: src/lib/service.js ---



# --- begin: src/lib/str.js ---

//lib/str.js

export function make(lib){
    /**
       simple alias to base type.
     */
    function is(v) {
	return typeof v === 'string';
	//return lib.utils.baseType(v, 'string');
    }
    /**
     * Coerce a value to a string (legacy-safe, normalized).
     *
     * Semantics (DO NOT change lightly):
     * - If v is string, number, or boolean → returns String(v)
     * - If opts.lc → lowercases the resulting string
     * - Otherwise returns undefined
     * - If opts.force is truthy → returns "" instead of undefined
     *
     * Options shortcut:
     * - If opts is not an object, it is treated as { force: opts }
     *
     * @param {*} v
     * @param {Object|number|boolean} [opts]
     * @returns {string|undefined}
     */
    function to(v, opts) {
	const o = lib.hash.to(opts, 'force');

	if (lib.utils.baseType(v, ["boolean", "number", "string"])) {
            let s = String(v);
            if (o.lc) s = s.toLowerCase();
            return s;
	}

	return o.force ? "" : undefined;
    }

    /**
     * Lowercase helper with optional forced coercion.
     *
     * Semantics (LOCKED):
     * - If `v` is scalar → returns lowercase string
     * - If `v` is NOT scalar:
     *     - returns undefined unless `force === true`
     * - If `force === true`:
     *     - coerces value to string and lowercases it
     *
     * This is a normalization helper — callers should not need to validate input.
     *
     * @param {*} v
     * @param {boolean} [force=false]
     * @returns {string|undefined}
     */
    function lc(v, force = false) {
	if (!lib.utils.isScalar(v) && !force) return undefined;
	return String(v).toLowerCase();
    }   


    /**
     * Strip JavaScript-style comments from source text.
     *
     * IMPORTANT LIMITATIONS (BY DESIGN):
     * -----------------------------------
     * This function performs simple regex-based comment stripping.
     * It is NOT a tokenizer or parser and is NOT syntax-aware.
     *
     * As a result, it WILL produce incorrect output in cases such as:
     * - URLs containing "//" (e.g. "https://example.com")
     * - Comment-like text inside string literals
     * - Regex literals containing comment markers
     * - Template strings containing comment markers
     *
     * This is intentional.
     * For correct lexical handling, a real parser/tokenizer is required.
     * That functionality belongs in a proper parsing/compiler layer,
     * not in this utility.
     *
     * Supported modes (via opts.strip):
     * - 1 or "a" : strip all comments (default)
     * - "m"      : strip multi-line comments only (/* ... *\/)
     * - "s"      : strip single-line comments only (// ...)
     * - Combinations allowed (e.g. "ms")
     *
     * Options may be passed as:
     * - scalar: stripComments(text, 1)
     * - string: stripComments(text, "m")
     * - hash  : stripComments(text, { strip: "s" })
     *
     * Use cases:
     * - Cleaning trusted source blobs
     * - Pre-processing loader input
     * - Removing comments from controlled config/code
     *
     * NOT suitable for:
     * - Arbitrary JavaScript source
     * - Security-sensitive transformations
     * - Anything requiring syntactic correctness
     *
     * @param {string} data
     * @param {string|number|Object} [opts]
     * @returns {string}
     */
    function stripComments(data, opts) {
	let cleaned = data;

	opts = lib.hash.to(opts, 'strip');
	if (!opts.strip) opts.strip = 1;

	
	const mode = to(opts.strip, 1);

	if (mode.match(/1|a|m/i)) {
            cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ""); //multi
	}

	if (mode.match(/1|a|s/i)) {
            cleaned = cleaned.replace(/\/\/.*/g, ""); //single
	}

	return cleaned;
    }


    /**
     * Counts the total occurrences of one or more characters in a string.
     * 
     * @param {string} str - The string to search in
     * @param {string|string[]} chars - A single character or an array of characters to count
     * @returns {number} The total number of times any of the characters appear
     * 
     * @example
     * countChars("hello world", "l")          // → 3
     * countChars("banana", ["a", "n"])        // → 5  (3 a's + 2 n's)
     * countChars("javascript", ["a", "s"])    // → 3
     * countChars("aaaAAA", "A")               // → 3
     * countChars("", ["x", "y"])              // → 0
     */
    function countChars(str, chars) {
	// Early exit for invalid/empty inputs
	if (!str || typeof str !== 'string') return 0;
	chars = lib.array.to(chars);
	if(!lib.array.len(chars) ) return 0;


	// Optional: filter out invalid entries (non-strings or empty)
	const validChars = chars.filter(c => typeof c === 'string' && c.length > 0);

	if (validChars.length === 0) return 0;

	let count = 0;

	for (let i = 0; i < str.length; i++) {
            const currentChar = str[i];
            // Check if current character is in our target set
            if (validChars.includes(currentChar)) {
		count++;
            }
	}

	return count;
    }

    

    return {
	is,lc,to,stripComments,countChars
    };
    

}

export default make;


# --- end: src/lib/str.js ---



# --- begin: src/lib/utils.js ---

export function make(lib) {

    

    /**
     * Determine whether a value is a scalar (leaf value).
     *
     * Scalars are values with no internal structure to traverse.
     *
     * Included:
     * - string
     * - number
     * - boolean
     * - bigint
     * - symbol
     *
     * Excluded:
     * - null
     * - undefined
     * - objects
     * - arrays
     * - functions
     *
     * @param {*} v
     * @returns {boolean}
     */
    function isScalar(v) {
	const t = typeof v;
	return (
            t === 'string' ||
		t === 'number' ||
		t === 'boolean' ||
		t === 'bigint' ||
		t === 'symbol'
	);
    }
    



    /**
     * Determine the base type of a value, optionally comparing against allowed types.
     *
     * Dual-mode behavior (LOCKED):
     *
     * 1) Compare mode (when `comp` is provided or coercible to a non-empty array):
     *    - Returns `true` if the value’s base type matches ANY entry in `comp`.
     *    - Returns `false` otherwise.
     *
     * 2) Query mode (when `comp` is omitted or empty):
     *    - Returns a string describing the value’s base type.
     *
     * Type rules:
     * - `null` is treated as its own type: `"null"`
     * - Arrays are reported as `"array"` (instead of `"object"`)
     * - All other values use JavaScript `typeof`
     *
     * Legacy note (behavior change in v1.0):
     * - Older versions performed an early-return when `value === null`,
     *   causing comparison results to depend on the ORDER of `comp`.
     * - Example (legacy):
     *     baseType(null, ['object','null']) → false
     *     baseType(null, ['null','object']) → true
     * - Current behavior:
     *     baseType(null, ['object','null']) → true
     * - Matching is now order-independent and consistent with all other types.
     *
     * @param {*} value
     * @param {string|Array<string>} [comp]
     * @returns {boolean|string}
     */
    function baseType(value, comp) {
	//gets used everywhere, avoid lib.array.to b/c it will cause circular function hell
	const list = lib.array.is(comp)
	      ? comp
	      : (lib.str.is(comp) ? comp.split(/\s+/) : (comp ? [comp] : []));
	//const list = lib.array.to(comp,/\s+/);
	
	// Compare mode -> boolean
	if (list.length) {
            let type;

            if (value === null) {
		type = 'null';
            } else {
		type = typeof value;
		if (type === 'object' && Array.isArray(value)) {
                    type = 'array';
		}
            }

            for (let i = 0; i < list.length; i++) {
		if (String(list[i]).toLowerCase() === type) {
                    return true;
		}
            }
            return false;
	}

	// Query mode -> string
	if (value === null) return 'null';

	let type = typeof value;
	if (type === 'object' && Array.isArray(value)) {
            type = 'array';
	}
	return type;
    }
    
    /**
     * Determine whether a value should be treated as "empty".
     *
     * Semantics (INTENTIONAL, DO NOT EXPAND):
     * - `undefined` → empty (not provided)
     * - `null`      → empty (explicitly cleared)
     * - `""`        → empty (blank string)
     * - `false`     → empty (explicitly disabled / absent signal)
     *
     * Non-empty by design:
     * - `0`         → valid value
     * - `"0"`       → valid value
     * - `NaN`       → valid (still a value)
     * - `[]` / `{}` → valid containers
     *
     * This is NOT PHP-style `empty()` and must not be treated as such.
     *
     * @param {*} value
     * @returns {boolean}
     */
    function isEmpty(value) {
	return (
            typeof value === "undefined" ||
		value === null ||
		value === "" ||
		value === false
	);
    }
    
    

    /**
     * Classify a link-like value or test membership against allowed types.
     *
     * Types:
     * - "hash"     : item is a plain object/hash
     * - "pathAbs"  : string starts with "/" (absolute *path* on origin)
     * - "pathRel"  : relative path ("./", "../", or bare "foo")
     * - "urlAbs"   : absolute URL with http/https scheme
     * - "urlNet"   : network-path reference ("//cdn.example.com/x.js")
     * - "resource" : non-http(s) scheme (data:, blob:, file:, chrome-extension:, etc.)
     * - "unknown"  : string but does not fit above (rare; usually treated as pathRel)
     * - undefined  : not a hash and not a string
     *
     * Predicate mode: if `check` provided and non-empty, returns 1 if type matches any entry, else 0.
     */
    function linkType(item, check = []) {
	let type;

	check = lib.array.to(check,{split:/\s+/,trim:true}).filter(Boolean);

	if (lib.hash.is(item)) {
            type = "hash";
	} else if (baseType(item, "string")) {
            const s = item.trim();

            if (!s) {
		type = "unknown";
            } else if (s.startsWith("//")) {
		type = "urlNet";
            } else if (/^https?:\/\//i.test(s)) {
		type = "urlAbs";
            } else if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(s)) {
		// Any other scheme: data:, blob:, file:, chrome-extension:, app:, etc.
		type = "resource";
            } else if (s.startsWith("/")) {
		type = "pathAbs";
            } else {
		// "./", "../", or bare "foo"
		type = "pathRel";
            }
	}

	if (check.length) {
            for (let i = 0; i < check.length; i++) {
		if (type === check[i]) return 1;
            }
            return 0;
	}

	return type;
    }

    /**
     * Classify a link-like value or test membership against allowed types.
     *
     * Dual-mode behavior (LOCKED):
     * 1) Classify mode (no `check`):
     *    - Returns a string type:
     *        - "hash"      : item is a plain object/hash
     *        - "absolute"  : string starts with "/" (absolute *path*)
     *        - "url"       : string starts with "http://" or "https://"
     *        - "relative"  : any other string
     *        - undefined   : not a hash and not a string
     *
     * 2) Predicate mode (`check` provided / non-empty):
     *    - Returns 1 if the detected type matches ANY entry in `check`, else 0.
     *
     * Notes:
     * - `check` is coerced via lib.array.to() so it can be a string, array, etc.
     * - No lowercasing/normalization is applied to `check` entries.
     *
     * @param {*} item
     * @param {string|Array<string>} [check=[]]
     * @returns {string|number|undefined}
     */

    
    function oldlinkType(item, check = []) {
	let type;
	check = lib.array.to(check);

	if (lib.hash.is(item)) {
            type = "hash";
	} else if (baseType(item, "string")) {
            if (item.match(/^\//)) type = "absolute";
            else if (item.match(/^https?\:\/\//)) type = "url";
            else type = "relative";
	}

	if (check.length) {
            for (let i = 0; i < check.length; i++) {
		if (type === check[i]) return 1;
            }
            return 0;
	}

	return type;
    }


    /**
     * Clamp a value to an allowed set.
     *
     * Contract:
     * - Returns `test` if it exists in `range`.
     * - Otherwise returns `def` (default: undefined).
     * - Never throws.
     *
     * Semantics:
     * - `range` may be an array or a space-delimited string.
     * - Matching is strict (`===`), no type coercion.
     *
     * @param {Array|string} range
     *     Allowed values.
     *
     * @param {*} test
     *     Value to test.
     *
     * @param {*} [def]
     *     Default value if `test` is not allowed.
     *
     * @returns {*}
     */
    function clamp(range, test, def = undefined) {
	const clamp_range = lib.array.to(range, { split: /\s+/, trim: true });
	return clamp_range.includes(test) ? test : def;
    }
    
    /**
     * Coerce a value into a finite number.
     *
     * Contract:
     * - Returns a finite number if coercion succeeds.
     * - Returns `def` otherwise.
     * - Never throws.
     *
     * Semantics:
     * - Uses `Number()` for conversion (no partial parsing).
     * - Empty-ish values (`undefined`, `null`, "", false) are treated as invalid.
     * - Rejects NaN and Infinity.
     *
     * @param {*} value
     *     Value to coerce.
     *
     * @param {*} [def]
     *     Default value if coercion fails.
     *
     * @returns {number|*}
     */
    function toNumber(value, def = undefined) {
	if (lib.utils.isEmpty(value)) return def;

	const n = Number(value);
	return Number.isFinite(n) ? n : def;
    }
    
    return {
	isArray      : lib.array.is,
	toArray      : lib.array.to,

	isHash       : lib.hash.is,
	toHash       : lib.hash.to,
	deepCopy     : lib.hash.deepCopy,
	isScalar     : isScalar,
	toString     : lib.str.to,
	baseType     : baseType,
	isEmpty      : isEmpty,

	linkType     : linkType,
	clamp        : clamp,
	toNumber     : toNumber,
	getFunction  : lib.func.get,
	stripComments: lib.str.stripComments,
	lc           : lib.str.lc
    };
}
export default make;


# --- end: src/lib/utils.js ---

