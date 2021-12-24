# json-as-xlsx

This is a tool that helps to build an excel from a json and it depends only on `xlsx` library

You can see a live example of it working on any of this sites (there are many just in case):

* [xlsx.pages.dev](https://xlsx.pages.dev)
* [xlsx.marroquin.dev](https://xlsx.marroquin.dev)
* [xlsx.luismarroquin.com](https://xlsx.luismarroquin.com)

## Usage

```js
let xlsx = require('json-as-xlsx')

let data = [
  {
    sheet: 'Adults',
    columns: [
      { label: 'User', value: 'user' }, // Top level data
      { label: 'Age', value: row => (row.age + ' years') }, // Run functions
      { label: 'Phone', value: row => (row.more ? row.more.phone || '' : '') }, // Deep props
    ],
    content: [
      { user: 'Andrea', age: 20, more: { phone: '11111111' } },
      { user: 'Luis', age: 21, more: { phone: '12345678' } }
    ]
  }, {
    sheet: 'Children',
    columns: [
      { label: 'User', value: 'user' }, // Top level data
      { label: 'Age', value: row => (row.age + ' years') }, // Run functions
      { label: 'Phone', value: 'user.more.phone' }, // Deep props
    ],
    content: [
      { user: 'Manuel', age: 16, more: { phone: '99999999' } },
      { user: 'Ana', age: 17, more: { phone: '87654321' } }
    ]
  }
]

let settings = {
  fileName: 'MySpreadsheet', // Name of the resulting spreadsheet
  extraLength: 3, // A bigger number means that columns will be wider
  writeOptions: {} // Style options from https://github.com/SheetJS/sheetjs#writing-options
}

xlsx(data, settings) // Will download the excel file
```

## Examples

This are files used for development, please change imports from `../../src/index.js` to `json-as-xlsx`

* [VueJS with JavaScript](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/main/examples/vue-app/App.vue)
* [Express with TypeScript](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/main/examples/express/server.ts)
