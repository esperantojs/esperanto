"use strict";
var asap = $traceurRuntime.assertObject(require("asap")).default;
asap(function() {
  console.log("hello async world!");
});
