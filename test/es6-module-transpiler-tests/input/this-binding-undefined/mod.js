/* jshint esnext:true */

assert.strictEqual( this, undefined );

var ctx = {};
var fn = function () { assert.strictEqual( this, ctx ); };
fn.call(ctx);
