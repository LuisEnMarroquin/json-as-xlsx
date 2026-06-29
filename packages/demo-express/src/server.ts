import express from "express"
import { join } from "path"
import xlsx, { IJsonSheet, ISettings, ICellStyle, IStyledCell } from "json-as-xlsx"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const data: IJsonSheet[] = [
  {
    sheet: "Adults",
    columns: [
      { label: "Name", value: "name" },
      { label: "Age", value: "age", format: '# "years"' },
    ],
    content: [
      { name: "Monserrat", age: 21, more: { phone: "11111111" } },
      { name: "Luis", age: 22, more: { phone: "12345678" } },
    ],
  },
  {
    sheet: "Pets",
    columns: [
      { label: "Name", value: "name" },
      { label: "Age", value: "age" },
    ],
    content: [
      { name: "Malteada", age: 4, more: { phone: "99999999" } },
      { name: "Picadillo", age: 1, more: { phone: "87654321" } },
    ],
  },
]

// Kept in parity with the React demo (packages/demo-reactjs/src/App.tsx)

// A thin light-gray border reused on every header and cell
const border: ICellStyle["border"] = {
  top: { style: "thin", color: { rgb: "D5DBE2" } },
  bottom: { style: "thin", color: { rgb: "D5DBE2" } },
  left: { style: "thin", color: { rgb: "D5DBE2" } },
  right: { style: "thin", color: { rgb: "D5DBE2" } },
}

// Dark header: white bold text, centered, on a slate fill
const headerStyle: ICellStyle = {
  fill: { fgColor: { rgb: "1F2937" } },
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
  alignment: { horizontal: "center", vertical: "center" },
  border,
}

// A colored "pill" for the Status column — each value gets its own fill
const badge = (value: string, fill: string, text: string): IStyledCell => ({
  v: value,
  t: "s",
  s: {
    fill: { fgColor: { rgb: fill } },
    font: { bold: true, color: { rgb: text } },
    alignment: { horizontal: "center" },
    border,
  },
})

const styledData: IJsonSheet[] = [
  {
    sheet: "Styled employees",
    columns: [
      {
        label: "Employee",
        value: "name",
        headerStyle,
        cellStyle: { font: { bold: true }, alignment: { horizontal: "left", wrapText: true }, border },
      },
      {
        label: "Department",
        value: "department",
        headerStyle,
        cellStyle: { font: { italic: true, color: { rgb: "475569" } }, alignment: { horizontal: "center" }, border },
      },
      {
        label: "Salary",
        value: "salary",
        format: "$#,##0.00", // number format, mirrored into the cell style
        headerStyle,
        cellStyle: { font: { bold: true, color: { rgb: "166534" } }, alignment: { horizontal: "right" }, border },
      },
      {
        label: "Review",
        value: "review",
        format: "0.0",
        headerStyle,
        cellStyle: { alignment: { horizontal: "center" }, border },
      },
      {
        label: "Status",
        value: "status",
        headerStyle,
        cellStyle: { border }, // per-cell fills come from the badge() values below
      },
    ],
    content: [
      {
        // A single cell can carry its own style via { v, t, s }
        name: { v: "Ada Lovelace", t: "s", s: { font: { bold: true, color: { rgb: "B91C1C" } }, alignment: { horizontal: "left" }, border } },
        department: "Engineering",
        salary: 9200,
        review: 4.9,
        status: badge("Active", "DCFCE7", "166534"),
      },
      {
        name: "Grace Hopper",
        department: "Research",
        salary: 8700,
        review: 4.8,
        status: badge("Remote", "DBEAFE", "1E40AF"),
      },
      {
        name: "Alan Turing",
        department: "Engineering",
        salary: 9100,
        review: 4.7,
        status: badge("On leave", "FEF3C7", "92400E"),
      },
      {
        name: "Katherine Johnson",
        department: "Analytics",
        salary: 8400,
        review: 5.0,
        status: badge("Active", "DCFCE7", "166534"),
      },
      {
        name: "Margaret Hamilton",
        department: "Software",
        salary: 8800,
        review: 4.9,
        status: badge("Remote", "DBEAFE", "1E40AF"),
      },
    ],
  },
]

// Two independent tables living in the same sheet. `tables` opts into the
// multi-table layout; without it a sheet renders a single columns/content table.
// Kept in parity with the React demo (packages/demo-reactjs/src/App.tsx)
const multiTableData: IJsonSheet[] = [
  {
    sheet: "Quarter summary",
    tablesLayout: "vertical", // stack the tables top to bottom (the default)
    tablesGap: 1, // leave one blank row between them
    tables: [
      {
        columns: [
          { label: "Product", value: "product" },
          { label: "Revenue", value: "revenue", format: "$#,##0.00" },
          { label: "Units", value: "units", format: "#,##0" },
        ],
        content: [
          { product: "Keyboard", revenue: 35988, units: 1200 },
          { product: "Monitor", revenue: 67830, units: 340 },
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

// Empty strings, nulls and missing paths can be exported as true blank cells so
// Excel does not count them as text values.
// Kept in parity with the React demo (packages/demo-reactjs/src/App.tsx)
const blankCellData: IJsonSheet[] = [
  {
    sheet: "Sparse data",
    columns: [
      { label: "ID", value: "id" },
      { label: "Name", value: "name" },
      { label: "Email", value: (row: any) => row?.contact?.email ?? "" },
      { label: "Score", value: "score", format: "0.00" },
    ],
    content: [
      { id: "ID-101", name: "Ada Lovelace", contact: { email: "ada@example.com" }, score: 98.5 },
      { id: "ID-102", name: "Grace Hopper", contact: { email: "" } },
      { id: "ID-103", name: "Katherine Johnson", score: null },
      { id: "ID-104", contact: {} },
    ],
  },
]

// Hyperlink columns turn URL strings into clickable links in Excel.
// Kept in parity with the React demo (packages/demo-reactjs/src/App.tsx)
const linkData: IJsonSheet[] = [
  {
    sheet: "Project links",
    columns: [
      { label: "Resource", value: "resource" },
      { label: "URL", value: "url", format: "hyperlink" },
      { label: "Owner", value: "owner" },
    ],
    content: [
      { resource: "GitHub repository", url: "https://github.com/LuisEnMarroquin/json-as-xlsx", owner: "Open source" },
      { resource: "npm package", url: "https://www.npmjs.com/package/json-as-xlsx", owner: "Registry" },
      { resource: "Live demo", url: "https://xlsx.luismarroquin.com", owner: "Cloudflare Pages" },
    ],
  },
]

const settings: ISettings = {
  writeOptions: {
    type: "buffer",
    bookType: "xlsx",
  },
}

app.get("/", (_, res) => {
  res.sendFile(join(__dirname, "index.html"))
})

app.get("/get", (_, res) => {
  const buffer = xlsx(data, settings)
  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-disposition": "attachment; filename=MySheet.xlsx",
  })
  res.end(buffer)
})

app.get("/rtl", (_, res) => {
  const buffer = xlsx(data, {
    ...settings,
    RTL: true,
  })
  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-disposition": "attachment; filename=MySheet-RTL.xlsx",
  })
  res.end(buffer)
})

app.get("/links", (_, res) => {
  const buffer = xlsx(linkData, settings)
  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-disposition": "attachment; filename=MySheet-Links.xlsx",
  })
  res.end(buffer)
})

app.get("/styled", (_, res) => {
  const buffer = xlsx(styledData, {
    ...settings,
    enableStyles: true,
  })
  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-disposition": "attachment; filename=MySheet-Styled.xlsx",
  })
  res.end(buffer)
})

app.get("/multi-table", (_, res) => {
  const buffer = xlsx(multiTableData, settings)
  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-disposition": "attachment; filename=MySheet-MultiTable.xlsx",
  })
  res.end(buffer)
})

app.get("/blank-cells", (_, res) => {
  const buffer = xlsx(blankCellData, {
    ...settings,
    writeEmptyValuesAsBlankCells: true,
  })
  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-disposition": "attachment; filename=MySheet-BlankCells.xlsx",
  })
  res.end(buffer)
})

const port = 5500

app.listen(port, () => {
  console.log("Your app is listening on port", port)
})
