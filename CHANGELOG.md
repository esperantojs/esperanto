# changelog

## 0.6.5

* Relative AMD dependency paths can be made absolute with `absolutePaths: true` - requires `amdName` to be specified ([#58](https://github.com/esperantojs/esperanto/issues/58))
* Within a bundle, built-in names like `Math` and `Promise` are avoided ([#70](https://github.com/esperantojs/esperanto/issues/70))
* Bundle imports and exports are reported as `bundle.imports` and `bundle.exports` ([#59](https://github.com/esperantojs/esperanto/issues/59))

## 0.6.4

* Fixes duplicate import bug ([#63](https://github.com/esperantojs/esperanto/issues/63))
* Module names are correctly escaped ([#50](https://github.com/esperantojs/esperanto/issues/50))
* Accessing properties on top-level `this` throws error at parse time
* CLI: if no `--output` option is given, bundle is written to stdout (if no separate sourcemap) ([#60](https://github.com/esperantojs/esperanto/issues/60))
* CLI: Better errors ([#66](https://github.com/esperantojs/esperanto/issues/66))
* Test suite refactor

## 0.6.3

* Support for Windows file paths
* `bundle.concat()` can be called without an options argument
* Options argument passed to `bundle.concat()` can include `intro`, `outro`, `indent` properties which will override defaults (`indent: true` is equivalent to 'automatic', otherwise pass a string)
* Bundle transform function can return an empty string

## 0.6.2

* Implement `bundle.concat()` for self-contained bundles ([#48](https://github.com/esperantojs/esperanto/issues/48))

## 0.6.1

* Fix for ([#45](https://github.com/esperantojs/esperanto/issues/45))
* External modules only have `__default` appended where necessary ([#46](https://github.com/esperantojs/esperanto/issues/46))

## 0.6.0

* UMD export detects CJS environment *before* AMD ([#42](https://github.com/esperantojs/esperanto/issues/42))
* `this` at module top-level is replaced with `undefined`, as per the spec ([#43](https://github.com/esperantojs/esperanto/issues/43))
* More compact CommonJS export
* Bundler transform function receives path as second argument

## 0.5.10

* One-to-one conversions get the same compact UMD form as bundles
* Default imports are not hedged unnecessarily ([#40](https://github.com/esperantojs/esperanto/issues/40))

## 0.5.9

* More concise UMD output ([#36](https://github.com/esperantojs/esperanto/issues/36))

## 0.5.8

* Functions are always exported early ([#37](https://github.com/esperantojs/esperanto/issues/37))
* Modules can be transformed before bundling with `esperanto.bundle({ transform: someFunction })`, where `someFunction` returns either a string, or a promise that resolves to a string

## 0.5.7

* Classes are exported after declaration, not before ([#33](https://github.com/esperantojs/esperanto/issues/33))

## 0.5.6

* Support for named AMD modules, via `amdName` option (works for both standalone and bundle conversions)

## 0.5.5

* No actual changes - just shuffling things about so we can separate demo page into separate repo

## 0.5.4

* Performance improvements and internal refactoring

## 0.5.3

* You can specify a `banner` and/or `footer` option when converting or bundling
* An error will be thrown if a module attempts to import itself

## 0.5.2

* Imported objects (other than namespace imports) can be assigned properties ([#29](https://github.com/esperantojs/esperanto/issues/29))
* Default imports can be exported as named exports from the entry module in a bundle

## 0.5.1

* Identifiers that match object prototype properties are not mistakenly exported (and garbled)

## 0.5.0

* Chained imports/exports are renamed correctly within a bundle ([#17](https://github.com/esperantojs/esperanto/issues/17))
* Bundle exports are written at assignment time, rather than at the end of the bundle with an `Object.defineProperty` hack
* Attempting to import a non-exported identifier within the same bundle throws an error
* External modules are imported correctly ([#28](https://github.com/esperantojs/esperanto/issues/28))
* Identifiers are only rewritten as necessary ([#25](https://github.com/esperantojs/esperanto/issues/25))
* Redundant assignments in a bundle (`mod__default = mod__foo`) are avoided ([#14](https://github.com/esperantojs/esperanto/issues/14))
* Shadowed imports are handled ([#18](https://github.com/esperantojs/esperanto/issues/18))
* Modules are indented consistently within a bundle

## 0.4.10

* Update acorn (greater ES6 coverage) and estraverse dependencies - thanks [@leebyron](https://github.com/leebyron)

## 0.4.9

* Adds `class` support - thanks [@leebyron](https://github.com/leebyron)
* Use `hasOwnProperty` check to prevent garbled output - thanks [@leebyron](https://github.com/leebyron)

## 0.4.8

* `exports['default']` is used in favour of `exports.default`, for the benefit of IE8 - thanks [@evs-chris](https://github.com/evs-chris/)

## 0.4.7

* In standalone conversions, import names are inferred from the source code where possible (batch/default imports), and will avoid naming collisions ([#15](https://github.com/esperantojs/esperanto/issues/15))

## 0.4.6

* Fix missing closing parenthesis on strict mode UMD output

## 0.4.5

* Only print `defaultOnly` deprecation warning once, rather than flooding the console

## 0.4.4

* Parse errors (from acorn) are augmented with file info when bundling

## 0.4.3

* Added CLI files to npm package (oops!)

## 0.4.2

* Sourcemap support for bundles

## 0.4.1

* Command line interface
* Sourcemap support for one-to-one conversions
* Neater UMD exports
* Remove `addUseStrict` option (ES6 modules are always in strict mode)

## 0.4.0

* Started maintaining a changelog
* Complete rewrite!
* Spec-compliance - Esperanto now supports bindings and cycles (only in [strict mode](https://github.com/Rich-Harris/esperanto/wiki/strictMode))
* The `defaultOnly` option has been deprecated - esperanto's standard behaviour is now to import and exports defaults. If you want to use named imports/exports, pass `strict: true` (this basically means that your default export becomes `exports.default` rather than `module.exports`). For more information see the [wiki page on strict mode](https://github.com/Rich-Harris/esperanto/wiki/strictMode)
* UMD output: `esperanto.toUmd(es6source, {name:'myModule'});
* Bundling - see the [wiki page on esperanto.bundle()](https://github.com/Rich-Harris/esperanto/wiki/esperanto-bundle)
