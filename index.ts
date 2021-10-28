import {utils, WorkBook, WorkSheet, write, writeFile} from 'xlsx'
import {IColumn, IContent, IJsonSheet, IJsonSheetRow, ISettings, IWorksheetColumnWidth} from './types'

function getJsonSheetRow(content: IContent, columns: IColumn[]): IJsonSheetRow {

  let jsonSheetRow: IJsonSheetRow = {}
  columns.forEach((column) => {
    if (typeof column.value === "function") {
      jsonSheetRow[column.label] = column.value(content)
    } else {
      jsonSheetRow[column.label] = content[column.value]
    }
  })
  return jsonSheetRow
}

function getWorksheetColumnWidths(worksheet: WorkSheet, extraLength: number = 1): IWorksheetColumnWidth[] {

  const columnRange = utils.decode_range(worksheet['!ref'] ?? '')

  // Column letters present in the workbook, e.g. A, B, C
  let columnLetters: string[] = []
  for (let C = columnRange.s.c; C <= columnRange.e.c; C++) {
    const address = utils.encode_col(C)
    columnLetters.push(address)
  }

  return columnLetters.map((column) => {

    // Cells that belong to this column
    let columnCells: string[] = Object.keys(worksheet).filter((cell) => {
      return cell.charAt(0) === column
    })

    const maxWidthCell = columnCells.reduce((previousCell, currentCell) => {
      return worksheet[previousCell].v.length > worksheet[currentCell].v.length
        ? previousCell : currentCell
    })

    return {width: worksheet[maxWidthCell].v.length + extraLength}
  })
}

function getWorksheet(jsonSheet: IJsonSheet, settings: ISettings): WorkSheet {

  const jsonSheetRows = jsonSheet.content.map((contentItem) => {
    return getJsonSheetRow(contentItem, jsonSheet.columns)
  })

  const worksheet = utils.json_to_sheet(jsonSheetRows)
  worksheet['!cols'] = getWorksheetColumnWidths(worksheet, settings.extraLength)

  return worksheet
}

function writeWorkbook(workbook: WorkBook, settings: ISettings = {}): Buffer | undefined {

  const filename = `${settings.fileName ?? 'Spreadsheet'}.xlsx`
  const writeOptions = settings.writeOptions ?? {}

  return writeOptions.type === 'buffer' ? write(workbook, writeOptions)
    : writeFile(workbook, filename, writeOptions)
}

function xlsx(data: IJsonSheet[], settings: ISettings = {}): Buffer | undefined {

  if (!data.length) {
    return
  }

  const wb = utils.book_new() // Creating a workbook, this is the name given to an Excel file
  data.forEach((actualSheet, actualIndex) => {
    const newSheet = getWorksheet(actualSheet, settings)
    utils.book_append_sheet(wb, newSheet, `${actualSheet.sheet ?? `Sheet ${actualIndex + 1}`}`) // Add Worksheet to Workbook
  })
  return writeWorkbook(wb, settings)
}

export default xlsx
module.exports = xlsx
