(function () {

  'use strict';

  /* jshint esnext:true */
  
  function index__foo() {
    /* error: type=Error message="Line 5: Unexpected reserved word" */
    import foo from './index';
  }

}).call(global);