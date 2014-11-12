(function () {

  'use strict';

  /* jshint esnext:true */
  
  var value__a = 42;
  
  function value__change() {
    value__a++;
  }
  
  assert.equal(value__a, 42);
  var value__default = value__a;
  
  // Any replacement for the `export default` above needs to happen in the same
  // location. It cannot be done, say, at the end of the file. Otherwise the new
  // value of `a` will be used and will be incorrect.
  value__a = 0;
  assert.equal(value__a, 0);

  /* jshint esnext:true */
  
  assert.equal(value__default, 42);
  
  value__change();
  assert.equal(
    value__default,
    42,
    'default export should not be bound'
  );

}).call(global);