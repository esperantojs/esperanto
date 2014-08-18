# esperanto

A better way to transpile ES6 modules to AMD and CommonJS:

* Easier - no laborious configuration
* Simpler - doesn't make dangerous assumptions about your project setup
* Smarter - non-destructive source code transformation, no runtime Traceur dependency, and no ES5-only features
* Faster - roughly 10x quicker than the alternatives

## Installation

```bash
npm install esperanto
```

## Usage

```js
var fs = require( 'fs' );
var esperanto = require( 'esperanto' );

fs.readFile( 'path/to/es6/modules/foo.js', function ( err, result ) {
  if ( err ) throw err;

  fs.writeFile( 'path/to/amd/output/foo.js', esperanto.toAmd( result.toString() ) );
  fs.writeFile( 'path/to/cjs/output/foo.js', esperanto.toCjs( result.toString() ) );
});
```

See the [wiki](https://github.com/Rich-Harris/esperanto/wiki) for other options.


## Why not use existing module transpilers?

There are already a couple of ES6 module transpilers. Let's consider our example from above...

```js
import foo from 'foo';
var bar = foo.toUpperCase();
export default bar;
```

...and see how those transpilers fare.


### [bitovi/transpile](https://github.com/bitovi/transpile)

```js
var transpile = require( 'transpile' );

var transpiled = transpile.to({
  name: 'test',
  source: test, // the contents of the module
  metadata: { format: 'es6' }
}, 'amd' );
```

Pretty easy - we just tell it what input and output formats to use, and off it goes. It's a bit of a shame that you have to specify a `name` property, since AMD best practice is to use anonymous modules, but never mind. What does the result look like?

```js
define('sample', ['foo'], function ($__0) {
  'use strict';
  if (!$__0 || !$__0.__esModule)
    $__0 = { 'default': $__0 };
  var foo = $traceurRuntime.assertObject($__0).default;
  var bar = foo.toUpperCase();
  var $__default = bar;
  return {
    get default() {
      return $__default;
    },
    __esModule: true
  };
});
```

Wait, I'm supposed to use Traceur in production? No thanks! Oh, and I still need to support IE8, so that `get default()` is a no-go.


###  [esnext/es6-module-transpiler](https://github.com/esnext/es6-module-transpiler)

```js
var transpiler = require( 'es6-module-transpiler' );
var Container = transpiler.Container;
var FileResolver = transpiler.FileResolver;
var BundleFormatter = transpiler.formatters.bundle;
var AmdFormatter = require( 'es6-module-transpiler-amd-formatter' );

var container = new Container({
  resolvers: [new FileResolver(['./'])],
  formatter: new AmdFormatter()
});

container.getModule('test');
container.write('output/test.js');
```

This time, rather than passing in a string, we have to point the transpiler to the files on disk. That's because it actually follows the dependency graph of your modules, so that it can (if you're not using the [AMD formatter](https://github.com/caridy/es6-module-transpiler-amd-formatter)) bundle up your source code into a single file. If it can't find a module, it errors out - so as far as I can tell, it's impossible to use es6-module-transpiler if you have external dependencies (e.g. in a `bower_components` folder) that aren't packaged as ES6 modules.

Leaving aside that minor problem, what does the result look like?

```js
define("test", ["foo", "exports"], function(foo$$, __exports__) {
  "use strict";

  function __es6_export__(name, value) {
    __exports__[name] = value;
  }

  var foo;
  foo = foo$$["default"];
  var bar = foo.toUpperCase();
  __es6_export__("default", bar);
});

//# sourceMappingURL=es6-module-transpiler.js.map
```

Better, certainly, and you get source maps. Though as with [transpile](https://github.com/bitovi/transpile), you're stuck with named (as opposed to anonymous) AMD modules. Frankly, though, the external dependencies thing is a dealbreaker for me.


### esperanto

Here's the code to generate AMD output:

```js
var transpiled = esperanto.toAmd( test );
```

And here's the output:

```js
define(['foo','exports'], function (__imports_0,exports) {

var foo = __imports_0.default;
var bar = foo.toUpperCase();
exports.default = bar;

});
```

If we run it in `defaultOnly` mode...

```js
var transpiled = esperanto.toAmd( test, { defaultOnly: true });
```

```js
define(['foo'],function (foo) {

  'use strict';

  var bar = foo.toUpperCase();
  return bar;

});
```

No muss, no fuss. Oh, and did I mention that it's an order of magnitude faster than the alternatives?


## Still to-do

* Command line mode
* Source maps... maybe
* Allow named modules, if you're into that


## Credits

Many thanks to [Marijn Haverbeke](http://marijnhaverbeke.nl/) for [Acorn](https://github.com/marijnh/acorn), which does all the heavy lifting.


## License

Copyright 2014 Rich Harris. MIT Licensed.
