export interface IColumn {
  label: string
  value: string | Function
}

export interface IContent {
  [key: string]: string | number | boolean | object
}

export interface IData {
  sheet: string
  columns: IColumn[]
  content: IContent[]
}

export interface ISettings {
  extraLength?: number
  fileName?: string
  writeOptions?: any
}
