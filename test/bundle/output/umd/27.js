(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}(this, function () { 'use strict';

  var foo = 'this is foo';

  var bar = 'this is bar';

  function logFoo () {
    console.log( foo );
  }

  function logBar () {
    console.log( bar );
  }

}));