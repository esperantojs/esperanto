(function () {

  'use strict';

  exports.foo = foo;
  
  /* jshint esnext:true */
  
  function foo() {
    return 121;
  }
  assert.equal(foo(), 121);

}).call(global);