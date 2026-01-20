export function install(lib) {
    function getDispatch(){return {};  }
    function isArray(arg) {
	if (typeof arg == 'object') {
	    return Array.isArray(arg);
	    //var criteria = arg.constructor.toString().match(/array/i);
	    //return (criteria !=null);
	}
	return false;
    };
    function toArrayold (list){
	if (!list)return [];
	return (isArray(list))?list:[list] ;
    }
    function toArray (list, split=undefined){
	if (!list)return [];
	if(isArray(list))return list;
	if (!isEmpty(split)  && typeof(list) =='string'){ //figure out what a regexp is
	    //console.log('list=',list, 'split=',split);
	    return list.split(split);
	}else {
	    return [list];
	}
    }

    function isHash (obj) {
	if(!obj) return false;
	if(Array.isArray(obj)) return false;
	if(!obj.hasOwnProperty('constructor') && obj.constructor != Object) return false;
	return true;
    }
    function toHash(obj, hotkey=undefined){
	let def = {};
	if (isHash(obj))return obj;
	if (!isEmpty(hotkey) &&  baseType(hotkey,'string'))def[hotkey] = obj;
	return def;

	if (!isHash(def) ) {
	    opts = def;
	    def = {};
	}
	if (isHash(obj))return merge(def,obj);
	if (!isHash(opts) &&  !isEmpty(opts) && baseType(opts,'string') )
	    opts = {hotkey: opts};
	
	if (!isEmpty(opts['hotkey']) &&  baseType(opts['hotkey'],'string')){
	    def[opts['hotkey']] = obj;
	}
	if (isHash(opts['def']))def = merge(opts.def, def);
	
	return def;
    }

    

    
    function hasKeys (obj, keys,opts={}){
	if (!isHash(obj))return 0;
	keys = toArray(keys);
	for (let i =0,key=keys[i];i<keys.length;key=keys[++i]){
	    if(!(key in obj))return 0;
	}
	return 1;
    }


    
    function isScalar(v){
	return (typeof(v) =='string' || typeof(v) =='number')?1:0;
    }
    
    function toString(v,opts){
	let rv = undefined;
	opts = opts===undefined?{}:baseType(opts, 'object')?opts:{force:opts};
	if(typeof(v) =='string' || typeof(v) =='number'){
	    rv = ""+v;
	    if (opts['lc'])rv=rv.toLowerCase();
	}else if  (opts['force']){
	    rv = "";
	}
	
	return rv;
    }


    function baseType (value,comp){
	comp = toArray(comp);
	
	if (comp.length){
	    for (let i =0, item=comp[i]; i<comp.length;item=comp[++i]){
		if (value === null)
		    if(item.toLowerCase() == 'null'){
			return true;
		    }else{
			return false;
		    }
		var type = typeof(value);
		if (type == 'object'){
		    if (Array.isArray(value))type= 'array';
		}

		//return (type == item.toLowerCase())?true:false;
		if (item.toLowerCase() == type)return true;
	    }
	    return false;
	}else {
	    if (value === null)return 'null';
	    var type = typeof(value);
	    if (type == 'object'){
		if (Array.isArray(value))return 'array';
	    }
	    return type;
	}
	
    }
    
    function isEmpty(value){
	return (typeof value === "undefined" || value === null || value === "" || value===false);
    }

    
    function linkType (item,check = []){
	let type = undefined;
	check = toArray(check);
	if (isHash(item))type= "hash";
	else if (baseType(item,'string')){
	    //patt= new RegExp('^a',i);
	    if (item.match(/^\//))type= 'absolute';
	    else if (item.match(/^https?\:\/\//))type= 'url';
	    else type= 'relative';
	};
	
	if (check.length){
	    for (let  i=0; i < check.length;i++){
		if (type == check[i] )return 1;
	    }
	    return 0;
	}
	return type;
    }

    function deepCopy (inObject,opts = {}) {
	let outObject, value, key;
	opts = toHash(opts);
	
	if (typeof inObject !== "object" || inObject === null) {
	    return inObject // Return the value if inObject is not an object
	}


	if(opts['force'] != 1 && typeof inObject === "object" && !(inObject instanceof Element) && !isArray(inObject) && !isHash(inObject)){
	    //console.log('not traversing, its probably a class '+inObject.constructor.name);
	    return inObject; //(dont copy classes);                                                                                                                 
	}else {
	    //console.log('will try ' +inObject.constructor.name);
	}
	/*
	  if (!inObject.constructor.name.match(/^Object$/i)){
	  console.log('not traversing '+inObject.constrcutor.name);
          return inObject; //(dont copy classes);
          }
	*/
	// Create an array or object to hold the values
	outObject = Array.isArray(inObject) ? [] : {};
	
	for (key in inObject) {
	    value = inObject[key];
	    // Recursively (deep) copy for nested objects, including arrays
	    if (value instanceof Element)outObject[key]=opts.dom ==1?deepCopy(value):value;
	    else outObject[key] = deepCopy(value);
	}
	
	return outObject;
    }

    function hashOr(keys, hash, def){
	let list = toArray(keys);
	for (k of list){ 
	    if (k in hash) return hash[k];
	}
	return def;
    }
    //this is my crack sauce way better version. adapted from perl hash merge, and improved.
    function merge(left , right,opts = undefined){
	
	if (!(isHash(left) && isHash(right))) return undefined;
	var left = deepCopy(left);
	var right = deepCopy(right);
	
	var hmap = {'array': 'a', 'object':'h','element':'e'};
	//(isHash(opts) && ('disp' in opts))?opts.disp:
	
	if ( typeof this.disp == 'undefined' ){
	    this.disp =  {
		hh: function (l,r){return merge(l,r,opts);},
		as: function (l,r){l.push(r); return l;},
		aa: function (l,r){return l.concat(r);},
		'default': function (l,r){return r;}
	    };
	}
	
	//var disp =merge.disp;
	var disp = ( isHash(opts) && ('disp' in opts) )?{...this.disp, ...opts.disp}:this.disp;
	for (var p in right){
	    let type = (left[p] instanceof Element)?'e':(
		hashOr(baseType(left[p]), hmap, 's') + '' +
		    (right[p] instanceof Element?'e':hashOr(baseType(right[p]),hmap,'s')  ));
	    //console.log(`basetype l=${baseType(left[p])} || r=${baseType(right[p])} type=${type} key=${p} iel=${left[p] instanceof Element} ier=${right[p] instanceof Element}`);
	    
	    if (!(type in disp)) type= 'default';
	    left[p]=disp[type](left[p],right[p]);
	    
	}
	return left;
    }

    function hashStrip(rec, opts)  {
	if (!isHash(rec) ) return rec;
	let nRec = {};
	Object.keys(rec).forEach( (k,index) => {
	    if (rec[k] ===undefined)return;
	    nRec[k] = rec[k];
	});
	return nRec;
    };

    /*this may not work properly in all cases if you want to use it with objects, 
      even with apply(), unless you know what type of function your getting*/
    function getFunction(f,dummy=0){
	if(f){


	    if (typeof(f) == "function"){
		return (f);
	    }else if(window[f]){
		return (window[f]);
	    }else if(typeof f =='string')  {
		let parts = f.split(".");
		let root = parts.length?parts.shift():undefined;
		if (parts.length  && window[root]){
		    let t = window[root];
		    for(let i = 0; i < parts.length; i++) {
			if (t[parts[i]]){
			    t = t[parts[i]];
			}else {
			    t=undefined;break;
			}
		    }
		    //let t = lib.hash.get(window[root],parts);
		    if (baseType(t, 'function'))return t;
		}
		
	    }
	}

	return dummy?function () {}:undefined;
	return undefined;

    }


    function lc(v,fuckit=0){
	if (!isScalar(v) && !fuckit)return undefined;
	return ( (""+v).toLowerCase() );
    }
    


    function stripComments(data,opts){
	let cleaned = data;;
	opts = toHash(opts,'strip'); if(!opts['strip'])opts['strip'] = 1;
	opts['strip'] = toString(opts['strip']);
	if (opts['strip'].match(/1|a|m/i))
	    cleaned = data.replace( /\/\*[.\s\S]*?\*\//g, ""); // strip multi line
        if (opts['strip'].match(/1|a|s/i))
	    cleaned = cleaned.replace(/\/\/.*/g, ""); //strip single line
	return cleaned;
    }

    
    function getDispatch(){
	return {
	    isArray : isArray,
	    toArray : toArray,
	    //toArray2 : toArray2,
	    isHash  : isHash,
	    toHash  : toHash,
	    //hashSet : hashSet,
	    hasKeys : hasKeys,
	    isScalar: isScalar,
	    toString: toString,
	    baseType: baseType,
	    isEmpty : isEmpty,
	    
	    hashStrip:hashStrip,
	    merge:merge,
	    deepCopy:deepCopy,
	    linkType:linkType,
	    hashOr:hashOr,
	    getFunction:getFunction,
	    stripComments: stripComments,
	    lc:lc
	};
    }
    return getDispatch();
}
export default install;
