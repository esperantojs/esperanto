import { hasOwnProperty } from './objectUtils';

export default function () {
	console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );
}