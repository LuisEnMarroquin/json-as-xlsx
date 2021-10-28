export interface IColumn {
  label: string
  value: string | Function
}

export interface IData {
  sheet: string
  columns: IColumn[]
  content: any[]
}

export interface ISettings {
  extraLength?: number
  fileName?: string
  writeOptions?: any
}
