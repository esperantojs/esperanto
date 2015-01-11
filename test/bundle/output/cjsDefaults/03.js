'use strict';

var external = require('external');

var bar = 'yes';
var foo = bar;

console.log( external( foo ) );