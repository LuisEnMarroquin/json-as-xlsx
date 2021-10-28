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
  columns: IColumn[]
  content: IContent[]
}

export interface ISettings {
  extraLength?: number
  fileName?: string
  writeOptions?: WritingOptions
}
