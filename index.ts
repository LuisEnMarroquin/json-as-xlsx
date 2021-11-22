import { utils, WorkBook, WorkSheet, write, writeFile } from 'xlsx'
import { IColumn, IContent, IJsonSheet, IJsonSheetRow, ISettings, IWorksheetColumnWidth } from './types/index'

function getContentProperty (content: IContent, property: string): string | number | boolean | Date | IContent {
  function accessContentProperties (content: IContent, properties: string[]): string | number | boolean | Date | IContent {
    const value = content[properties[0]]

    if (properties.length === 1) {
      return value ?? ''
    }

    if (value === undefined || typeof value === 'string' || typeof value === 'boolean' ||
      typeof value === 'number' || value instanceof Date) {
      return ''
    }

    return accessContentProperties(value, properties.slice(1))
  }

  const properties = property.split('.')
  return accessContentProperties(content, properties)
}

function getJsonSheetRow (content: IContent, columns: IColumn[]): IJsonSheetRow {
  const jsonSheetRow: IJsonSheetRow = {}
  columns.forEach((column) => {
    if (typeof column.value === 'function') {
      jsonSheetRow[column.label] = column.value(content)
    } else {
      jsonSheetRow[column.label] = getContentProperty(content, column.value)
    }
  })
  return jsonSheetRow
}

function getWorksheetColumnWidths (worksheet: WorkSheet, extraLength: number = 1): IWorksheetColumnWidth[] {
  const columnRange = utils.decode_range(worksheet['!ref'] ?? '')

  // Column letters present in the workbook, e.g. A, B, C
  const columnLetters: string[] = []
  for (let C = columnRange.s.c; C <= columnRange.e.c; C++) {
    const address = utils.encode_col(C)
    columnLetters.push(address)
  }

  return columnLetters.map((column) => {
    // Cells that belong to this column
    const columnCells: string[] = Object.keys(worksheet).filter((cell) => {
      return cell.charAt(0) === column || cell.slice(0, 2) === column
    })

    const maxWidthCell = columnCells.reduce((previousCell, currentCell) => {
      return worksheet[previousCell].v.length > worksheet[currentCell].v.length
        ? previousCell : currentCell
    })

    return { width: worksheet[maxWidthCell].v.length + extraLength }
  })
}

function getWorksheet (jsonSheet: IJsonSheet, settings: ISettings): WorkSheet {
  let jsonSheetRows: IJsonSheetRow[]

  if (jsonSheet.content.length > 0) {
    jsonSheetRows = jsonSheet.content.map((contentItem) => {
      return getJsonSheetRow(contentItem, jsonSheet.columns)
    })
  } else {
    // If there's no content, show only column labels
    jsonSheetRows = jsonSheet.columns.map((column) => ({ [column.label]: '' }))
  }

  const worksheet = utils.json_to_sheet(jsonSheetRows)
  worksheet['!cols'] = getWorksheetColumnWidths(worksheet, settings.extraLength)

  return worksheet
}

function writeWorkbook (workbook: WorkBook, settings: ISettings = {}): Buffer | undefined {
  const filename = `${settings.fileName ?? 'Spreadsheet'}.xlsx`
  const writeOptions = settings.writeOptions ?? {}

  return writeOptions.type === 'buffer' ? write(workbook, writeOptions)
    : writeFile(workbook, filename, writeOptions)
}

function xlsx (jsonSheets: IJsonSheet[], settings: ISettings = {}): Buffer | undefined {
  if (jsonSheets.length === 0) {
    return
  }

  const workbook = utils.book_new() // Creating a workbook, this is the name given to an Excel file
  jsonSheets.forEach((actualSheet, actualIndex) => {
    const worksheet = getWorksheet(actualSheet, settings)
    const worksheetName = actualSheet.sheet ?? `Sheet ${actualIndex + 1}`

    utils.book_append_sheet(workbook, worksheet, worksheetName) // Add Worksheet to Workbook
  })

  return writeWorkbook(workbook, settings)
}

export default xlsx
export { getContentProperty, getJsonSheetRow, getWorksheetColumnWidths }
module.exports = xlsx
module.exports.getContentProperty = getContentProperty
module.exports.getJsonSheetRow = getJsonSheetRow
module.exports.getWorksheetColumnWidths = getWorksheetColumnWidths
