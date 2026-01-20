//lib._http = (function(lib){
export function install(lib) {
    let get = function(url, opts){
	opts = lib.utils.toHash(opts);
	if (opts.debug)console.log('opts', opts);
	let req = new XMLHttpRequest();
	let method = lib.hash.get(opts,'method',"GET") ;
	//4/16/24 -- added with credentials.
	if(opts['credentials'] == true){
	    req.open(method,url,true);
	    req.withCredentials = true;
	}else req.open(method,url);
	req.onreadystatechange = function () {
	    if(req.readyState === XMLHttpRequest.DONE){
		//console.log('received data. status='+req.status, opts);
		if (req.status >=400)lib.utils.getFunction(opts['error'],1)(req);
		else lib.utils.getFunction(opts['load'],1)(req);		

		//if (lib.utils.getFunction(opts['load'])) opts['load'](req);
		/*
		  if (req.status === 200) {
		  console.log('received data');
		  success(req);
		  }else{
		  console.log('error getting data');
		  failure(req);
		  }*/
	    }
	};
	req.send(lib.hash.get(opts,'body'));
    }
    function _request(url, opts){
	opts = lib.utils.toHash(opts);
	//if (opts.debug)console.log('opts', opts);
	let req = new XMLHttpRequest();
	
	let method = lib.hash.get(opts,'method', "GET") ;
	let headers = lib.utils.toArray(opts.header);
	//4/16/24 -- added with credentials.
	if(opts['credentials'] == true){
	    req.open(method,url,true);
	    req.withCredentials = true;
	}else req.open(method,url);
	
	if(opts.urlencoded)req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	for (i of headers){
	    if (lib.hash.is(i)){
		req.setRequestHeader(i['name'],i['value']);
	    }
	}
	req.request={
	    url: url,
	    body: lib.hash.get(opts,'body')
	};
	req.onreadystatechange = function () {
	    if(req.readyState === XMLHttpRequest.DONE){
		//console.log('received data. status='+req.status, opts);
		if(opts.json==1)req.jsonData = lib.json.parse(req.responseText+"");
		if (req.status >=400)lib.utils.getFunction(opts['error'],1)(req);
		else lib.utils.getFunction(opts['load'],1)(req);		
	    }
	};
	if (opts.debug ){
	    console.log('sending',opts,req);
	}
	req.send(lib.hash.get(opts,'body'));
    }
    function post(url,opts){
	opts = lib.utils.toHash(opts);
	opts.method='POST';
	return _request(url,opts);
    }
    var disp = {
	get: get,
	post: post,
	request: _request
	
    };
    return disp;
}

export default install;
