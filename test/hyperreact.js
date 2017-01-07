import * as hyperreact from "../source/hyperreact.js";
var assert = require("assert");

function isFunction(w) {
	return w && {}.toString.call(w) === "[object Function]";
}

describe("hyperreact", function() {

	describe("zero", function() {
		it("function", function() {
			assert(isFunction(function() {}));
			assert(!isFunction({}));
			assert(!isFunction("[object Function]"));
		});
		it("animate", function() {
			assert(isFunction(hyperreact.animate));
		});
	});
});
