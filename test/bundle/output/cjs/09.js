'use strict';

var ExplicitlyNamed = require('external');
ExplicitlyNamed = 'default' in ExplicitlyNamed ? ExplicitlyNamed['default'] : ExplicitlyNamed;

new ExplicitlyNamed();
