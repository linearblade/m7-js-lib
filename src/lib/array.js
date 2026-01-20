export function install(lib){


    function arraySubtract(list, exclude){
	list = lib.utils.toArray(list, /\s+/);
	list = list.slice();
	exclude = lib.utils.toArray(exclude, /\s+/);
	console.log(list,'ex',exclude);
	for (let ex of exclude){
	    let index;
	    while (-1 !== (index = list.indexOf(ex))){
		list.splice(index, 1);
	    }
	}
	return list;

    }


    function arrayAppend(input, pre="",post=""){
	let list , output=[];
	if (!lib.utils.baseType(input, ["array","string","number"])) return undefined;
	input = lib.utils.toArray(input, /\s+/);

	for (let i=0; i<input.length;i++){
	    output[i] = pre+input[i]+post;
	}
	return output;
    }

    function getDispatch(){
	return {
	    append:arrayAppend,
	    subtract: arraySubtract,
	    is : lib.utils.isArray,
	    to : lib.utils.toArray
    	};
    }
    return getDispatch();
}

export default install;
