# json-as-xlsx

This is a tool that helps to build an excel from a json and it depends only on `xlsx`

You can see a live example of how it works on this site: [luisenmarroquin.github.io/json-as-xlsx](https://luisenmarroquin.github.io/json-as-xlsx)

## Usage

Just import and use it

```js
var xlsx = require('json-as-xlsx')

var columns = [
  { label: 'Email', value: 'email' }, // Top level data
  { label: 'Age', value: row => (row.age + ' years') }, // Run functions
  { label: 'Password', value: row => (row.hidden ? row.hidden.password : '') }, // Deep props
]

var content = [
  { email: 'Ana', age: 16, hidden: { password: '11111111' } },
  { email: 'Luis', age: 19, hidden: { password: '12345678' } }
]

var settings = {
  sheetName: 'First sheet',
  fileName: 'Users',
  extraLength: 3 // Expands the sizes of the columns
}

var download = true // If true will download the xlsx file, otherwise will return a buffer

xlsx(columns, content, settings, download) // Will download the excel file
```

## Examples

* Frontend with [Vue here](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/master/src/App.vue)
* Backend with [Express here](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/master/server.js)

<!--

## Testing Vue

Install dependencies
```shell
yarn install
```

Compile and hot-reload for development
```shell
yarn start
```

Compile and minify for production
```shell
yarn build
```

## Publish to NPM

Will publish the following files:
* LICENSE
* index.js
* README.md
* package.json

```shell
npm login # Login to npm registry
npm publish # Publish package
```

## Create and publish Tag

Remember to change the version number first for all files

```shell
git tag -a -m "Published v1.1.0" v1.1.0 # Tag your release
git push --follow-tags # Push commit and tags
```

-->
