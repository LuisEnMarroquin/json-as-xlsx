// const { utils, writeFile } = require('xlsx')

import utils from 'xlsx/utils'
import writeFile from 'xlsx/writeFile'

module.exports = (columns, content, settings = {}) => {
  // Where new data will be stored
  let excelContent = []
  // Indexes object, add more to it if you have a lot of cols
  let indexes = [ 'A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1', 'O1', 'P1', 'Q1', 'R1', 'S1', 'T1', 'V1', 'W1', 'X1', 'Y1', 'Z1' ]
  // How many cols will be in excel
  let howMuchColumns = 0
  // creating new excel data array
  content.forEach(el1 => {
    let obj = {}
    columns.forEach((el2, in2) => {
      let val = (
        typeof el2.value === 'function'
          ? el2.value(el1)
          : el1[el2.value]
      )
      obj[indexes[in2]] = val
      howMuchColumns = in2 + 1
    })
    excelContent.push(obj)
  })
  // export json to Worksheet of Excel // only array possible
  let newSheet = utils.json_to_sheet(excelContent)
  // Cols width array
  newSheet['!cols'] = []
  // Setting cols width
  let whileLoop = 0
  while (whileLoop < howMuchColumns) {
    // setting let xx
    let xx = indexes[whileLoop]
    // setting headers
    newSheet[xx].v = columns[whileLoop].label
    // Default width is the header width + 1
    let size = { width: newSheet[xx].v.length + 1 }
    // Setting each col width based on max width element
    excelContent.forEach(yy => {
      try {
        if (yy[xx].length > size.width) {
          size.width = yy[xx].length + 1
        }
      } catch (e) { /* console.log(e) */ }
    })
    newSheet['!cols'].push(size)
    whileLoop++
  }
  // A workbook is the name given to an Excel file
  let wb = utils.book_new() // make Workbook of Excel
  // add Worksheet to Workbook // Workbook contains one or more worksheets
  utils.book_append_sheet(wb, newSheet, `${settings.sheetName || 'Sheet 1'}`)
  // export Excel file
  writeFile(wb, `${settings.fileName || 'Spreadsheet'}.xlsx`) // name of the file
}
