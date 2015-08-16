'use strict';

var external = require('external');
external = 'default' in external ? external['default'] : external;

var bar = 'yes';

console.log( external( bar ) );
