"use strict";
var later = $traceurRuntime.assertObject(require("asap")).later;
later(function() {
  console.log("Running after other network events");
});
