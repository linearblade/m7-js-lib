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
