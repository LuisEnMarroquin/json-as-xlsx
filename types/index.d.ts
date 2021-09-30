export interface IColumns {
  label: string
  value: string | Function
}

export interface IData {
  sheet: string
  columns: IColumns[]
  content: any[]
}

export interface ISettings {
  extraLength?: number
  fileName?: string
  writeOptions?: any
}
