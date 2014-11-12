(function () {

  'use strict';

  var exporter = require('./exporter');
  var exporter = require('./exporter');
  
  /* jshint esnext:true */
  
  assert.equal(exporter.default, 42);
  
  exporter.change();
  assert.equal(
    exporter.default,
    42,
    'default export should not be bound'
  );

}).call(global);