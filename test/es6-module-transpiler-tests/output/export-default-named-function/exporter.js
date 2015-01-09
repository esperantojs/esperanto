'use strict';

exports.callsFoo = callsFoo;

function foo() {
  return 1;
}
exports['default'] = foo;

function callsFoo() {
  return foo();
}