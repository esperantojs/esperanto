"use strict";
var rm = $traceurRuntime.assertObject(require("fs")).unlink;
rm(filename, function(err) {});
