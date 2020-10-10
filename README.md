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
  sheetName: 'First sheet', // The name of the sheet
  fileName: 'Users', // The name of the spreadsheet
  extraLength: 3, // A bigger number means that columns should be wider
  writeOptions: {} // Style options from https://github.com/SheetJS/sheetjs#writing-options
}

var download = true // If true will download the xlsx file, otherwise will return a buffer

xlsx(columns, content, settings, download) // Will download the excel file
```

## Examples

This are my files used for development, remember to change:

`require('./index.js')` and `require('../index.js')` to `require('json-as-xlsx')`

* Frontend with [Vue here](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/main/src/App.vue)
* Backend with [Express here](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/main/server.js)

<!--

## Publish to NPM and create tag

Remember to change version number first

```shell
gac New commit # Git add and commit + message
npm login # Login to npm registry
yarn compile # TypeScript compile and uglify code
npm publish # Publish package to NPM
git tag -a -m "Published v1.1.7" v1.1.7 # Tag your release
git push --follow-tags # Push commit and tags
```

-->
