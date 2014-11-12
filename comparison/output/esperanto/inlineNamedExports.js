(function () {

  'use strict';

  exports.requestAnimationFrame = requestAnimationFrame;
  
  // example from http://jsmodules.io
  
  // exports this function as "requestAnimationFrame"
  function requestAnimationFrame() {
    // cross-browser requestAnimationFrame
  }
  
  // exports document.location as "location"
  var location = document.location;
  
  exports.location = location;

}).call(global);