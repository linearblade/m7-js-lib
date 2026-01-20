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
