import { utils, WorkBook, WorkSheet, write, writeFile, WritingOptions } from "@e965/xlsx"
import { ICellStyle, IStyledCell, isCellStyleObject, mergeCellStyles, patchStyledWorkbook, saveXlsxOutput, toStyledOutput } from "./styles"

export { IBorderStyle, ICellStyle, ICellStyleColor, ICellType, IStyledCell } from "./styles"

export interface IColumn {
  label: string
  value: string | ((value: IContent) => IContentValue)
  cellStyle?: ICellStyle
  format?: string
  headerStyle?: ICellStyle
}

export type IContentValue = string | number | boolean | Date | IContent | IStyledCell | null

export interface IContent {
  [key: string]: IContentValue
}

export interface IJsonSheet {
  sheet?: string
  columns: IColumn[]
  content: IContent[]
}

export interface ISettings {
  enableStyles?: boolean
  extraLength?: number
  fileName?: string
  writeOptions?: WritingOptions
  writeMode?: string
  RTL?: boolean
}

export interface IJsonSheetRow {
  [key: string]: IContentValue
}

export interface IWorksheetColumnWidth {
  width: number
}

export type IWorkbookCallback = (workbook: WorkBook) => void

export { utils, WorkBook, WorkSheet }

export const getContentProperty = (content: IContent, property: string): string | number | boolean | Date | IContent | IStyledCell => {
  const accessContentProperties = (content: IContent, properties: string[]): string | number | boolean | Date | IContent | IStyledCell => {
    const value = content[properties[0]]

    if (properties.length === 1) {
      return value ?? ""
    }

    if (value === undefined || value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" || value instanceof Date) {
      return ""
    }

    return accessContentProperties(value as IContent, properties.slice(1))
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
          case "hyperlink":
            worksheet[ref].l = { Target: worksheet[ref].v }
            break
          default:
            worksheet[ref].z = columnFormat
        }
      }
    }
  }
}

const applyHeaderStyles = (worksheet: WorkSheet, columnIds: string[], headerStyles: Array<ICellStyle | null>) => {
  for (let i = 0; i < columnIds.length; i += 1) {
    const headerStyle = headerStyles[i]

    if (!headerStyle) {
      continue
    }

    const column = utils.decode_col(columnIds[i])
    const ref = utils.encode_cell({ r: 0, c: column })

    if (worksheet[ref]) {
      applyCellStyles(worksheet[ref] as IStyledCell, headerStyle)
    }
  }
}

const applyColumnStyles = (worksheet: WorkSheet, columnIds: string[], columnStyles: Array<ICellStyle | null>) => {
  for (let i = 0; i < columnIds.length; i += 1) {
    const columnStyle = columnStyles[i]

    // Column `format` is applied through `cell.z` (see applyColumnFormat) and the
    // style patcher already merges that into the cell's numFmt, so columns that
    // only have a format and no cellStyle need no extra per-row pass here.
    if (!columnStyle) {
      continue
    }

    const column = utils.decode_col(columnIds[i])
    const range = utils.decode_range(worksheet["!ref"] ?? "")

    // Note: Range.s.r + 1 skips the header row
    for (let row = range.s.r + 1; row <= range.e.r; ++row) {
      const ref = utils.encode_cell({ r: row, c: column })

      if (worksheet[ref]) {
        applyCellStyles(worksheet[ref] as IStyledCell, columnStyle)
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
  if (isStyledCell(object)) {
    return getObjectLength(object.v)
  }
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

  if (settings.enableStyles) {
    const worksheetHeaderStyles = jsonSheet.columns.map((jsonSheetColumn) => jsonSheetColumn.headerStyle ?? null)
    const worksheetColumnStyles = jsonSheet.columns.map((jsonSheetColumn) => jsonSheetColumn.cellStyle ?? null)
    applyHeaderStyles(worksheet, worksheetColumnIds, worksheetHeaderStyles)
    applyColumnStyles(worksheet, worksheetColumnIds, worksheetColumnStyles)
  }

  worksheet["!cols"] = getWorksheetColumnWidths(worksheet, settings.extraLength)

  return worksheet
}

const applyCellStyles = (cell: IStyledCell, ...styles: Array<ICellStyle | undefined>) => {
  const existingStyle = isCellStyleObject(cell.s) ? cell.s : undefined
  const mergedStyle = mergeCellStyles(...styles, existingStyle)

  if (Object.keys(mergedStyle).length > 0) {
    cell.s = mergedStyle
  }
}

const validCellTypes = new Set(["b", "n", "e", "s", "d", "z", "str"])
const styleKeys = new Set(["alignment", "border", "fill", "font", "numFmt"])

const hasStyleKeys = (style: unknown): style is ICellStyle => {
  return isCellStyleObject(style) && Object.keys(style).some((key) => styleKeys.has(key))
}

const isCellLink = (value: unknown): value is IStyledCell["l"] => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && typeof (value as Record<string, unknown>).Target === "string"
}

const isStyledCell = (value: unknown): value is IStyledCell => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const cell = value as Record<string, unknown>

  // `v` alone is too generic, and so are marker names with arbitrary values
  // (`t` is a common "type" field in user data). Only unwrap objects that look
  // like actual worksheet cells with a value plus a valid cell marker.
  return (
    "v" in cell &&
    (validCellTypes.has(String(cell.t)) || hasStyleKeys(cell.s) || typeof cell.z === "string" || isCellLink(cell.l))
  )
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
  // Data-returning modes default to a Buffer when no explicit type is given.
  // SheetJS write() throws on an undefined type, and the styled path would
  // otherwise default differently — keeping a single default makes both paths
  // behave the same for `writeMode: "write"` with no writeOptions.type.
  const writeType = writeOptions.type ?? "buffer"

  if (settings.enableStyles) {
    const bookType = writeOptions.bookType ?? "xlsx"

    if (bookType !== "xlsx") {
      throw new Error("enableStyles only supports the xlsx book type")
    }

    const rawWorkbook = write(workbook, { ...writeOptions, bookType, type: "array" })
    const styledWorkbook = patchStyledWorkbook(workbook, rawWorkbook)

    if (settings.writeMode === "write") {
      return toStyledOutput(styledWorkbook, writeType)
    } else if (settings.writeMode === "writeFile") {
      saveXlsxOutput(styledWorkbook, filename)
      return
    } else if (writeOptions.type === "buffer") {
      return toStyledOutput(styledWorkbook, writeOptions.type)
    } else {
      saveXlsxOutput(styledWorkbook, filename)
      return
    }
  }

  if (settings.writeMode === "write") {
    return write(workbook, { ...writeOptions, type: writeType })
  } else if (settings.writeMode === "writeFile") {
    writeFile(workbook, filename, writeOptions)
    return
  } else if (writeOptions.type === "buffer") {
    return write(workbook, writeOptions)
  } else {
    writeFile(workbook, filename, writeOptions)
    return
  }
}

// Overloads narrow the return type to match how the workbook is requested. Data
// is returned (rather than written to a file) only when writeMode is "write",
// or when writeOptions.type is "buffer" — in those cases the type follows
// writeOptions.type. Every variant still includes `undefined`, because xlsx()
// returns undefined for an empty sheets array and for writeFile/download modes.
// The default overload keeps the historical `Buffer | undefined` so existing
// call sites are unaffected.
//
// TODO (next major, likely v3.0.0): replace these overloads with a single,
// fully accurate return type (e.g. a conditional type over the settings, or a
// plain widened `Buffer | string | ArrayBuffer | undefined`). That is a
// breaking change for TS consumers that rely on today's `Buffer | undefined`,
// so it must wait for a major version bump rather than this minor release.
export function xlsx(jsonSheets: IJsonSheet[], settings: ISettings & { writeMode: "write"; writeOptions: WritingOptions & { type: "array" } }, workbookCallback?: IWorkbookCallback): ArrayBuffer | undefined
export function xlsx(jsonSheets: IJsonSheet[], settings: ISettings & { writeMode: "write"; writeOptions: WritingOptions & { type: "base64" | "binary" | "string" } }, workbookCallback?: IWorkbookCallback): string | undefined
export function xlsx(jsonSheets: IJsonSheet[], settings: ISettings & { writeMode: "write"; writeOptions: WritingOptions & { type: "buffer" } }, workbookCallback?: IWorkbookCallback): Buffer | undefined
export function xlsx(jsonSheets: IJsonSheet[], settings: ISettings & { writeOptions: WritingOptions & { type: "buffer" } }, workbookCallback?: IWorkbookCallback): Buffer | undefined
export function xlsx(jsonSheets: IJsonSheet[], settings?: ISettings, workbookCallback?: IWorkbookCallback): Buffer | undefined
export function xlsx(jsonSheets: IJsonSheet[], settings: ISettings = {}, workbookCallback: IWorkbookCallback = () => {}): Buffer | string | ArrayBuffer | undefined {
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
