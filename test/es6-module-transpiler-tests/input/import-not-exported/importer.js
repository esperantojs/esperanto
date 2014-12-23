/* jshint esnext:true */

import { a, b } from './exporter';
assert.equal(a, 1);

// `b` was not exported from "exporter"
assert.equal(typeof b, 'undefined');
