//$SECTION -LIB.DOM

export function install(lib) {
    function getDispatch(){return {};  }
    function isDom(o) {
	return(o instanceof Element);
    }


    function getElement(id){
	if(isDom(id)) return id;
	return document.getElementById(id);
    }

    function byId(id){
	return document.getElementById(id);
    }
    function removeElement( e ) {
	var e = getElement(e);
	if (!e) return undefined;
	e.parentNode.removeChild(e);
	return e;
    }

    function qs() {
	var match,
	    pl     = /\+/g,  // Regex for replacing addition symbol with a space
	    search = /([^&=]+)=?([^&]*)/g,
	    decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
	    query  = window.location.search.substring(1);
	
	urlParams = {};
	while (match = search.exec(query))
	    urlParams[decode(match[1])] = decode(match[2]);
	return;
    }

    function insertAfter(newNode, existingNode) {
	existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
    }

    //todo allow total data set upload later
    function set(e,attr,val){
        if(!(lib.dom.isDom(e) || attr)) return undefined;
	let m;

	if(m = attr.match(/^(set|add|remove|toggle)Class$/i)){
	    let lc = m[1].toLowerCase();
	    let map = {
		'set' : ()=>{e.classList.set(val)},
		'add' : ()=>{e.classList.add(val);},
		'remove' : ()=>{e.classList.remove(val);},
		'toggle' : ()=>{e.classList.remove(val);}
	    };
	    return map[lc]();
	}else if (m = attr.match(/^dataset(\.)?(.*)$/i)){
	    if (m[1]){
		lib.hash.set(e.dataset,m[2]);
		return lib.hash.get(e.dataset,m[2]);
	    }
	    else return undefined;
	}else if (m= attr.match(/^(tagName|value|name|text|textContent|innerHTML|type|href|src|disabled|selected|checked)$/i)){

	    let map= {
		"tagname" : "tagName",
		"value" : "value",
		"name" : "name",
		"text" : "text",
		"textcontent" : "textContent",
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

	    if (m[1].toLowerCase() =='tagname') m[1] = "tagName"; //this probably doesnt work, but may some year in the future.
	    else if (m[1].toLowerCase() =='textcontent') m[1] = "textContent";
	    else if (m[1].toLowerCase() =='innerhtml') m[1] = "innerHTML";
	    else if (m[1].toLowerCase() =='value') m[1] = "value";
	    else if (m[1].toLowerCase() =='type') m[1] = "type";
	    else if (m[1].toLowerCase() =='name') m[1] = "name";
	    else if (m[1].toLowerCase() =='text') m[1] = "text";
	    else if (m[1].toLowerCase() =='href') m[1] = "href";
	    return e[m[1]] = val;
	    
        }else{
	    if(lib.array.to(attr,'.').length>1)	lib.hash.legacySet(e,attr,val);
	    else e.setAttribute(attr,val);
	    return e.getAttribute(attr,val);
        }

    }
    
    //work in progress. collect all the carvout properties , and make it insenstive , fixing for later.
    function get(e,attr){
        if(!lib.dom.isDom(e)) return undefined;
	if(!attr)return e;
	if (m = attr.match(/^dataset(\.)?(.*)$/i)){
	    if (m[1])return lib.hash.get(e.dataset,m[2]);
	    return e.dataset;
	}else if (m= attr.match(/^(tagName|value|name|text|textContent|innerHTML|type)$/)){
	    return e[m[1]];
        }else{
	    return e.getAttribute(attr);
        }
	
        return 1;

    }
    function filterAttributes(e, regex=undefined, opts=undefined){
	opts = lib.hash.to(opts, "strip");
	let list = e.getAttributeNames();
	let out = {};
	for (k of list){
	    if(regex){
		let m = k.match(regex);
		if (!m)continue;
		if(opts.strip){
		    //console.log(m[0],k.indexOf(m[0])+m[0].length);
		    let stripKey = k.substr( k.indexOf(m[0])+m[0].length );
		    //console.log(stripKey);
		    out[stripKey] = e.getAttribute(k);
		    continue;

		}
	    }
	    out[k] =lib.dom.get(e,k);
	}
	return out;

    }
    function parseDataSet(e, config){
        if (!lib.dom.is(e)) return undefined;
        config =Object.assign({}, {out:'cc', delim:'-'}, parseStringSimple(config) || {});
        let prefix = lib.utils.toString(config['prefix']||"",1).trim();
        if (!lib.utils.isEmpty(prefix) && prefix.substr(-1,1) !='-')prefix += "-";
        let rec = filterAttributes(e, new RegExp("^data-"+prefix),1);
        let out = {};
        console.log(rec);
        for (let key in rec){
	    console.log(key);
	    let tKey = config.delim? key.replaceAll(config.delim,".") : key;
	    console.log(tKey + ' ' +rec[key]);
	    lib.hash.set(out, tKey, rec[key]);
        }
        return out;

    }
    
    function getDispatch(){
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
	    filterAttributes
	    
	};
    }
    return getDispatch();


}

export default install;
