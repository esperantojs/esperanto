# changelog

## 0.5.3

* You can specify a `banner` and/or `footer` option when converting or bundling
* An error will be thrown if a module attempts to import itself

## 0.5.2

* Imported objects (other than namespace imports) can be assigned properties ([#29](https://github.com/rich-harris/esperanto/issues/29))
* Default imports can be exported as named exports from the entry module in a bundle

## 0.5.1

* Identifiers that match object prototype properties are not mistakenly exported (and garbled)

## 0.5.0

* Chained imports/exports are renamed correctly within a bundle ([#17](https://github.com/rich-harris/esperanto/issues/17))
* Bundle exports are written at assignment time, rather than at the end of the bundle with an `Object.defineProperty` hack
* Attempting to import a non-exported identifier within the same bundle throws an error
* External modules are imported correctly ([#28](https://github.com/rich-harris/esperanto/issues/28))
* Identifiers are only rewritten as necessary ([#25](https://github.com/rich-harris/esperanto/issues/25))
* Redundant assignments in a bundle (`mod__default = mod__foo`) are avoided ([#14](https://github.com/rich-harris/esperanto/issues/14))
* Shadowed imports are handled ([#18](https://github.com/rich-harris/esperanto/issues/18))
* Modules are indented consistently within a bundle

## 0.4.10

* Update acorn (greater ES6 coverage) and estraverse dependencies - thanks [@leebyron](https://github.com/leebyron)

## 0.4.9

* Adds `class` support - thanks [@leebyron](https://github.com/leebyron)
* Use `hasOwnProperty` check to prevent garbled output - thanks [@leebyron](https://github.com/leebyron)

## 0.4.8

* `exports['default']` is used in favour of `exports.default`, for the benefit of IE8 - thanks [@evs-chris](https://github.com/evs-chris/)

## 0.4.7

* In standalone conversions, import names are inferred from the source code where possible (batch/default imports), and will avoid naming collisions ([#15](https://github.com/rich-harris/esperanto/issues/15))

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
