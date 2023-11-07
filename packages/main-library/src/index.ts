import { utils, WorkBook, WorkSheet, write, writeFile, WritingOptions } from "@e965/xlsx"

export interface IColumn {
  label: string
  value: string | ((value: IContent) => string | number | boolean | Date | IContent | null)
  format?: string
}

export interface IContent {
  [key: string]: string | number | boolean | Date | IContent | null
}

export interface IJsonSheet {
  sheet?: string
  columns: IColumn[]
  content: IContent[]
}

export interface ISettings {
  extraLength?: number
  fileName?: string
  writeOptions?: WritingOptions
  writeMode?: string
  RTL?: boolean
}

export interface IJsonSheetRow {
  [key: string]: string | number | boolean | Date | IContent | null
}

export interface IWorksheetColumnWidth {
  width: number
}

export type IWorkbookCallback = (workbook: WorkBook) => void

export { utils, WorkBook, WorkSheet }

export const getContentProperty = (content: IContent, property: string): string | number | boolean | Date | IContent => {
  const accessContentProperties = (content: IContent, properties: string[]): string | number | boolean | Date | IContent => {
    const value = content[properties[0]]

    if (properties.length === 1) {
      return value ?? ""
    }

    if (value === undefined || value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" || value instanceof Date) {
      return ""
    }

    return accessContentProperties(value, properties.slice(1))
  }

  const properties = property.split(".")
  return accessContentProperties(content, properties)
}

export const getJsonSheetRow = (content: IContent, columns: IColumn[]): IJsonSheetRow => {
  const jsonSheetRow: IJsonSheetRow = {}
  columns.forEach((column) => {
    if (typeof column.value === "function") {
      jsonSheetRow[column.label] = column.value(content)
    } else {
      jsonSheetRow[column.label] = getContentProperty(content, column.value)
    }
  })
  return jsonSheetRow
}

const applyColumnFormat = (worksheet: WorkSheet, columnIds: string[], columnFormats: Array<string | null>) => {
  for (let i = 0; i < columnIds.length; i += 1) {
    const columnFormat = columnFormats[i]

    // Skip column if it doesn't have a format
    if (!columnFormat) {
      continue
    }

    const column = utils.decode_col(columnIds[i])
    const range = utils.decode_range(worksheet["!ref"] ?? "")

    // Note: Range.s.r + 1 skips the header row
    for (let row = range.s.r + 1; row <= range.e.r; ++row) {
      const ref = utils.encode_cell({ r: row, c: column })

      if (worksheet[ref]) {
        switch (columnFormat) {
            case 'hyperlink':
              worksheet[ref].l = { Target: worksheet[ref].v }
              break;
            default:
              worksheet[ref].z = columnFormat
        }
      }
    }
  }
}

const getWorksheetColumnIds = (worksheet: WorkSheet): string[] => {
  const columnRange = utils.decode_range(worksheet["!ref"] ?? "")

  // Column letters present in the workbook, e.g. A, B, C
  const columnIds: string[] = []
  for (let C = columnRange.s.c; C <= columnRange.e.c; C++) {
    const address = utils.encode_col(C)
    columnIds.push(address)
  }

  return columnIds
}

const getObjectLength = (object: unknown): number => {
  if (typeof object === "string") {
    return Math.max(...object.split("\n").map((string) => string.length))
  }
  if (typeof object === "number") {
    return object.toString().length
  }
  if (typeof object === "boolean") {
    return object ? "true".length : "false".length
  }
  if (object instanceof Date) {
    return object.toString().length
  }
  return 0
}

export const getWorksheetColumnWidths = (worksheet: WorkSheet, extraLength: number = 1): IWorksheetColumnWidth[] => {
  const columnLetters: string[] = getWorksheetColumnIds(worksheet)

  return columnLetters.map((column) => {
    // Cells that belong to this column
    const columnCells: string[] = Object.keys(worksheet).filter((cell) => {
      return cell.replace(/[0-9]/g, "") === column
    })

    const maxWidthCell = columnCells.reduce((maxWidth, cellId) => {
      const cell = worksheet[cellId]

      const cellContentLength: number = getObjectLength(cell.v)

      if (!cell.z) {
        return Math.max(maxWidth, cellContentLength)
      }

      const cellFormatLength: number = cell.z.length

      const largestWidth: number = Math.max(cellContentLength, cellFormatLength)

      return Math.max(maxWidth, largestWidth)
    }, 0)

    return { width: maxWidthCell + extraLength }
  })
}

const getWorksheet = (jsonSheet: IJsonSheet, settings: ISettings): WorkSheet => {
  let jsonSheetRows: IJsonSheetRow[]

  if (jsonSheet.content.length > 0) {
    jsonSheetRows = jsonSheet.content.map((contentItem) => {
      return getJsonSheetRow(contentItem, jsonSheet.columns)
    })
  } else {
    // If there's no content, show only column labels
    jsonSheetRows = jsonSheet.columns.map((column) => ({ [column.label]: "" }))
  }

  const worksheet = utils.json_to_sheet(jsonSheetRows)
  const worksheetColumnIds = getWorksheetColumnIds(worksheet)

  const worksheetColumnFormats = jsonSheet.columns.map((jsonSheetColumn) => jsonSheetColumn.format ?? null)
  applyColumnFormat(worksheet, worksheetColumnIds, worksheetColumnFormats)

  worksheet["!cols"] = getWorksheetColumnWidths(worksheet, settings.extraLength)

  return worksheet
}

const writeWorkbook = (workbook: WorkBook, settings: ISettings = {}): Buffer | undefined => {
  const RTL = Boolean(settings.RTL)
  workbook.Workbook ??= {}
  workbook.Workbook.Views ??= [{}]
  workbook.Workbook.Views.forEach((view) => {
    view.RTL = RTL
  })

  const filename = `${settings.fileName ?? "Spreadsheet"}.xlsx`
  const writeOptions = settings.writeOptions ?? {}

  if (settings.writeMode === "write") {
    return write(workbook, writeOptions)
  } else if (settings.writeMode === "writeFile") {
    return writeFile(workbook, filename, writeOptions)
  } else {
    return writeOptions.type === "buffer" ? write(workbook, writeOptions) : writeFile(workbook, filename, writeOptions)
  }
}

export const xlsx = (jsonSheets: IJsonSheet[], settings: ISettings = {}, workbookCallback: IWorkbookCallback = () => {}): ReturnType<typeof writeWorkbook> => {
  if (jsonSheets.length === 0) return

  const workbook = utils.book_new() // Creating a workbook, this is the name given to an Excel file
  jsonSheets.forEach((actualSheet, actualIndex) => {
    const worksheet = getWorksheet(actualSheet, settings)
    const worksheetName = actualSheet.sheet ?? `Sheet ${actualIndex + 1}`
    utils.book_append_sheet(workbook, worksheet, worksheetName) // Add Worksheet to Workbook
  })

  workbookCallback(workbook)
  return writeWorkbook(workbook, settings)
}

export default xlsx

export const libraryName = "json-as-xlsx"

module.exports = xlsx
module.exports.getContentProperty = getContentProperty
module.exports.getJsonSheetRow = getJsonSheetRow
module.exports.getWorksheetColumnWidths = getWorksheetColumnWidths
module.exports.utils = utils
