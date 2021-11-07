# json-as-xlsx

This is a tool that helps to build an excel from a json and it depends only on `xlsx`

Now with version **2.0.0** and above supports multiple sheets and custom styling

You can see a live example of how it works on this site: [luisenmarroquin.github.io/json-as-xlsx](https://luisenmarroquin.github.io/json-as-xlsx)

## Usage

Just import and use it

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
  fileName: 'MySpreadsheet', // Name of the spreadsheet
  extraLength: 3, // A bigger number means that columns will be wider
  writeOptions: {} // Style options from https://github.com/SheetJS/sheetjs#writing-options
}

xlsx(data, settings) // Will download the excel file
```

### TypeScript

Here is an example of a server setup using TS, thanks to @elyse0 for the contribution

```ts
import xlsx, { IJsonSheet, ISettings } from 'json-as-xlsx'
import express from 'express'

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const data: IJsonSheet[] = [
  {
    sheet: 'Adults',
    columns: [
      { label: 'User', value: 'user' },
      { label: 'Age', value: 'age' }
    ],
    content: [
      { user: 'Andrea', age: 20, more: { phone: '11111111' } },
      { user: 'Luis', age: 21, more: { phone: '12345678' } }
    ]
  }, {
    sheet: 'Children',
    columns: [
      { label: 'User', value: 'user' },
      { label: 'Age', value: 'age' }
    ],
    content: [
      { user: 'Manuel', age: 16, more: { phone: '99999999' } },
      { user: 'Ana', age: 17, more: { phone: '87654321' } }
    ]
  }
]

const settings: ISettings = {
  writeOptions: {
    type: 'buffer',
    bookType: 'xlsx'
  }
}

app.get('/', (_, res) => {
  const buffer = xlsx(data, settings)
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-disposition': 'attachment; filename=MySheet.xlsx'
  })
  res.end(buffer)
})

const port = process.env.PORT ?? 3000

app.listen(port, () => {
  console.log(`Your app is listening on port ${port}`)
})
```

## Examples

This are my files used for development, remember to change:

`require('./index.js')` and `require('../index.js')` to `require('json-as-xlsx')`

* Frontend with [Vue here](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/main/src/App.vue)
* Backend with [Express here](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/main/server.js)
