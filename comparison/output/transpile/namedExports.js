"use strict";
Object.defineProperties(exports, {
  default: {get: function() {
      return $__default;
    }},
  later: {get: function() {
      return later;
    }},
  __esModule: {value: true}
});
var asap;
var isNode = typeof process !== "undefined" && {}.toString.call(process) === "[object process]";
if (isNode) {
  asap = process.nextTick;
} else if (typeof setImmediate !== "undefined") {
  asap = setImmediate;
} else {
  asap = setTimeout;
}
var $__default = asap;
var later = isNode ? process.setImmediate : asap;
