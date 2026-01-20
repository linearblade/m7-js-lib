
//$SECTION -LIB.DOM.APPEND
export function install(lib) {
    var disp = {
	'before' : function(e, target){ target.insertBefore(e, target)  },
	'after' : function(e, target){ lib.dom.insertAfter(e, target)  },
	'prepend' : function(e, target){ target.insertBefore(e, target.childNodes[0])  },
	'append' : function(e, target){ target.appendChild(e) },
	
    };
    return disp;

}
export default install;
