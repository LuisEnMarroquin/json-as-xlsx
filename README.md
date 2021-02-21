# json-as-xlsx

This is a tool that helps to build an excel from a json and it depends only on `xlsx`

You can see a live example of how it works on this site: [luisenmarroquin.github.io/json-as-xlsx](https://luisenmarroquin.github.io/json-as-xlsx)

## Usage

Just import and use it

```js
var xlsx = require('json-as-xlsx')

var columns = [
  { label: 'User', value: 'user' }, // Top level data
  { label: 'Age', value: row => (row.age + ' years') }, // Run functions
  { label: 'Phone', value: row => (row.more ? row.more.phone || '' : '') }, // Deep props
]

var content = [
  { user: 'Ana', age: 16, more: { phone: '11111111' } },
  { user: 'Luis', age: 19, more: { phone: '12345678' } }
]

var settings = {
  sheetName: 'FirstSheet', // The name of the sheet
  fileName: 'MySpreadsheet', // The name of the spreadsheet
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
