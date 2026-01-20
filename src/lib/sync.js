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
