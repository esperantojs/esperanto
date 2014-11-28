# changelog

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
