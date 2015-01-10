(function (factory) {
  !(typeof exports === 'object' && typeof module !== 'undefined') &&
  typeof define === 'function' && define.amd ? define(factory) :
  factory()
}(function () { 'use strict';

  var foo = 'this is foo';

  var bar = 'this is bar';

  function logFoo () {
    console.log( foo );
  }

  function logBar () {
    console.log( bar );
  }

}));