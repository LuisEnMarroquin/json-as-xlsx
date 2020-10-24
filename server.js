const { writeFileSync } = require('fs')
const xlsx = require('./index.js')
const express = require('express')
const app = express()
const port = 7070

var columns = [
  { label: 'User', value: 'user' },
  { label: 'Age', value: row => (row.age + ' years') },
  { label: 'Phone', value: row => (row.more ? row.more.phone || '' : '') }
]

var content = [
  { user: 'Ana', age: 16, more: { phone: '11111111' } },
  { user: 'Luis', age: 19, more: { phone: '12345678' } }
]

var settings = {
  sheetName: 'FirstSheet',
  fileName: 'MySpreadsheet'
}

app.get('/', (req, res) => {
  var buffer = xlsx(columns, content, settings, false)
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-disposition': `attachment; filename=${settings.fileName}.xlsx`
  })
  res.end(buffer)
})

app.get('/local', (req, res) => {
  var buffer = xlsx(columns, content, settings, false)
  const homedir = require('os').homedir()
  writeFileSync(`${homedir}/mySheet.xlsx`, buffer)
  res.status(200).send('xd')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
