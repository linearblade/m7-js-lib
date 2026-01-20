//$SECTION -LIB.DOM.CREATE

export function install(lib){
    function js(url, attrs){
	if (!lib.utils.isHash(attrs)) attrs = {};
	attrs = lib.utils.merge({
	    'async': true,
	    type: "text/javascript",
	    src: url
	}, attrs);
	return element("script", attrs, undefined);
	
    }
    
    function css(url, attrs){
	if (!lib.utils.isHash(attrs)) attrs = {};
	attrs = lib.utils.merge({
	    rel: "stylesheet",
	    type: "text/css",
	    href: url
	}, attrs);
	return element("link", attrs, undefined);
    }
    
    function element(tag, attrs={}, content=undefined){
	var e =document.createElement(tag);
	//console.log('CREATE ELEMENT ATTRS', attrs);
	if (!this.special){
	    let eventHandler = function (e,key,value){
		let fun = lib.utils.getFunction(value);
		if (fun)e.addEventListener(key, fun ,true);
	    };
	    this.special = {
		load  : eventHandler,
		error : eventHandler,
		click : eventHandler
	    };
	    
	}
	if (!lib.utils.isHash(attrs)) attrs = {};

	for (let key of Object.keys(attrs)){
	    if (this.special[lib.utils.lc(key)]){
		this.special[lib.utils.lc(key)](e,key,attrs[key]);
	    }else {
		e.setAttribute(key, attrs[key]);
	    }
	}
	return e;
    }
    
    function getDispatch(){
	return {
	    css:css,
	    link:css,
	    js:js,
	    element:element
	};
    }
    return getDispatch();


}

export default install;
