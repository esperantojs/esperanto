# esperanto

An easier way to convert ES6 modules to AMD and CommonJS.

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

Esperanto exposes two methods - `esperanto.toAmd()` and `esperanto.toCjs()`. Both methods take a `source` argument, which is the source code of an ES6 module, and an optional second argument, `options`.

The `options` argument can have a `defaultOnly` property, which defaults to `false`.


## When to use `defaultOnly`

ES6 modules support both *default* and *named* imports and exports:

```js
// default
import foo from 'foo';
var bar = foo.toUpperCase();
export default bar;

// named
import { foo, bar } from 'baz';
var bar = foo.toUpperCase();
export { qux };
```

See [jsmodules.io](http://jsmodules.io/) for an explanation of the difference.

This is a good design, but [it poses problems](https://gist.github.com/domenic/4748675) for developers who want to use ES6 modules with existing codebases. An AMD representation of the first example above might look like this:

```js
define(['foo','exports'], function (__import_1,exports) {
  var foo = __import_1.default;
  var bar = foo.toUpperCase();
  exports.default = bar;
});
```

As long as `foo` is also a transpiled ES6 module with a `default` property (or an AMD module that had a `default` property added by design), that's fine - as far as *this* module is concerned. But if `foo` is an external library, that almost certainly won't be the case.

On the other side of the fence, if someone were to require this ES6 module from within an AMD module, they'd have the same problem in reverse.

Esperanto's `defaultOnly` option solves this problem. As long as you're not using named imports or exports, it will cause modules to behave as you (as a seasoned user of AMD or CommonJS modules) would naturally expect:

```js
define(['foo'],function (foo) {

  'use strict';

  var bar = foo.toUpperCase();
  return bar;

});
```


## Why not use existing module transpilers?

There are already a couple of ES6 module transpilers. But let's consider our example from above:

```js
import foo from 'foo';
var bar = foo.toUpperCase();
export default bar;
```

### [transpile](https://github.com/bitovi/transpile)

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


###  [es6-module-transpiler](https://github.com/esnext/es6-module-transpiler)

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

No muss, no fuss.


## Still to-do

* A proper test suite (if you want to test esperanto, clone this module, `cd` into this folder, `npm install` dependencies, and run `node test.js`. The generated code will be written to the `output` folder)
* Renaming imports (e.g. `import { unlink as rm } from 'fs'`)
* Source maps?
* Allow named modules, if you're into that


## Credits

Many thanks to [Marijn Haverbeke](http://marijnhaverbeke.nl/) for [Acorn](https://github.com/marijnh/acorn), which does all the heavy lifting.


## License

Copyright 2014 Rich Harris. MIT Licensed.
