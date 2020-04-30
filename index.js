const { utils, writeFile } = require('xlsx')

module.exports = (columns, content, settings = {}) => {
  // Where new data will be stored
  let excelContent = []
  // Indexes object
  let indexes = []
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
      obj[el2.label] = val
      howMuchColumns = in2 + 1
    })
    excelContent.push(obj)
  })
  // export json to Worksheet of Excel // only array possible
  let newSheet = utils.json_to_sheet(excelContent)
  // variable filling based on the columns present into the workbook
  {
    let rangeOfColumns = utils.decode_range(newSheet['!ref'])
    for (let C = rangeOfColumns.s.c; C <= rangeOfColumns.e.c; C++) {
      let address = utils.encode_col(C) + '1' // <-- first row, column character C
      indexes.push(address)
    }
  }
  // Cols width array
  newSheet['!cols'] = []
  // Setting cols width
  let whileLoop = 0
  while (whileLoop < howMuchColumns) {
    // setting let xx
    let xx = indexes[whileLoop]
    // No need to set headers, already present
    // // setting headers
    // newSheet[xx].v = columns[whileLoop].label
    // Default width is the header width + 1
    let size = { width: newSheet[xx].v.length + 1 }
    // Setting each col width based on max width element
    for (let keyIndex in newSheet) {
      if (newSheet.hasOwnProperty(keyIndex) && keyIndex.startsWith(xx.slice(0, -1)) && keyIndex.length == xx.length) {
        let consideredElement = newSheet[keyIndex].v
        if (typeof consideredElement === 'number') {
          consideredElement = '' + consideredElement
        }
        if ((typeof consideredElement !== 'undefined') && consideredElement.length >= size.width) {
          size.width = consideredElement.length + 1
        }
      }
    }
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
