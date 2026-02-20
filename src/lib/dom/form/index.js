import make_collect_form from './collectForm.js';
import make_submit_form from './submit.js';

export function make(lib) {
    const collect = make_collect_form(lib);
    const submit = make_submit_form(lib, {
	collectForm: collect.collectForm,
	arrayToQS: collect.arrayToQS,
	toJson: collect.toJson,
    });

    return {
	submit: submit.submit,
	collect: collect.collectForm,
	collectForm: collect.collectForm,
	toJson: collect.toJson,
	makeUrl: submit.makeUrl,
	makeBody: submit.makeBody,
	makeHeader: submit.makeHeader,
	getDomKV: collect.getDomKV,
	arrayToQS: collect.arrayToQS,
	arrayToHash: collect.arrayToHash,
    };
}

export default make;
