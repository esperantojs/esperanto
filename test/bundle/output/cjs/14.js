'use strict';

var foo = require('external');
foo = ('default' in foo ? foo['default'] : foo);

foo();