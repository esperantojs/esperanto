#!/bin/sh

# If the tests fail, abort (errexit)
set -e

# This command builds the library from source, and
# runs all the tests
mocha

# If the tests pass, we just need to copy
# all generated files to dist
cp test/lib/* dist
