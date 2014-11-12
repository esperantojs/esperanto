(function () {

  'use strict';

  exports.incr = incr;
  
  /* jshint esnext:true */
  
  var count = 0;
  
  function incr() {
    count++, exports.count = count;
  }
  
  exports.count = count;

}).call(global);