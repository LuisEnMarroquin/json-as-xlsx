import xlsx, { IJsonSheet, ICellStyle, IStyledCell } from "json-as-xlsx"
import "./App.css"

const data: IJsonSheet[] = [
  {
    sheet: "Employees",
    columns: [
      { label: "Name", value: "name" },
      { label: "Salary", value: "salary", format: "$#,##0.00" },
      { label: "Email", value: (row: any) => row?.contact?.email ?? "" },
    ],
    content: [
      { name: "Ada Lovelace", salary: 5000, contact: { email: "ada@example.com" } },
      { name: "Grace Hopper", salary: 6200, contact: { email: "grace@example.com" } },
    ],
  },
  {
    sheet: "Products",
    columns: [
      { label: "Product", value: "product" },
      { label: "Price", value: "price", format: "$#,##0.00" },
      { label: "Stock", value: "inventory.stock", format: "#,##0" },
    ],
    content: [
      { product: "Keyboard", price: 29.99, inventory: { stock: 1200 } },
      { product: "Monitor", price: 199.5, inventory: { stock: 340 } },
    ],
  },
]

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

const snippet = `import xlsx from "json-as-xlsx"

const data = [{
  sheet: "Employees",
  columns: [
    { label: "Name",   value: "name" },
    { label: "Salary", value: "salary", format: "$#,##0.00" },
  ],
  content: [
    { name: "Ada Lovelace", salary: 5000 },
    { name: "Grace Hopper", salary: 6200 },
  ],
}]

xlsx(data, { fileName: "MySpreadsheet" })`

const features = ["📑 Multi-sheet", "🧱 Multi-table sheets", "🎨 Cell formatting", "⬜ True blank cells", "🟦 TypeScript", "🌐 Browser & Node"]

// Keep each download action visually distinct: new buttons should get a unique
// color variant and a short label without repeating the "Download" prefix.
const downloadActions = [
  { label: "Example", className: "download example", onClick: "downloadFile" },
  { label: "Styled", className: "download styled", onClick: "downloadStyledFile" },
  { label: "Multi-table", className: "download multiTable", onClick: "downloadMultiTableFile" },
  { label: "Blank cells", className: "download blankCells", onClick: "downloadBlankCellFile" },
] as const

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

function NpmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
    </svg>
  )
}

function App() {
  const downloadFile = () => {
    xlsx(data, { fileName: "MySpreadsheet" })
  }

  const downloadStyledFile = () => {
    xlsx(styledData, { fileName: "StyledSpreadsheet", enableStyles: true })
  }

  const downloadMultiTableFile = () => {
    xlsx(multiTableData, { fileName: "MultiTableSpreadsheet" })
  }

  const downloadBlankCellFile = () => {
    xlsx(blankCellData, { fileName: "BlankCellSpreadsheet", writeEmptyValuesAsBlankCells: true })
  }

  const downloadHandlers = {
    downloadFile,
    downloadStyledFile,
    downloadMultiTableFile,
    downloadBlankCellFile,
  }

  return (
    <div className="page">
      <main className="card">
        <span className="pill">npm i json-as-xlsx</span>

        <h1 className="title">json-as-xlsx</h1>

        <p className="tagline">
          Build an Excel <code>.xlsx</code> file straight from JSON — in the browser or in Node.
        </p>

        <ul className="features">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>

        <section className="downloads" aria-labelledby="downloads-title">
          <h2 id="downloads-title">Downloads</h2>
          <div className="actions">
            {downloadActions.map((action) => (
              <button className={action.className} key={action.label} onClick={downloadHandlers[action.onClick]}>
                <DownloadIcon />
                {action.label}
              </button>
            ))}
          </div>
        </section>

        <pre className="preview">
          <code>{snippet}</code>
        </pre>

        <footer className="links">
          <a href="https://github.com/LuisEnMarroquin/json-as-xlsx" target="_blank" rel="noreferrer">
            <GitHubIcon />
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/json-as-xlsx" target="_blank" rel="noreferrer">
            <NpmIcon />
            npm
          </a>
        </footer>
      </main>
    </div>
  )
}

export default App
