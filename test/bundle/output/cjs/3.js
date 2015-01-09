'use strict';

var external = require('external');
var external__default = ('default' in external ? external['default'] : external);

var bar = 'yes';
var foo = bar;

console.log( external__default( foo ) );