'use strict';

assert.strictEqual( undefined, undefined );

var ctx = {};
var fn = function () { assert.strictEqual( this, ctx ); };
fn.call(ctx);