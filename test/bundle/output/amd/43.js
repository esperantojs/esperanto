define(['bar'], function (Bar) {

	'use strict';

	Bar = ('default' in Bar ? Bar['default'] : Bar);

	(function (global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('bar')) :
		typeof define === 'function' && define.amd ? define(['bar'], factory) :
		factory(global.Bar)
	}(this, function (Bar) { 'use strict';

		'use strict';

		var Bar = require('bar');

		define(['bar'], function (Bar) {

			'use strict';

			class Foo extends Bar {
				constructor() {
					super();
					console.log('Foo constructed');
				}
			}

		});

	}));

});