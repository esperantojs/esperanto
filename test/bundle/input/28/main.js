import foo from 'foo';

assert.strictEqual( this, undefined );

var ctx = {};
var arrow = (x => assert.strictEqual( this, undefined ));
var fn = function () { assert.strictEqual( this, ctx ); };

arrow.call(ctx);
fn.call(ctx);

assert.strictEqual(foo(), undefined);
