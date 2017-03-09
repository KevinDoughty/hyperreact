import * as hyperreact from "../source/hyperreact.js";
var assert = require("assert");

import { activate } from "hyperact";

function isFunction(w) {
	return w && {}.toString.call(w) === "[object Function]";
}

describe("hyperreact", function() {

	describe("zero", function() {
		it("function", function() {
			assert.equal(isFunction(function() {}),true);
			assert.equal(!isFunction({}),true);
			assert.equal(!isFunction("[object Function]"),true);
		});
		it("hyperact", function() {
			assert.equal(isFunction(activate),true);
		});
		it("animate", function() {
			assert(isFunction(hyperreact.activateComponent),true);
		});
	});
});
