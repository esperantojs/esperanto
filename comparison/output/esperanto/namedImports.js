(function () {

  'use strict';

  var asap = require('asap');
  
  // example from http://jsmodules.io
  asap.later(function() {
    console.log("Running after other network events");
  });

}).call(global);