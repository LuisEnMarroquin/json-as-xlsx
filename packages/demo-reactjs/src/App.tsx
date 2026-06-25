import xlsx, { IJsonSheet } from "json-as-xlsx"
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

const styledData: IJsonSheet[] = [
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
      {
        label: "Website",
        value: "website",
        format: "hyperlink",
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
        website: "https://example.com/ada",
      },
      {
        name: "Grace Hopper",
        salary: 6200,
        website: "https://example.com/grace",
      },
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

const features = ["📑 Multi-sheet", "🎨 Cell formatting", "🟦 TypeScript", "🌐 Browser & Node"]

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

        <div className="actions">
          <button className="download" onClick={downloadFile}>
            <DownloadIcon />
            Download example
          </button>
          <button className="download secondary" onClick={downloadStyledFile}>
            <DownloadIcon />
            Download styled
          </button>
        </div>

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
