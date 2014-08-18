var __imports_0 = require('foo');
var __imports_1 = require('bar');
var __imports_2 = require('baz');

var foo = __imports_0.default;
var bar = __imports_1.default;
var baz = __imports_2.default;

var qux = foo( bar( baz ) );
exports.default = qux;