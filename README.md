# json-as-xlsx

This is a tool that helps to build an excel from a json and it depends only on `xlsx` library

You can see a live example of it working on any of this sites (there are many just in case):

- [xlsx.pages.dev](https://xlsx.pages.dev)
- [xlsx.marroquin.dev](https://xlsx.marroquin.dev)
- [xlsx.luismarroquin.com](https://xlsx.luismarroquin.com)

## Usage

```js
import xlsx from "json-as-xlsx"
// or require
let xlsx = require("json-as-xlsx")

let data = [
  {
    sheet: "Adults",
    columns: [
      { label: "User", value: "user" }, // Top level data
      { label: "Age", value: (row) => row.age + " years" }, // Custom format
      { label: "Phone", value: (row) => (row.more ? row.more.phone || "" : "") }, // Run functions
    ],
    content: [
      { user: "Andrea", age: 20, more: { phone: "11111111" } },
      { user: "Luis", age: 21, more: { phone: "12345678" } },
    ],
  },
  {
    sheet: "Children",
    columns: [
      { label: "User", value: "user" }, // Top level data
      { label: "Age", value: "age", format: '# "years"' }, // Column format
      { label: "Phone", value: "more.phone", format: "(###) ###-####" }, // Deep props and column format
    ],
    content: [
      { user: "Manuel", age: 16, more: { phone: 9999999900 } },
      { user: "Ana", age: 17, more: { phone: 8765432135 } },
    ],
  },
]

let settings = {
  fileName: "MySpreadsheet", // Name of the resulting spreadsheet
  extraLength: 3, // A bigger number means that columns will be wider
  writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
  writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
  RTL: true, // Display the columns from right-to-left (the default value is false)
}

xlsx(data, settings) // Will download the excel file
```

If you want to trigger something after the file is downloaded, you can use the `callback` parameter:

```js
let callback = function (sheet) {
  console.log("Download complete:", sheet)
}

xlsx(data, settings, callback) // Will download the excel file
```

### Column formatting

> **Note:** Cell formatting is type based, i.e. the format type and value type must match.
>
> If you want to use a Date format, the value must be of type Date; if you want a number format, the value must be a Number.

Column formatting can be provided in the column object, i.e.

```js
columns: [{ label: "Income", value: "income", format: "€#,##0.00" }]
```

- A list of SheetJS format examples can be found
  here: [SSF library](https://github.com/SheetJS/sheetjs/blob/f443aa8475ebf051fc4e888cf0a6c3e5b751813c/bits/10_ssf.js#L42)
- ECMA-376 number formatting
  specification: [Number formats](https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_numFmts_topic_ID0E6KK6.html)

Examples

```js
// Number formats
"$0.00" // Basic
"\£#,##0.00" // Pound
"0%" // Percentage
'#.# "ft"' // Number and text

// Date formats
"d-mmm-yy" // 12-Mar-22
"ddd" // (eg. Sat)
"dddd" // (eg. Saturday)
"h:mm AM/PM" // 1:10 PM
```

## Examples

This are files used for development, please change imports from `../../src/index` to `json-as-xlsx`

- [Express with TypeScript](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/main/packages/demo-express)
- [ReactJS with TypeScript](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/main/packages/demo-reactjs)
