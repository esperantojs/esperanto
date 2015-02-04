'use strict';

global.myGlobalFunction = function(){
	return 42;
};

global.sideEffectyOutput = global.myGlobalFunction();

assert.equal(global.sideEffectyOutput, 42);