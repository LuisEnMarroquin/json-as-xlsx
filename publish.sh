#!/bin/bash

printf "\nPublishing to NPM and creating tag \n\n"

echo Remember to-do before:
echo - Change package version number
echo - Git add and commit your changes

# Waiting for X seconds
sleep 10

# TypeScript compile and uglify code
npm run compile

# Publish package to npm
npm publish

# Tag the new release
git tag -a -m "Published v1.2.0" v1.2.0

# Push commit and tags
git push --follow-tags
