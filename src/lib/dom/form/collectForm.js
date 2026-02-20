export function make(lib) {
    function inflateCollected(collectedForm) {
	const structured = {};
	for (const [key, val] of collectedForm.parms) {
	    if (!lib.hash.exists(structured, key)) {
		lib.hash.set(structured, key, val);
		continue;
	    }

	    const cur = lib.hash.get(structured, key);
	    if (lib.array.is(cur)) {
		cur.push(val);
		lib.hash.set(structured, key, cur);
	    } else {
		lib.hash.set(structured, key, [cur, val]);
	    }
	}
	return structured;
    }

    function collectForm(trigger,opts={debug:false}){
	let url, parms = [],kv,structured = {};
	opts = lib.hash.to(opts,'debug');
	if(!lib.dom.isDom(trigger) )
	    return undefined;
	
	const  form = trigger.closest('form');
	if (!form)return undefined;
	const collectFiles = lib.bool.yes(opts.file);

	const pushCollected = (element) => {
	    const list = getDomKV(element, { array: true, file: collectFiles });
	    for (const item of list) {
		parms.push([item.key, item.value]);
	    }
	    return list;
	};

	
	//collect the value of the event triggering it . data-e-ignore is deprecated.
	//we want to collect the triggering element , it could be non standard or a button etc.
	const triggerIgnore = trigger.getAttribute('data-e-ignore') || trigger.getAttribute('data-trigger-ignore');
	if ( !lib.bool.yes(triggerIgnore)){
	    pushCollected(trigger);
	}

	for (const element of form.querySelectorAll("input,textarea,select,button")){
	    const ignore = element.getAttribute('data-ignore') ;

	    //ignore buttons b/c you can only trigger with 1 button, so its collected initially.
	    if(
		(trigger == element) ||
		    lib.bool.yes(ignore) ||
		    (!lib.utils.isEmpty(element.type) &&  element.type.match(/button|submit/i) && !lib.bool.no(ignore) ) ||
		    (element.tagName.toLowerCase() =='button' && !lib.bool.no(ignore) )
	    ){
		if(opts?.debug)
		    console.debug('ignoring ',element);
		continue;
	    }
	    const kv = pushCollected(element);
	    if(opts?.debug)
		console.debug('pushing kv from element',kv,element);
	}

	
	return {url:form.getAttribute('action'), method:form.getAttribute('method'), parms:parms,form:form,event:trigger};
    }

    function toJson(input, opts = {}) {
	opts = lib.hash.to(opts, 'inflate');
	const useInflate = !lib.bool.no(opts.inflate);

	const isCollected = (x) => x && x.form && Array.isArray(x.parms);
	const collected = isCollected(input) ? input : collectForm(input, opts);
	if (!collected) return undefined;

	if (useInflate) return inflateCollected(collected);
	return arrayToFlatHash(collected.parms);
    }

    function getDomKV(element, opts = {}){
	let attrV,attrN,key,val;
	opts = lib.hash.to(opts,'array');
	const forceArray = lib.bool.yes(opts.array);
	const collectFiles = lib.bool.yes(opts.file);
	if (!lib.dom.isDom(element) )return undefined;

	// HTML multi-select submits one key/value pair per selected option.
	if (String(element.tagName || '').toLowerCase() === 'select' && element.multiple === true) {
	    attrN = element.getAttribute('data-attr-name') || 'name';
	    key = element.getAttribute(attrN);
	    if (!key) return forceArray ? [] : undefined;

	    const out = [];
	    for (const option of element.options) {
		if (option.selected) out.push({ key, value: option.value });
	    }
	    if (!out.length) return forceArray ? [] : undefined;
	    return out;
	}

	// File inputs require explicit opt-in to collect File objects.
	if (
	    String(element.tagName || '').toLowerCase() === 'input' &&
		String(element.type || '').toLowerCase() === 'file'
	) {
	    attrN = element.getAttribute('data-attr-name') || 'name';
	    key = element.getAttribute(attrN);
	    if (!key) return forceArray ? [] : undefined;
	    if (!collectFiles) return forceArray ? [] : undefined;

	    const files = element.files ? Array.from(element.files) : [];
	    const out = files.map((file) => ({ key, value: file, file: true }));
	    if (!out.length) return forceArray ? [] : undefined;
	    return forceArray ? out : out[0];
	}

	
	//the attribute containing the value of the key/val pair.
	attrV =
	    element.getAttribute('data-collect') ||
	    element.getAttribute('data-attr-value') ||
	    element.getAttribute('data-value') ||
	    'value';
	//backwards compatibility just in case.
	if (attrV.toLowerCase() === 'innerhtml') attrV = 'innerHTML';
	
	//the attribute containing the name of the key/val pair
	attrN = element.getAttribute('data-attr-name') || 'name';

	if  (element.type && ( element.type.match('check') || element.type.match('radio') )){
	    if (element.checked !== true)
		attrV = element.hasAttribute('data-uncheck')
		?'data-uncheck'
		:undefined;
	    
	    if(element.checked==true && !element.hasAttribute(attrV) )
		val = 'on';
	}


	key = element.getAttribute(attrN);
	if(!val)
	    val = attrV && attrV.match(/^(value|textContent|innerHTML)$/)
	    ? element[attrV]
	    : element.getAttribute(attrV);
	
	//console.log(`got k=(${attrN})${key}, v=(${attrV})${val}`);
	if  (element.type && (element.type.match('check') || element.type.match('radio') ) && !val)
	    return forceArray ? [] : undefined;

	if (!key) return forceArray ? [] : undefined;
	const out = { key, value: val };
	return forceArray ? [out] : out;

    }

    function arrayToQS(list, asArray = false) {
	if (!Array.isArray(list)) list = lib.array.to(list);
	const out = [];

	for (const [key, val] of list) {
            if (key == null) continue;
            const encodedKey = encodeURIComponent(key);
            const encodedVal = val != null ? encodeURIComponent(val) : '';
            out.push(`${encodedKey}=${encodedVal}`);
	}

	return asArray ? out : out.join('&');
    }

    function arrayToHash(list) {
	if (!Array.isArray(list)) list = lib.array.to(list);
	const out = {};
	const used = {};
	for (const [key, val] of list) {
            if (key == null) continue;
	    if(!used[key] ){
		used[key] = true;
		lib.hash.set(out, key,val);
	    }else {
		let cur = lib.hash.get(out,key);
		if (!lib.array.is(cur) ){
		    cur = [cur];
		}
		cur.push(val);
		lib.hash.set(out,key,cur);
	    }
	}
	return out;
    }

    function arrayToFlatHash(list) {
	if (!Array.isArray(list)) list = lib.array.to(list);
	const out = {};
	for (const [key, val] of list) {
            if (key == null) continue;
	    if (!(key in out)) {
		out[key] = val;
	    } else if (lib.array.is(out[key])) {
		out[key].push(val);
	    } else {
		out[key] = [out[key], val];
	    }
	}
	return out;
    }

    return {
	collectForm,
	toJson,
	getDomKV,
	arrayToQS,
	arrayToHash,
	arrayToFlatHash,
    };
}

export default make;
