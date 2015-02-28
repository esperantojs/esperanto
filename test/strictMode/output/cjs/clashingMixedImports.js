'use strict';

var duplicated = require('duplicated');
var elsewhere = require('elsewhere');

exports['default'] = function() {
	return [duplicated.something, elsewhere['default']];
}