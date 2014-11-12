(function () {

  'use strict';

  var asap = require('asap');
  
  // example from http://jsmodules.io
  asap.default(function() {
    console.log("hello async world!");
  });

}).call(global);