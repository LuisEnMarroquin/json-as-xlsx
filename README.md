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
- 🧱 Render several tables in the same sheet (opt-in, vertical or horizontal layout).
- 🧭 Read deeply nested values (`"more.phone"`) or compute them with a function.
- 🎨 Per-column number, date, currency and hyperlink formatting.
- 🖌️ Opt-in cell styling for fonts, fills, borders, alignment and number formats.
- 📐 Automatic column widths (tunable with `extraLength`).
- ↔️ Right-to-left (RTL) sheet support.
- 🌐 Works in the browser (file download) and in Node.js (file or buffer output).
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
  enableStyles: false, // Set to true to write cell styles (`s`) into the .xlsx file
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
| `enableStyles` | `boolean`             | `false`         | Write cell style objects into the `.xlsx` file. Only supported with `bookType: "xlsx"`.         |
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
    "Content-Disposition": "attachment; filename=MySheet.xlsx",
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

### Cell Styling

Cell styling is disabled by default to keep the regular export path unchanged.
Set `enableStyles: true` to write style objects into the generated `.xlsx` file.
Styled exports only support XLSX output; if you set `writeOptions.bookType`, keep
it as `"xlsx"`.

You can style headers, full columns, or individual cell values:

```js
let data = [
  {
    sheet: "Styled employees",
    columns: [
      {
        label: "Name",
        value: "name",
        headerStyle: {
          fill: { fgColor: { rgb: "21A366" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
        },
        cellStyle: {
          alignment: { wrapText: true },
        },
      },
      {
        label: "Salary",
        value: "salary",
        format: "$#,##0.00",
        cellStyle: {
          font: { italic: true },
        },
      },
    ],
    content: [
      {
        name: {
          v: "Ada\nLovelace",
          t: "s",
          s: { font: { bold: true, color: { rgb: "FF0000" } } },
        },
        salary: 5000,
      },
    ],
  },
]

xlsx(data, {
  fileName: "StyledSpreadsheet",
  enableStyles: true,
})
```

Supported style groups are `alignment`, `border`, `fill`, `font`, and `numFmt`.
Column `format` values are also preserved as number formats when styles are
enabled.

### Multiple tables per sheet

By default a sheet renders a single table from its `columns` and `content`. To
place **several independent tables in the same sheet**, provide a `tables` array
instead — each entry has its own `columns` and `content` (with the same
formatting and styling options). This is fully opt-in: sheets that don't set
`tables` keep working exactly as before.

```js
let data = [
  {
    sheet: "Quarter summary",
    tablesLayout: "vertical", // "vertical" (default) stacks tables; "horizontal" places them side by side
    tablesGap: 1, // blank rows (vertical) or columns (horizontal) between tables — defaults to 1
    tables: [
      {
        columns: [
          { label: "Product", value: "product" },
          { label: "Revenue", value: "revenue", format: "$#,##0.00" },
        ],
        content: [
          { product: "Keyboard", revenue: 35988 },
          { product: "Monitor", revenue: 67830 },
        ],
      },
      {
        columns: [
          { label: "Team", value: "team" },
          { label: "Expenses", value: "expenses", format: "$#,##0.00" },
        ],
        content: [
          { team: "Engineering", expenses: 42000 },
          { team: "Marketing", expenses: 18500 },
        ],
      },
    ],
  },
]

xlsx(data, { fileName: "MultiTableSpreadsheet" })
```

When `tables` is present and non-empty it takes precedence over the sheet's
top-level `columns`/`content`.

| Sheet option    | Type                         | Default      | Description                                                              |
| --------------- | ---------------------------- | ------------ | ------------------------------------------------------------------------ |
| `tables`        | `{ columns, content }[]`     | —            | Render multiple tables in the sheet. Each table keeps its own formatting. |
| `tablesLayout`  | `"vertical"`/`"horizontal"`  | `"vertical"` | Stack tables top-to-bottom or place them left-to-right.                  |
| `tablesGap`     | `number`                     | `1`          | Blank rows (vertical) or columns (horizontal) left between tables.       |

## TypeScript

The package is written in TypeScript and ships its own type definitions. The
public interfaces are exported for your convenience:

```ts
import xlsx, { IJsonSheet, ISettings, IColumn, IContent, ICellStyle } from "json-as-xlsx"

const data: IJsonSheet[] = [
  /* ... */
]
const settings: ISettings = {
  /* ... */
}

xlsx(data, settings)
```

## Examples

These examples are part of the Yarn workspace and are intended to be installed
and run from the repository root.

- [Express with TypeScript](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/main/packages/demo-express)
- [ReactJS with TypeScript](https://github.com/LuisEnMarroquin/json-as-xlsx/blob/main/packages/demo-reactjs)

## Contributing

Contributions are welcome! Please read the [contributing guide](CONTRIBUTING.md)
and the [code of conduct](CODE_OF_CONDUCT.md) before opening a pull request. To
report a security issue, see the [security policy](SECURITY.md).

## License

[MIT](LICENSE) © [LuisEnMarroquin](https://github.com/LuisEnMarroquin)
