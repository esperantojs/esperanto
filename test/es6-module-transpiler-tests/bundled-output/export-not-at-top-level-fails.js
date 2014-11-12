(function () {

  'use strict';

  /* jshint esnext:true */
  
  function index__foo() {
    /* error: type=Error message="Line 5: Unexpected reserved word" */
    export { index__foo };
  }

}).call(global);