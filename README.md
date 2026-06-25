# json-as-xlsx

[![npm version](https://img.shields.io/npm/v/json-as-xlsx.svg)](https://www.npmjs.com/package/json-as-xlsx)
[![npm downloads](https://img.shields.io/npm/dm/json-as-xlsx.svg)](https://www.npmjs.com/package/json-as-xlsx)
[![Test suites](https://github.com/LuisEnMarroquin/json-as-xlsx/actions/workflows/tests.yml/badge.svg)](https://github.com/LuisEnMarroquin/json-as-xlsx/actions/workflows/tests.yml)
[![license](https://img.shields.io/npm/l/json-as-xlsx.svg)](LICENSE)

Build an Excel (`.xlsx`) file straight from JSON. It is a thin, typed wrapper
around the SheetJS-compatible [`@e965/xlsx`](https://www.npmjs.com/package/@e965/xlsx)
library, so it works both in the **browser** (downloads the file) and in
**Node.js** (can return a buffer when configured).

You can see a live demo on any of these sites (there are several, just in case):

- [xlsx.pages.dev](https://xlsx.pages.dev)
- [xlsx.marroquin.dev](https://xlsx.marroquin.dev)
- [xlsx.luismarroquin.com](https://xlsx.luismarroquin.com)

## Features

- 📊 Turn an array of JSON sheets into a multi-sheet workbook.
- 🧭 Read deeply nested values (`"more.phone"`) or compute them with a function.
- 🎨 Per-column number, date, currency and hyperlink formatting.
- 📐 Automatic column widths (tunable with `extraLength`).
- ↔️ Right-to-left (RTL) sheet support.
- 🌐 Works in the browser (file download) and in Node.js (buffer output).
- 🟦 Written in TypeScript — ships with type definitions.

## Installation

```shell
npm install json-as-xlsx
# or
yarn add json-as-xlsx
# or
pnpm add json-as-xlsx
```

## Usage

```js
import xlsx from "json-as-xlsx"
// or require
let xlsx = require("json-as-xlsx")

let data = [
  {
    sheet: "Employees",
    columns: [
      { label: "Name", value: "name" }, // Top level data
      { label: "Salary", value: (row) => row.salary + " USD" }, // Custom format
      { label: "Email", value: (row) => (row.contact ? row.contact.email || "" : "") }, // Run functions
    ],
    content: [
      { name: "Ada Lovelace", salary: 5000, contact: { email: "ada@example.com" } },
      { name: "Grace Hopper", salary: 6200, contact: { email: "grace@example.com" } },
    ],
  },
  {
    sheet: "Products",
    columns: [
      { label: "Product", value: "product" }, // Top level data
      { label: "Price", value: "price", format: "$#,##0.00" }, // Column format
      { label: "Stock", value: "inventory.stock", format: "#,##0" }, // Deep props and column format
    ],
    content: [
      { product: "Keyboard", price: 29.99, inventory: { stock: 1200 } },
      { product: "Monitor", price: 199.5, inventory: { stock: 340 } },
    ],
  },
]

let settings = {
  fileName: "MySpreadsheet", // Name of the resulting spreadsheet
  extraLength: 3, // A bigger number means that columns will be wider
  writeMode: "writeFile", // The available parameters are 'writeFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
  writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
  RTL: true, // Display the columns from right-to-left (the default value is false)
}

xlsx(data, settings) // Will download the excel file
```

### Settings

| Option         | Type                  | Default         | Description                                                                                   |
| -------------- | --------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `fileName`     | `string`              | `"Spreadsheet"` | Name of the resulting file (the `.xlsx` extension is added automatically).                     |
| `extraLength`  | `number`              | `1`             | Extra characters added to every auto-calculated column width.                                 |
| `writeMode`    | `"writeFile"`/`"write"` | `"writeFile"` | `"writeFile"` downloads/writes the file; `"write"` returns the raw data (e.g. a Node buffer).  |
| `writeOptions` | `object`              | `{}`            | Passed straight to SheetJS — see [write options](https://docs.sheetjs.com/docs/api/write-options). |
| `RTL`          | `boolean`             | `false`         | Render every sheet right-to-left.                                                             |

### Callback

If you want to inspect or post-process the workbook, pass a `callback` as the
third argument. It receives the generated [`WorkBook`](https://docs.sheetjs.com/docs/csf/book)
**right before** it is written, so you can read or mutate it:

```js
let callback = function (workbook) {
  console.log("Workbook ready:", workbook.SheetNames)
}

xlsx(data, settings, callback) // Will download the excel file
```

### Use in Node.js (server-side)

Set `writeOptions.type` to `"buffer"` (or `writeMode: "write"`) to get the file
contents back instead of writing them to disk. This is handy for sending the
spreadsheet over HTTP:

```js
import xlsx from "json-as-xlsx"

const settings = {
  writeOptions: {
    type: "buffer",
    bookType: "xlsx",
  },
}

app.get("/download", (_, res) => {
  const buffer = xlsx(data, settings)
  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-disposition": "attachment; filename=MySheet.xlsx",
  })
  res.end(buffer)
})
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

#### Hyperlinks

Use the special `"hyperlink"` format to turn a column's text values into
clickable links:

```js
columns: [{ label: "Website", value: "url", format: "hyperlink" }]
```

## TypeScript

The package is written in TypeScript and ships its own type definitions. The
public interfaces are exported for your convenience:

```ts
import xlsx, { IJsonSheet, ISettings, IColumn, IContent } from "json-as-xlsx"

const data: IJsonSheet[] = [
  /* ... */
]
const settings: ISettings = {
  /* ... */
}

xlsx(data, settings)
```

## Examples

These are the files used during development — when copying them, change the
imports from `../../src/index` to `json-as-xlsx`.

- [Express with TypeScript](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/main/packages/demo-express)
- [ReactJS with TypeScript](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/main/packages/demo-reactjs)

## Contributing

Contributions are welcome! Please read the [contributing guide](CONTRIBUTING.md)
and the [code of conduct](CODE_OF_CONDUCT.md) before opening a pull request. To
report a security issue, see the [security policy](SECURITY.md).

## License

[MIT](LICENSE) © [LuisEnMarroquin](https://github.com/LuisEnMarroquin)
