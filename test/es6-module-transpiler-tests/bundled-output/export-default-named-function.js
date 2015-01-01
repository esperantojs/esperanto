(function () {

  'use strict';

  function foo() {
    return 1;
  }
  var exporter = foo;

  function callsFoo() {
    return foo();
  }

	assert.strictEqual(exporter(), 1);
	assert.strictEqual(callsFoo(), 1);

}).call(global);