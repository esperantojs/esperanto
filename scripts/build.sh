# If the tests fail, abort (errexit)
set -e

# This command builds the library from source, and
# runs all the tests
mocha

# If the tests pass, we just need to copy
# test/lib/esperanto.js to the root
cp test/lib/esperanto.js esperanto.js

# Copy all dist files, including sourcemaps
cp test/lib/* dist
