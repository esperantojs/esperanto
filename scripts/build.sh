# run tests
mocha

# build the library
gobble build out -f

# empty the dist folder and copy the build
rm -rf dist
mv out/dist dist

# ditto for lib
rm -rf lib
mv out/lib lib

# remove temporary out folder
rm -rf out