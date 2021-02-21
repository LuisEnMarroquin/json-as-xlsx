#!/bin/bash

echo Publishing to NPM and creating tag

echo Remember to-do before:
echo - Change package version number
echo - Git add and commit your changes

# Waiting for X seconds
sleep 15

# TypeScript compile and uglify code
npm run compile

# Publish package to npm
npm publish

# Tag the new release
git tag -a -m "Published v1.1.9" v1.1.9

# Push commit and tags
git push --follow-tags
