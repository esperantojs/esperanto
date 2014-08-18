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

export default asap;
