(function () {

 'use strict';

 exports.nextOdd = nextOdd;
 
 var evens = require('./evens');
 
 /* jshint esnext:true */
 
 function nextOdd(n) {
   return evens.isEven(n) ? n + 1 : n + 2;
 }
 
 /**
  * We go through these gymnastics to eager-bind to isEven. This is done to
  * ensure that both this module and the 'evens' module eagerly use something
  * from the other.
  */
 var isOdd = (function(isEven) {
   return function(n) {
     return !isEven(n);
   };
 })(evens.isEven);
 
 exports.isOdd = isOdd;

}).call(global);