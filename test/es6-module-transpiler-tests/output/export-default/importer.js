(function () {

  'use strict';

  var value = require('./exporter');
  var value = require('./exporter');
  
  /* jshint esnext:true */
  
  assert.equal(value.default, 42);
  
  value.change();
  assert.equal(
    value.default,
    42,
    'default export should not be bound'
  );

}).call(global);