import { a } from 'foo';

a();
(function () {
	var foo = 'bar';
	a();
}())