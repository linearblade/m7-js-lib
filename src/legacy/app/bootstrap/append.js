
//$SECTION -LIB.APP.BOOTSTRAP.APPEND
export function make(lib) {

    let mScript= function (item,opts={}){
	var url = lib.utils.linkType(item.url,'relative')?(item.base?item.base:"")+item.url:item.url;
        return lib.dom.create.js(url, item['attrs']);
    };
    let mCss= function (item,opts={}){
	var url = lib.utils.linkType(item.url,'relative')?(item.base?item.base:"")+item.url:item.url;
        return lib.dom.create.css(url, item['attrs']);
    };
    let def = function(item,opts={}){
	//console.log('in default',item);
        return lib.dom.create.element(item.tag, item['attrs'],item.content);
    }
    var disp = {
        script : mScript,
        js : mScript,
        css :  mCss,
	link :  mCss,
        'default': def
    };
    return disp;
}
export default make;
