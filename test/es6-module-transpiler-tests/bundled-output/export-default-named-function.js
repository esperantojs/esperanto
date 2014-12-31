(function () {

  'use strict';

  function foo() {
    return 1;
  }
  var exporter__default = foo;

  function callsFoo() {
    return foo();
  }

	assert.strictEqual(exporter__default(), 1);
	assert.strictEqual(callsFoo(), 1);

}).call(global);