(function () {

  'use strict';

  /* jshint esnext:true */

  function foo() {
    return 121;
  }
  assert.equal(foo(), 121);

	/* jshint esnext:true */

	assert.equal(foo(), 121);

}).call(global);