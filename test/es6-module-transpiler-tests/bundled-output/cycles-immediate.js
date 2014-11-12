(function () {

 'use strict';

 /* jshint esnext:true */
 
 function odds__nextOdd(n) {
   return evens__isEven(n) ? n + 1 : n + 2;
 }
 
 /**
  * We go through these gymnastics to eager-bind to isEven. This is done to
  * ensure that both this module and the 'evens' module eagerly use something
  * from the other.
  */
 var odds__isOdd = (function(isEven) {
   return function(n) {
     return !isEven(n);
   };
 })(evens__isEven);

 /* jshint esnext:true */
 
 var evens__nextEven = (function() {
   return function(n) {
     var no = odds__nextOdd(n);
     return (no === n + 2) ?
       no - 1 : no;
   };
 })(odds__nextOdd);
 
 function evens__isEven(n) {
   return n % 2 === 0;
 }

 /* jshint esnext:true */
 
 /**
  * The 'evens' and 'odds' modules are configured in such a way that they both
  * have two exported functions: isEven, nextEven, isOdd, and nextOdd. Normally
  * these four functions could be in any order regardless of which depends on
  * which because of JavaScript function hoisting.
  *
  * For the purposes of our test we need to prevent function hoisting, so it has
  * been arranged that two of them will be function expressions assigned to
  * variables. Specifically, isOdd and nextEven both eagerly evaluate their
  * dependencies (i.e. isEven and nextOdd). This allows us to test that exported
  * function declarations are available before what would be a module's
  * "execute" step, per the spec.
  */
 assert.equal(evens__nextEven(1), 2);
 assert.equal(odds__nextOdd(1), 3);
 assert.ok(odds__isOdd(1));
 assert.ok(!odds__isOdd(0));
 assert.ok(evens__isEven(0));
 assert.ok(!evens__isEven(1));

}).call(global);