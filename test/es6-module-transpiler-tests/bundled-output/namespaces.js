(function () {

	'use strict';

	var exporter = {
		get a () { return exporter__a; },
		get b () { return exporter__b; },
		get default () { return exporter__default; }
	};
	
	/* jshint esnext:true */
	
	var exporter__a = 'a';
	var exporter__b = 'b';
	var exporter__default = 'DEF';

  /* jshint esnext:true */
  
  assert.equal(exporter['default'], 'DEF');
  assert.equal(exporter.b, 'b');
  assert.equal(exporter.a, 'a');
  
  var importer__keys = [];
  for (var importer__key in exporter) {
    importer__keys.push(importer__key);
  }
  assert.deepEqual(importer__keys.sort(), ['a', 'b', 'default']);

}).call(global);