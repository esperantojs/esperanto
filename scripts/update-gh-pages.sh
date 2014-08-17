# build the library
npm run build

# build the demo
( cd demo
	gobble build dist -f
)

git add demo/dist -f
git commit -m 'update demo'
git subtree push --prefix demo/dist origin gh-pages
