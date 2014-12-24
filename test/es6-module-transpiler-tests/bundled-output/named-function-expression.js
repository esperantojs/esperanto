(function () {

	'use strict';

	var a = 1;

  var getA = function getA() {
    var a = 2;
    return a;
  };

  assert.strictEqual(a, 1);
  assert.strictEqual(getA(), 2);

}).call(global);