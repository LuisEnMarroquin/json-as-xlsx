const { utils, writeFile } = require('xlsx')

module.exports = (columns, content, settings = {}) => {
  // Where new data will be stored
  let excelContent = []
  // // Indexes object, add more to it if you have a lot of cols
  // let indexes = [ 'A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1', 'O1', 'P1', 'Q1', 'R1', 'S1', 'T1', 'V1', 'W1', 'X1', 'Y1', 'Z1', 'AA1' ]
  let indexes = [];
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
  let newSheet = utils.json_to_sheet(excelContent);
  //variable filling based on the columns present into the workbook
  {
    let rangeOfColumns = utils.decode_range(newSheet['!ref']);
    for(let C = rangeOfColumns.s.c; C <= rangeOfColumns.e.c; C++) {
      let address = utils.encode_col(C) + "1"; // <-- first row, column character C
      indexes.push(address);
    }
  }
  // Cols width array
  newSheet['!cols'] = []
  // Setting cols width
  let whileLoop = 0
  while (whileLoop < howMuchColumns) {
    // setting let xx
    let xx = indexes[whileLoop];
    //No need to set headers, already present
    // // setting headers
    // newSheet[xx].v = columns[whileLoop].label
    // Default width is the header width + 1
    let size = { width: newSheet[xx].v.length + 1 }
    // Setting each col width based on max width element
    for(let key_index in newSheet){
      if(newSheet.hasOwnProperty(key_index) && key_index.startsWith(xx.slice(0,-1)) && key_index.length == xx.length){
        let considered_element = newSheet[key_index].v;
        if(typeof considered_element == 'number'){
          considered_element = '' + considered_element
        }
        if((typeof considered_element != 'undefined') && considered_element.length >= size.width){
          size.width = considered_element.length + 1
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
