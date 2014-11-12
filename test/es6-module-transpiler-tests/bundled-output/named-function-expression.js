(function () {

  'use strict';

	var exporter__a = 1;

  var importer__getA = function importer__getA() {
    var a = 2;
    return a;
  };
  
  assert.strictEqual(exporter__a, 1);
  assert.strictEqual(importer__getA(), 2);

}).call(global);