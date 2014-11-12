(function () {

  'use strict';

  exports.geta = geta;
  
  var a = require('./a');
  
  /* jshint esnext:true */
  
  function geta() {
    return a.a;
  }
  
  var b = 2;
  
  exports.b = b;

}).call(global);