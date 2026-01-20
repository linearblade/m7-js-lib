
//lib.bool = (function(lib){
export function install(lib){
    function explicitTrue(val){
        type = typeof(val);
        if( (type =='undefined' || val===null) )return 0;
        if (type=='number')return val==1?1:0;
        if (type=='boolean')return val?1:0;
        if (type=='string')return val.match(/^(1|true|yes)$/i)?1:0;
        return 0;
    }
    function explicitFalse(val){
        type = typeof(val);
        if( (type =='undefined' || val===null) )return 0;
        if (type=='number')return val==0?1:0;
        if (type=='boolean')return val?0:1;
        if (type=='string')return val.match(/^(0|false|no)$/i)?1:0;
        return 0;
    }
    return {
	isTrue: explicitTrue,
	isFalse: explicitFalse,
	xTrue: explicitTrue,
	xFalse: explicitFalse
    };
}

export default install;
