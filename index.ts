import { utils, write, writeFile } from 'xlsx'
import { IColumn, IData, ISettings } from './types/index'

module.exports = (data: IData[], settings: ISettings = {}) => {
  const extraLength = settings.extraLength === undefined ? 1 : settings.extraLength
  const writeOptions = settings.writeOptions === undefined ? {} : settings.writeOptions
  const wb = utils.book_new() // Creating a workbook, this is the name given to an Excel file
  data.forEach((actualSheet, actualIndex) => {
    const excelContent: any[] = []
    const excelIndexes: string[] = []
    actualSheet.content.forEach((el1: any) => { // creating new excel data array
      const obj: any = {}
      actualSheet.columns.forEach((el2: IColumn) => {
        const val = (typeof el2.value === 'function' ? el2.value(el1) : el1[el2.value]) // If is a function execute it, if not just enter the value
        obj[el2.label] = val
      })
      excelContent.push(obj)
    })
    const newSheet = utils.json_to_sheet(excelContent) // export json to Worksheet of Excel // only array possible
    { // variable filling based on the columns present into the workbook
      const rangeOfColumns = utils.decode_range(newSheet['!ref'] ?? '')
      for (let C = rangeOfColumns.s.c; C <= rangeOfColumns.e.c; C++) {
        const address = utils.encode_col(C) + '1' // first row, column character C
        excelIndexes.push(address)
      }
    }
    newSheet['!cols'] = [] // Cols width array
    excelIndexes.forEach((xx: string) => {
      const size = { width: newSheet[xx].v.length as number + extraLength } // Default width is the header width
      for (const keyIndex in newSheet) { // Setting each col width based on max width element
        if (Object.prototype.hasOwnProperty.call(newSheet, keyIndex) && (xx.charAt(0) === keyIndex.charAt(0)) && keyIndex.length === xx.length) {
          let consideredElement = newSheet[keyIndex].v
          if (typeof consideredElement === 'number') consideredElement = `${consideredElement}`
          if (typeof consideredElement === 'string' && consideredElement.length >= size.width) size.width = consideredElement.length + extraLength
        }
      }
      newSheet['!cols']?.push(size)
    })
    utils.book_append_sheet(wb, newSheet, `${actualSheet.sheet ?? `Sheet ${actualIndex + 1}`}`) // Add Worksheet to Workbook
  })
  return writeOptions.type === 'buffer' ? write(wb, writeOptions) : writeFile(wb, `${settings.fileName ?? 'Spreadsheet'}.xlsx`, writeOptions)
}
