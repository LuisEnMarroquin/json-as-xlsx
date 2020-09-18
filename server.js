const xlsx = require('./index.js')
const express = require('express')
const app = express()
const port = 7070

app.get('/', (req, res) => {
  var columns = [
    { label: 'Email', value: 'email' },
    { label: 'Age', value: row => (row.age + ' years') },
    { label: 'Password', value: row => (row.hidden ? row.hidden.password : '') }
  ]
  var content = [
    { email: 'Ana', age: 16, hidden: { password: '11111111' } },
    { email: 'Luis', age: 19, hidden: { password: '12345678' } }
  ]
  var settings = {
    sheetName: 'First sheet',
    fileName: 'Users'
  }
  var buffer = xlsx(columns, content, settings, false)
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-disposition': `attachment; filename=${settings.fileName}.xlsx`
  })
  res.end(buffer)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
