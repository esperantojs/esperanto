#!/bin/sh

# build the library
npm run build

# destroy gh-pages on remote, to avoid futzing around
git push origin :gh-pages

# build the demo
( cd demo
	gobble build dist -f
)

git add demo/dist -f
git commit -m 'update demo'
git subtree push --squash --prefix demo/dist origin gh-pages
