(function () {

  'use strict';

  function exporter__foo() {
    return 1;
  }
  var exporter__default = exporter__foo;
  
  function exporter__callsFoo() {
    return exporter__foo();
  }

	assert.strictEqual(exporter__default(), 1);
	assert.strictEqual(exporter__callsFoo(), 1);

}).call(global);