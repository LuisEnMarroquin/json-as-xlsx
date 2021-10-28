import {WritingOptions} from 'xlsx'

export interface IColumn {
  label: string
  value: string | ((value: IContent) => string | number | boolean | object)
}

export interface IContent {
  [key: string]: string | number | boolean | object
}

export interface IJsonSheet {
  sheet: string
  columns: [IColumn, ...IColumn[]]
  content: [IContent, ...IContent[]]
}

export interface ISettings {
  extraLength?: number
  fileName?: string
  writeOptions?: WritingOptions
}

export interface IJsonSheetRow {
  [key: string]: string | number | boolean | object
}

export function xlsx(jsonSheets: IJsonSheet[], settings?: ISettings): Buffer | undefined

export default xlsx
