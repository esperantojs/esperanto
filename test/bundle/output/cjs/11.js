'use strict';

var foo = 1;
var bar = 2;

exports.foo = foo = 3;

exports.bar = bar;

var baz = 4;

exports.baz = baz;

var qux = 5;
exports.qux = qux = 6;