const { utils, write, writeFile } = require('xlsx')

interface ISettings {
  extraLength?: number;
  sheetName?: string;
  fileName?: string;
}

module.exports = (columns, content, settings:ISettings = {}, download:boolean = true) => {
  let extraLength = settings.extraLength || 1
  let excelColumns:number = 0
  let excelContent:Array<any> = []
  let excelIndexes:Array<string> = []
  content.forEach(el1 => { // creating new excel data array
    let obj = {}
    columns.forEach((el2, in2) => {
      let val = (typeof el2.value === 'function' ? el2.value(el1) : el1[el2.value]) // If is a function execute it, if not just enter the value
      obj[el2.label] = val
      excelColumns = in2 + 1
    })
    excelContent.push(obj)
  })
  let newSheet = utils.json_to_sheet(excelContent) // export json to Worksheet of Excel // only array possible
  { // variable filling based on the columns present into the workbook
    let rangeOfColumns = utils.decode_range(newSheet['!ref'])
    for (let C = rangeOfColumns.s.c; C <= rangeOfColumns.e.c; C++) {
      let address = utils.encode_col(C) + '1' // first row, column character C
      excelIndexes.push(address)
    }
  }
  newSheet['!cols'] = [] // Cols width array
  let whileLoop:number = 0 // Setting cols width
  while (whileLoop < excelColumns) {
    let xx = excelIndexes[whileLoop]
    let size = { width: newSheet[xx].v.length + extraLength } // Default width is the header width
    for (let keyIndex in newSheet) { // Setting each col width based on max width element
      if (newSheet.hasOwnProperty(keyIndex) && (xx.charAt(0) === keyIndex.charAt(0)) && keyIndex.length === xx.length) {
        let consideredElement = newSheet[keyIndex].v
        if (typeof consideredElement === 'number') consideredElement = '' + consideredElement
        if (consideredElement && consideredElement.length >= size.width) size.width = consideredElement.length + extraLength
      }
    }
    newSheet['!cols'].push(size)
    whileLoop++
  }
  let wb = utils.book_new() // Creating a workbook, this is the name given to an Excel file
  utils.book_append_sheet(wb, newSheet, `${settings.sheetName || 'Sheet 1'}`) // add Worksheet to Workbook // Workbook contains one or more worksheets
  return (download ? writeFile(wb, `${settings.fileName || 'Spreadsheet'}.xlsx`) : write(wb, { type: 'buffer', bookType: 'xlsx' }))
}
