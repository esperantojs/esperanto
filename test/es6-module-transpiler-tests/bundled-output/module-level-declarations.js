(function () {

  'use strict';

  var mod__a = 1;
  
  assert.equal(mod__a, 1);
  assert.equal(mod__getA(), 1);
  
  function mod__getA() {
    return mod__a;
  }

}).call(global);