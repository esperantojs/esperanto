'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;
var _hasOwnProperty = hasOwnProperty;

console.log( _hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );