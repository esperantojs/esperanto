'use strict';

var foo = require('foo');
var bar = require('bar');
var baz = require('baz');

var qux = foo['default']( bar['default']( baz['default'] ) );
exports['default'] = qux;