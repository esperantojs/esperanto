# build the library
gobble build out -f

# run the tests, pointing to the temp out folder
node test/test.js ../lib/esperanto

# empty the dist folder and copy the build
rm -rf dist
mv out/dist dist

# ditto for lib
rm -rf lib
mv out/lib lib
