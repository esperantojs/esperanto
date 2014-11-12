(function () {

  'use strict';

  // example from http://jsmodules.io
  var asap;
  var isNode = typeof process !== "undefined" &&
               {}.toString.call(process) === "[object process]";
  
  if (isNode) {
    asap = process.nextTick;
  } else if (typeof setImmediate !== "undefined") {
    asap = setImmediate;
  } else {
    asap = setTimeout;
  }
  
  exports.default = asap;
  var later = isNode ? process.setImmediate : asap;
  
  exports.later = later;

}).call(global);