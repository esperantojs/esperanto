'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;

console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );