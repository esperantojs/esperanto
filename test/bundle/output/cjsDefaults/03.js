'use strict';

var external = require('external');
external = 'default' in external ? external['default'] : external;

var bar = 'yes';
var foo = bar;

console.log( external( foo ) );
