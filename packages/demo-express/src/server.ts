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

const port = 5500

app.listen(port, () => {
  console.log("Your app is listening on port", port)
})
