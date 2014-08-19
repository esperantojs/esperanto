var __imports_0 = require('asap');

// example from http://jsmodules.io
var later = __imports_0.later;

later(function() {
  console.log("Running after other network events");
});