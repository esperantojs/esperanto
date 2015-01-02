import { a as b } from './foo';

b();
(function () {
	var a = 'c';
	b( a );
}());