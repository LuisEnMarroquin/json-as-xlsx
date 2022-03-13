import express from "express"
import xlsx from "../../src/index"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const data: any[] = [
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

const settings: any = {
  writeOptions: {
    type: "buffer",
    bookType: "xlsx",
  },
}

app.get("/", (_: any, res: any) => {
  const buffer = xlsx(data, settings)
  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-disposition": "attachment; filename=MySheet.xlsx",
  })
  res.end(buffer)
})

const port = 3000
app.listen(port, () => {
  console.log(`Your app is listening on port ${port}`)
})
