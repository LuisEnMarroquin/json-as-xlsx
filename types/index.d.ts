import { WritingOptions } from "xlsx"
import { WorkBook } from 'xlsx/dist/xlsx.mini.min'

export interface IColumn {
  label: string
  value: string | ((value: IContent) => string | number | boolean | Date | IContent)
  format?: string
}

export interface IContent {
  [key: string]: string | number | boolean | Date | IContent
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
}

export interface IJsonSheetRow {
  [key: string]: string | number | boolean | Date | IContent
}

export interface IWorksheetColumnWidth {
  width: number
}

export type IWorkbookCallback = (workbook: WorkBook) => void

export function xlsx(jsonSheets: IJsonSheet[], settings?: ISettings, callback?: IWorkbookCallback): Buffer | undefined

export default xlsx
