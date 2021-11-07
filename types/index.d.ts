import { WritingOptions } from 'xlsx'

export interface IColumn {
  label: string
  value: string | ((value: IContent) => string | number | boolean | Date | IContent)
}

export interface IContent {
  [key: string]: string | number | boolean | Date | IContent
}

export interface IJsonSheet {
  sheet?: string
  columns: [IColumn, ...IColumn[]]
  content: [IContent, ...IContent[]]
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

export function xlsx (jsonSheets: IJsonSheet[], settings?: ISettings): Buffer | undefined

export default xlsx
