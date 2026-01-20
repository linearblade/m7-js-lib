//lib.hash = (function(lib){
export function install(lib) {
    //console.log('installing lib.hash');
    /*lifted from medium because I'm lazy to write my own.
      https://medium.com/javascript-in-plain-english/how-to-deep-copy-objects-and-arrays-in-javascript-7c911359b089
      WTF is with people not using semi colons.
    */
    function deepCopy(inObject,opts={}) {
	let outObject, value, key;
	opts = lib.utils.toHash(opts);
	if (typeof inObject !== "object" || inObject === null) {
	    return inObject // Return the value if inObject is not an object 
	}
	//if (isHash(obj)!inObject.constructor.name.match(/^Object$/i)){ 
	if(opts['force'] != 1 && typeof inObject === "object" && !(inObject instanceof Element) && !lib.utils.isArray(inObject) && !lib.utils.isHash(inObject)){
	    console.log('not traversing, its probably a class '+inObject.constructor.name);
	    return inObject; //(dont copy classes);
	}else {
	    //console.log('will try ' +inObject.constructor.name);
	}
	/*
	  if(typeof inObject === "object" && !isDom(inObject) && !isArray(inObj) && !isHash(inObj)){ 
	  console.log('not traversing, its probably a class '+inObject.constructor.name);
	  return inObject; //(dont copy classes); 
	  }
	*/
	// Create an array or object to hold the values

        
	outObject = Array.isArray(inObject) ? [] : {};

	for (key in inObject) {
	    value = inObject[key];
	    // Recursively (deep) copy for nested objects, including arrays 
	    outObject[key] = deepCopy(value);
	}

	return outObject;
    }


    function hashOr(k, hash, def){
	if (k in hash) return hash[k];
	return def;
    }

    function merge (left , right,opts = undefined){

	if (!( lib.utils.isHash(left) && lib.utils.isHash(right))) return undefined;
	var left = deepCopy(left);
	var right = deepCopy(right);

	var hmap = {'array': 'a', 'object':'h'};
	//(isHash(opts) && ('disp' in opts))?opts.disp:
	if ( typeof merge.disp == 'undefined' ){
	    merge.disp =  {
		hh: function (l,r){return merge(l,r,opts);},
		as: function (l,r){l.push(r); return l;},
		aa: function (l,r){return l.concat(r);},
		'default': function (l,r){return r;}
	    };
	}

	//var disp =merge.disp;
	var disp = ( lib.utils.isHash(opts) && ('disp' in opts) )?{...merge.disp, ...opts.disp}:merge.disp;
	for (var p in right){
	    var type = hashOr(lib.utils.baseType(left[p]), hmap, 's') + '' + hashOr(lib.utils.baseType(right[p]),hmap,'s');
	    //console.log(type+ " " +p) ; 
	    if (!(type in disp)) type= 'default';
	    left[p]=disp[type](left[p],right[p]);

	}
	return left;
    }



    
    function hashGet(E, prop, def=undefined){
	//convert prop to array
	//if (prop == 'runEvents')  console.log('getting ' + prop + 'def = '+def);
	
	if (lib.utils.baseType(E,'object')) {
	    var parts =  lib.utils.toArray(prop,'.');
	    if (parts){
		
		var ptr = E;
		for (var i =0; i < parts.length; i++){
		    var item = parts[i];
		    //console.log ('item is ' + item);
		    var Type = lib.utils.baseType(  ptr[item] );
		    if (lib.utils.baseType(  ptr[item], 'object')) {
			ptr = ptr[item];
		    }else {
			if (i < parts.length -1 ){
			    //console.log('cannot get property. unable to traverse object deeper at [\''+item + '\'] ... type is not object (' +Type+')'  ); //+ 'caller='+hashGet.caller
			    return def ;
			}else {
			    //if (prop == 'runEvents')       console.log ('here ' + item);
			    if (ptr[item] === undefined)return def;
			    return ptr[item];
			}

		    }
		}
		return ptr;
	    }else {
		console.log('wasnt able to parse array from prop: '+prop);
		return def;
	    }
	}else {
	    //console.log('e is not an object'+ E + ' prop '+prop);
	    return def;
	}
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

	    var parts = lib.utils.toArray(prop,'.');
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

    /*
      supports destructive assignments and creation of new keys.
      will not work on the dom tree in all cases, b/c certain properties are actually functions, and cannot accept a hash assignment.
      legacySet DOES WORK. b/c it crawls the tree.
    */
    
    function hashSet(rec, prop, value,opts){
	//console.log('value is '+value);
	prop = lib.utils.toArray(prop,'.');
	if (!prop.length)return value;
	if (!lib.utils.baseType(rec, 'object'))rec = {};


	key = prop[0];
	if (prop.length > 1){
	    let nRec = (key in rec)?rec[key]:{}; //  exists($rec->{$tKey})?$rec->{$tKey}:{};
	    if (!lib.utils.baseType(nRec, 'object')) nRec = {};
	    rec[key] = hashSet(nRec, prop.slice(1) ,value,opts); //[@$target[1..$tLen-1]
	}else{
	    rec[key] = value;
	}

	return rec;

	
    }

    function expand(opts, exp){
	
	opts = lib.utils.toHash(opts);
	exp = lib.utils.toArray(exp, " ");
	rv = [];
	for (i in exp){
	    rv.push(opts[exp[i]]);
	}
	return rv;
    }

    function hashAppend(input, pre="",post="",key=0){
	let list , output={};
	if(!lib.hash.is(input))return undefined;

	list = Object.keys(input);
	console.log(list);
	for (let i of list){
	    if (key)    output[pre+i+post]=input[i];
	    else  if (lib.utils.baseType(input[i], ["string","number"])) output[i] = pre+input[i]+post;
	    else output[i]=input[i];


	}
	return output;
    }


    //turns a deep hash/array into a shallow hash
    function flatten(rec, opts){
        let out = {};
        opts =Object.assign({}, {prefix:'', delim:'.',array:"."}, parseStringSimple(opts) || {});
        let prefix = lib.utils.isEmpty(opts.prefix)?"":opts.prefix;

        console.log('prefix is '+prefix);
        if (lib.array.is(rec)){
            //prefix += opts.array||"";
            for (let i in rec){
                if (lib.utils.isScalar(rec[i]))
                    out[prefix+opts.array+i] = rec[i];
                else {
                    let val = flatten(rec[i], Object.assign({},opts, {prefix: prefix+opts.array+i}));
                    out[prefix+opts.array+i] = Object.assign({},out, val);
                }
            }
        }else if (lib.hash.is(rec)){
            prefix += opts.delim||"";
            for (let key in rec){
                console.log(`here ${prefix}${key}`);
                if (lib.utils.isScalar(rec[key]))
                    out[prefix+key] = rec[key];
                else{
                    let val = flatten(rec[key], Object.assign({},opts, {prefix:prefix+key}));
                    out = Object.assign ({}, out, val);
                }

            }
        }else {
            return undefined;
        }
        return out;

    }


    function inflate(rec,config){
        let out = {};
        if(!lib.hash.is(rec))return undefined;
        config =Object.assign({}, {delim:'.'}, parseStringSimple(config) || {});

        for (let key in rec){
	    let tKey = config.delim? key.replaceAll(config.delim,".") : key;
	    lib.hash.set(out, tKey, rec[key]);
        }
        return out;

    }



    //leaving this here unlinked, b/c it is will eventually be replaced with our slackparse functionality.
    function parseStringSimple(str = undefined){
        if (lib.hash.is(str))return str;
        str =lib.utils.toString(str);
        if (lib.utils.isEmpty(str)) return undefined;
        let out = {};
        let parts = str.split(";");

        for (p of parts){
	    p = p.trim();
	    let pc = p.indexOf(":"), pe= p.indexOf("=");
	    //console.log('line: '+p + ' PC ' +pc + ' pe ' +pe);
	    if (pc < 1 &&  pe < 1)
                continue;
	    let subdelim = pc==-1?"=":pe==-1?":":(pc < pe)?":":"=";
	    //console.log('subdelim '+subdelim);
	    let [key, value] = p.split(subdelim, 2);
	    //console.log(key,value);
	    out[key.trim()] = value.trim();
        }
        return out;
    }
    
    var disp = {
	get: hashGet,
	set: hashSet,
	legacySet: legacySet,
	expand: expand,
	to : lib.utils.toHash,
	is : lib.utils.isHash,
	append:hashAppend,
	merge:merge,
	flatten: flatten,
	inflate: inflate
    };

    return disp;
    

}
export default install;
