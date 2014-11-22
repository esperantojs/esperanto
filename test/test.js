process.chdir( __dirname );

require( './fastMode' )();
require( './strictMode' )();
require( './bundle' )();
require( './sourcemaps' )();
