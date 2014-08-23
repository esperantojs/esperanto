// example from http://jsmodules.io
import { later } from "asap";

later(function() {
  console.log("Running after other network events");
});
