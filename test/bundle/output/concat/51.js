(function (highlight) { 'use strict';

	highlight = 'default' in highlight ? highlight['default'] : highlight;

	var foo = 42;

	highlight( foo );

})(highlight);
