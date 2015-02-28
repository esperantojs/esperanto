define(['exports', 'duplicated', 'elsewhere'], function (exports, duplicated, elsewhere) {

	'use strict';

	exports['default'] = function() {
		return [duplicated.something, elsewhere['default']];
	}

});