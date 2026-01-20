
//lib.json = (function(lib){

export function install(lib){

    //decodes text into obj.
    function decode(text, opts){
	let rec;
	opts = lib.args.parse(arguments,{verbose:1, text:undefined,errSpan:10,err:0}, "text"); 
	try {
	    rec = JSON.parse(opts.text);
        } catch (e) {
	    if ( (opts.verbose || opts.err) && e instanceof SyntaxError) {
		let rem = e.message.substr(e.message.toLowerCase().indexOf("position ") );
		let patt = /position (\d+)/i;
		//e.message.substr(e.message.toLowerCase().indexOf("position ") ).
		let errMsg = `error parsing json ${opts['errText']?['(',opts['errText'],')'].join(''):''}\n`;
                console.error(errMsg, [e.message,rem,text]);
		let pos = 0;
		if (match =  patt.exec( e.message)){
		    if (match.length > 1)
			pos = match[1];
		}
		if (!lib.utils.isEmpty(pos)){
		    //console.log(`textlengh=${text.length}, pos=${pos}`);
		    console.err(text.substr(pos-opts.errSpan>0?pos-opts.errSpan:0, opts.errSpan*2)); //pos+10<text.length?pos+10:undefined
		}
		if(opts.err)
		    throw Error("json decoding error.");
		//text.substr(
	    }
	    rec = undefined;
        }
	return rec;
    }

    //encodes a json string from an object.
    function encode(obj, opts){
	let text;
	opts = lib.args.parse(lib.args.slice(arguments,1),{verbose:1, obj:undefined}, ""); 
	try {
	    text = JSON.stringify(obj);
        } catch (e) {
	    if (opts.verbose && e instanceof SyntaxError) {
                console.log("error encoding json\n", e.message);
	    }
	    text = undefined;
        }
	return text;
    }
    
    var disp = {
	stringify: encode,
	encode: encode,
	decode: decode,
	parse: decode,

    };
    return disp;
    

}
export default install;
