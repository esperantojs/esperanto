'use strict';

var ImplicitlyNamed = require('external');
ImplicitlyNamed = 'default' in ImplicitlyNamed ? ImplicitlyNamed['default'] : ImplicitlyNamed;

new ImplicitlyNamed();
