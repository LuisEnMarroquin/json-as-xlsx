const { writeFileSync } = require('fs')
const xlsx = require('./index.js')
const express = require('express')
const app = express()
const port = 7070

let data = [
  {
    sheet: 'Adults',
    columns: [
      { label: 'User', value: 'user' }, // Top level data
      { label: 'Age', value: row => (row.age + ' years') }, // Run functions
      { label: 'Phone', value: row => (row.more ? row.more.phone || '' : '') }, // Deep props
    ],
    content: [
      { user: 'Andrea', age: 20, more: { phone: '11111111' } },
      { user: 'Luis', age: 21, more: { phone: '12345678' } }
    ]
  }, {
    sheet: 'Children',
    columns: [
      { label: 'User', value: 'user' }, // Top level data
      { label: 'Age', value: row => (row.age + ' years') }, // Run functions
      { label: 'Phone', value: row => (row.more ? row.more.phone || '' : '') }, // Deep props
    ],
    content: [
      { user: 'Manuel', age: 16, more: { phone: '99999999' } },
      { user: 'Ana', age: 17, more: { phone: '87654321' } }
    ]
  }
]

let settings = {
  writeOptions: {
    type: 'buffer',
    bookType: 'xlsx'
  }
}

app.get('/', (_, res) => {
  let buffer = xlsx(data, settings)
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-disposition': `attachment; filename=MySheet.xlsx`
  })
  res.end(buffer)
})

app.get('/local', (_, res) => {
  let buffer = xlsx(data, settings)
  const homedir = require('os').homedir()
  writeFileSync(`${homedir}/MySheet.xlsx`, buffer)
  res.status(200).send('xd')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
