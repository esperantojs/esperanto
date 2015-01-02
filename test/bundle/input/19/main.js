import hasOwnProperty from './hasOwnProperty';

console.log( hasOwnProperty.call({ foo: 'bar' }, 'foo' ) );