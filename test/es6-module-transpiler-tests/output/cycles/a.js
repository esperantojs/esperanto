(function () {

  'use strict';

  exports.getb = getb;
  
  var b = require('./b');
  
  /* jshint esnext:true */
  
  function getb() {
    return b.b;
  }
  
  var a = 1;
  
  exports.a = a;

}).call(global);