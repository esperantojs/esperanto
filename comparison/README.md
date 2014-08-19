# ES6 module transpilers comparison

**Parental advisory: benchmarks are nonsense. Do not rely on benchmarks alone to make decisions!**

In particular, this test is unfair to traceur, since it is trying to transpile ES6 language features other than module syntax. Since transpile uses traceur under the hood, the same thing probably applies (in some cases, the output from the two transpilers is identical).

The esnext/es6-module-transpiler project has been excluded as there doesn't seem to be a way to compile code synchronously from a string - instead the filesystem has to get involved, so it would be misleading and unfair to include the results. (It also errors out if it can't follow the dependency graph of your modules, making it very difficult to test.)

Instead, focus on how much nicer, slimmer, and more faithful esperanto's output is. The `output` folder contains the result of transpiling each of the modules in the `input` folder. Note that both transpile and traceur fail to convert certain modules (both fail at `mixedImports.js`, transpile fails at `batchImports.js`).

## Running the tests

Inside this folder, do...

```bash
node index.js
```

to run the tests with esperanto and transpile. To run the tests with traceur, do

```bash
node index.js traceur
```

This is necessary because transpile uses traceur, and you can't have two copies of traceur running simultaneously because it monkey patches stuff, or something.
