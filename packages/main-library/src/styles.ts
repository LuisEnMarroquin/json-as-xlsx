import { strFromU8, strToU8, unzipSync, zipSync } from "fflate"

export interface ICellStyleColor {
  rgb?: string
  theme?: number
  tint?: number
  indexed?: string | number
  auto?: boolean
}

export type IBorderStyle =
  | "dashDot"
  | "dashDotDot"
  | "dashed"
  | "dotted"
  | "hair"
  | "medium"
  | "mediumDashDot"
  | "mediumDashDotDot"
  | "mediumDashed"
  | "slantDashDot"
  | "thick"
  | "thin"

export interface ICellStyle {
  alignment?: {
    horizontal?: "left" | "center" | "right"
    vertical?: "top" | "center" | "bottom"
    indent?: number
    readingOrder?: number
    textRotation?: number
    wrapText?: boolean
  }
  border?: {
    top?: { color?: ICellStyleColor; style?: IBorderStyle }
    bottom?: { color?: ICellStyleColor; style?: IBorderStyle }
    left?: { color?: ICellStyleColor; style?: IBorderStyle }
    right?: { color?: ICellStyleColor; style?: IBorderStyle }
    diagonal?: { color?: ICellStyleColor; style?: IBorderStyle; diagonalUp?: boolean; diagonalDown?: boolean }
  }
  fill?: {
    bgColor?: ICellStyleColor
    fgColor?: ICellStyleColor
    patternType?: "solid" | "none" | "gray125"
  }
  font?: {
    bold?: boolean
    color?: ICellStyleColor
    italic?: boolean
    name?: string
    outline?: boolean
    shadow?: boolean
    strike?: boolean
    sz?: number
    underline?: boolean
    vertAlign?: "superscript" | "subscript"
  }
  numFmt?: string | number
}

export type ICellType = "b" | "n" | "e" | "s" | "d" | "z" | "str"

export interface IStyledCell {
  v?: string | number | boolean | Date
  t?: ICellType
  s?: ICellStyle
  z?: string
  l?: {
    Target: string
    Tooltip?: string
  }
}

interface IWorksheetLike {
  [key: string]: unknown
}

interface IWorkbookLike {
  SheetNames: string[]
  Sheets: Record<string, IWorksheetLike>
}

export type IStyledOutput = ArrayBuffer | Buffer | Uint8Array | string

type XmlAttributes = Record<string, string | number | boolean | undefined>

class XmlNode {
  private attributes: XmlAttributes
  private childNodes: XmlNode[]
  private prefixText = ""

  constructor(private tagName: string, attributes: XmlAttributes = {}, children: XmlNode[] = []) {
    this.attributes = attributes
    this.childNodes = children
  }

  append(node: XmlNode): this {
    this.childNodes.push(node)
    return this
  }

  attr(attr: string | XmlAttributes, value?: string | number | boolean): this {
    if (typeof attr === "string") {
      if (value === undefined) {
        delete this.attributes[attr]
      } else {
        this.attributes[attr] = value
      }
      return this
    }

    Object.keys(attr).forEach((key) => {
      const attributeValue = attr[key]
      if (attributeValue !== undefined) {
        this.attributes[key] = attributeValue
      }
    })
    return this
  }

  prefix(prefix: string): this {
    this.prefixText = prefix
    return this
  }

  children(): XmlNode[] {
    return this.childNodes
  }

  toXml(): string {
    const attributes = Object.keys(this.attributes)
      .map((key) => ` ${key}="${escapeXmlAttribute(String(this.attributes[key]))}"`)
      .join("")

    if (this.childNodes.length === 0) {
      return `${this.prefixText}<${this.tagName}${attributes}/>`
    }

    return `${this.prefixText}<${this.tagName}${attributes}>${this.childNodes.map((node) => node.toXml()).join("")}</${this.tagName}>`
  }
}

// Adapted from xlsx-js-style (Apache-2.0), which in turn credits SheetJS,
// sheetjs-style, and sheetjs-style-v2 for the original style-writing approach.
class StyleBuilder {
  private customNumFmtId = 164
  // Full-style dedup, plus per-component dedup so that distinct styles sharing a
  // font/fill/border/numFmt reuse one entry instead of bloating styles.xml.
  private hashIndex = new Map<string, number>()
  private fontHashIndex = new Map<string, number>()
  private fillHashIndex = new Map<string, number>()
  private borderHashIndex = new Map<string, number>()
  private numFmtHashIndex = new Map<string, number>()
  private defaultStyle: ICellStyle
  private fonts = new XmlNode("fonts").attr("count", 0).attr("x14ac:knownFonts", "1")
  private fills = new XmlNode("fills").attr("count", 0)
  private borders = new XmlNode("borders").attr("count", 0)
  private numFmts = new XmlNode("numFmts").attr("count", 0)
  // cellStyleXfs and cellStyles always hold exactly one entry here; emit the
  // matching count="1" so stricter OOXML readers don't reject the file.
  private cellStyleXfs = new XmlNode("cellStyleXfs").attr("count", 1)
  private cellXfs = new XmlNode("cellXfs").attr("count", 0)
  private cellStyles = new XmlNode("cellStyles").attr("count", 1).append(new XmlNode("cellStyle").attr("name", "Normal").attr("xfId", 0).attr("builtinId", 0))
  private dxfs = new XmlNode("dxfs").attr("count", 0)
  private tableStyles = new XmlNode("tableStyles").attr("count", 0).attr("defaultTableStyle", "TableStyleMedium9").attr("defaultPivotStyle", "PivotStyleMedium4")
  private styles = new XmlNode("styleSheet")
    .attr("xmlns:mc", "http://schemas.openxmlformats.org/markup-compatibility/2006")
    .attr("xmlns:x14ac", "http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac")
    .attr("xmlns", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
    .attr("mc:Ignorable", "x14ac")
    .prefix('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')

  constructor(defaultCellStyle: ICellStyle = {}) {
    this.defaultStyle = mergeCellStyles(
      {
        border: {},
        fill: { patternType: "none" },
        font: { name: "Calibri", sz: 11 },
        numFmt: 0,
      },
      defaultCellStyle
    )

    this.styles
      .append(this.numFmts)
      .append(this.fonts)
      .append(this.fills)
      .append(this.borders)
      .append(this.cellStyleXfs.append(new XmlNode("xf").attr("numFmtId", 0).attr("fontId", 0).attr("fillId", 0).attr("borderId", 0)))
      .append(this.cellXfs)
      .append(this.cellStyles)
      .append(this.dxfs)
      .append(this.tableStyles)

    this.addStyle(this.defaultStyle)
    this.addStyle({ ...this.defaultStyle, fill: { patternType: "gray125" } })
  }

  addStyle(style: ICellStyle): number {
    const hashKey = stableStringify(style)
    const existingIndex = this.hashIndex.get(hashKey)

    if (existingIndex !== undefined) {
      return existingIndex
    }

    const index = this.addXf(style)
    this.hashIndex.set(hashKey, index)
    return index
  }

  toXml(): string {
    return this.styles.toXml()
  }

  private addXf(style: ICellStyle): number {
    const fontId = this.addFont(style.font)
    const fillId = this.addFill(style.fill)
    const borderId = this.addBorder(style.border)
    const numFmtId = this.addNumFmt(style.numFmt)

    const xf = new XmlNode("xf").attr("numFmtId", numFmtId).attr("fontId", fontId).attr("fillId", fillId).attr("borderId", borderId).attr("xfId", 0)

    if (fontId > 0) xf.attr("applyFont", 1)
    if (fillId > 0) xf.attr("applyFill", 1)
    if (borderId > 0) xf.attr("applyBorder", 1)
    if (Number(numFmtId) > 0) xf.attr("applyNumberFormat", 1)

    if (style.alignment) {
      const alignment = new XmlNode("alignment")
      Object.keys(style.alignment).forEach((key) => {
        const value = style.alignment?.[key as keyof ICellStyle["alignment"]]
        if (value !== undefined) alignment.attr(key, value)
      })
      xf.append(alignment).attr("applyAlignment", 1)
    }

    this.cellXfs.append(xf).attr("count", this.cellXfs.children().length)
    return this.cellXfs.children().length - 1
  }

  private addFont(font?: ICellStyle["font"]): number {
    if (!font) return 0

    const key = stableStringify(font)
    const cached = this.fontHashIndex.get(key)
    if (cached !== undefined) return cached

    const fontNode = new XmlNode("font")
      .append(new XmlNode("sz").attr("val", font.sz ?? this.defaultStyle.font?.sz ?? 11))
      .append(new XmlNode("name").attr("val", font.name ?? this.defaultStyle.font?.name ?? "Calibri"))

    if (font.bold) fontNode.append(new XmlNode("b"))
    if (font.underline) fontNode.append(new XmlNode("u"))
    if (font.italic) fontNode.append(new XmlNode("i"))
    if (font.strike) fontNode.append(new XmlNode("strike"))
    if (font.outline) fontNode.append(new XmlNode("outline"))
    if (font.shadow) fontNode.append(new XmlNode("shadow"))
    if (font.vertAlign) fontNode.append(new XmlNode("vertAlign").attr("val", font.vertAlign))
    if (font.color) fontNode.append(colorNode("color", font.color, false))

    this.fonts.append(fontNode).attr("count", this.fonts.children().length)
    const id = this.fonts.children().length - 1
    this.fontHashIndex.set(key, id)
    return id
  }

  private addNumFmt(numFmt?: string | number): number {
    if (numFmt === undefined || numFmt === null || numFmt === "") return 0

    if (typeof numFmt === "number") {
      return numFmt
    }

    const builtInId = builtInNumberFormats[numFmt]
    if (builtInId !== undefined) {
      return builtInId
    }

    // A bare integer string with no leading zeros that falls in the built-in id
    // range is treated as a built-in numFmtId. Anything else (e.g. "00000" zip
    // codes, or ids >= 164 which need their own entry) is a custom format code.
    if (/^[1-9][0-9]*$/.test(numFmt) && Number(numFmt) <= 163) {
      return Number(numFmt)
    }

    const cached = this.numFmtHashIndex.get(numFmt)
    if (cached !== undefined) return cached

    const id = ++this.customNumFmtId
    this.numFmts.append(new XmlNode("numFmt").attr("numFmtId", id).attr("formatCode", numFmt)).attr("count", this.numFmts.children().length)
    this.numFmtHashIndex.set(numFmt, id)
    return id
  }

  private addFill(fill?: ICellStyle["fill"]): number {
    if (!fill) return 0

    const key = stableStringify(fill)
    const cached = this.fillHashIndex.get(key)
    if (cached !== undefined) return cached

    const patternFill = new XmlNode("patternFill").attr("patternType", fill.patternType ?? "solid")

    if (fill.fgColor && hasColor(fill.fgColor)) {
      patternFill.append(colorNode("fgColor", fill.fgColor, true))

      if (!fill.bgColor) {
        patternFill.append(new XmlNode("bgColor").attr("indexed", 64))
      }
    }

    if (fill.bgColor && hasColor(fill.bgColor)) {
      patternFill.append(colorNode("bgColor", fill.bgColor, false))
    }

    this.fills.append(new XmlNode("fill").append(patternFill)).attr("count", this.fills.children().length)
    const id = this.fills.children().length - 1
    this.fillHashIndex.set(key, id)
    return id
  }

  private addBorder(border?: ICellStyle["border"]): number {
    if (!border) return 0

    const key = stableStringify(border)
    const cached = this.borderHashIndex.get(key)
    if (cached !== undefined) return cached

    const diagonal = border.diagonal
    const borderNode = new XmlNode("border").attr("diagonalUp", diagonal?.diagonalUp).attr("diagonalDown", diagonal?.diagonalDown)
    ;(["left", "right", "top", "bottom", "diagonal"] as const).forEach((direction) => {
      borderNode.append(borderPartNode(direction, border[direction]))
    })

    this.borders.append(borderNode).attr("count", this.borders.children().length)
    const id = this.borders.children().length - 1
    this.borderHashIndex.set(key, id)
    return id
  }
}

const builtInNumberFormats: Record<string, number> = {
  General: 0,
  "0": 1,
  "0.00": 2,
  "#,##0": 3,
  "#,##0.00": 4,
  "0%": 9,
  "0.00%": 10,
  "0.00E+00": 11,
  "# ?/?": 12,
  "# ??/??": 13,
  "m/d/yy": 14,
  "d-mmm-yy": 15,
  "d-mmm": 16,
  "mmm-yy": 17,
  "h:mm AM/PM": 18,
  "h:mm:ss AM/PM": 19,
  "h:mm": 20,
  "h:mm:ss": 21,
  "m/d/yy h:mm": 22,
  "#,##0 ;(#,##0)": 37,
  "#,##0 ;[Red](#,##0)": 38,
  "#,##0.00;(#,##0.00)": 39,
  "#,##0.00;[Red](#,##0.00)": 40,
  "mm:ss": 45,
  "[h]:mm:ss": 46,
  "mmss.0": 47,
  "##0.0E+0": 48,
  "@": 49,
  '"上午/下午 "hh"時"mm"分"ss"秒 "': 56,
}

export const mergeCellStyles = (...styles: Array<ICellStyle | undefined>): ICellStyle => {
  return styles.reduce<ICellStyle>((mergedStyle, style) => {
    if (!style) return mergedStyle
    return deepMerge(mergedStyle, style) as ICellStyle
  }, {})
}

export const isCellStyleObject = (style: unknown): style is ICellStyle => {
  // Only treat plain objects as styles. Excluding arrays and Date instances
  // keeps non-style values (e.g. a Date used as a cell value) from being merged
  // and hashed as styles, which would bloat or corrupt styles.xml.
  return Boolean(style) && typeof style === "object" && !Array.isArray(style) && !(style instanceof Date)
}

export const patchStyledWorkbook = (workbook: IWorkbookLike, workbookData: ArrayBuffer | Uint8Array): Uint8Array => {
  const styleBuilder = new StyleBuilder()
  const sheetStyles = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName]
    const stylesByRef = new Map<string, number>()

    Object.keys(worksheet).forEach((cellRef) => {
      if (!isCellRef(cellRef)) return

      const cell = worksheet[cellRef] as IStyledCell | undefined
      const style = getCellStyle(cell)

      if (!style) return

      stylesByRef.set(cellRef, styleBuilder.addStyle(style))
    })

    return stylesByRef
  })

  const zip = unzipSync(toUint8Array(workbookData))
  zip["xl/styles.xml"] = strToU8(styleBuilder.toXml())

  sheetStyles.forEach((stylesByRef, index) => {
    const path = `xl/worksheets/sheet${index + 1}.xml`
    const worksheetXml = zip[path]

    if (!worksheetXml) return

    zip[path] = strToU8(patchWorksheetXml(strFromU8(worksheetXml), stylesByRef))
  })

  return zipSync(zip)
}

const toArrayBuffer = (data: Uint8Array): ArrayBuffer => {
  const output = new ArrayBuffer(data.byteLength)
  new Uint8Array(output).set(data)
  return output
}

export const toStyledOutput = (data: Uint8Array, type?: string): IStyledOutput => {
  switch (type) {
    case "array":
      return toArrayBuffer(data)
    // "string" and "binary" both yield a binary string, matching the string
    // return type the xlsx() overloads advertise for those write types.
    case "string":
    case "binary":
      return uint8ToBinaryString(data)
    case "base64":
      return uint8ToBase64(data)
    case "buffer":
    default:
      return typeof Buffer !== "undefined" ? Buffer.from(data) : data
  }
}

export const saveXlsxOutput = (data: ArrayBuffer | Uint8Array, filename: string): void => {
  if (typeof document !== "undefined" && typeof Blob !== "undefined" && typeof URL !== "undefined" && URL.createObjectURL) {
    const bytes = toUint8Array(data)
    const blobData = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    const blob = new Blob([blobData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.rel = "noopener"
    link.style.display = "none"
    ;(document.body ?? document.documentElement).appendChild(link)
    link.click()
    setTimeout(() => {
      link.parentNode?.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
    return
  }

  const fs = loadNodeFs()

  if (!fs) {
    throw new Error("Unable to write workbook file in this environment")
  }

  fs.writeFileSync(filename, Buffer.from(toUint8Array(data)))
}

// Resolve Node's "fs" module across runtimes. Prefer process.getBuiltinModule
// (Node >= 22.3), and fall back to the CommonJS module require for older Node
// versions. module.require (rather than the bare require global) keeps bundlers
// from trying to statically resolve "fs" in browser builds.
const loadNodeFs = (): typeof import("fs") | undefined => {
  if (typeof process === "undefined") return undefined

  const runtime = process as unknown as { getBuiltinModule?: (id: string) => unknown }

  try {
    if (typeof runtime.getBuiltinModule === "function") {
      return runtime.getBuiltinModule("fs") as typeof import("fs")
    }

    if (typeof module !== "undefined" && typeof module.require === "function") {
      return module.require("fs") as typeof import("fs")
    }
  } catch {
    return undefined
  }

  return undefined
}

const getCellStyle = (cell?: IStyledCell): ICellStyle | undefined => {
  if (!cell) return undefined

  const styles: ICellStyle[] = []
  if (isCellStyleObject(cell.s)) styles.push(cell.s)
  if (cell.z) styles.push({ numFmt: cell.z })

  if (styles.length === 0) return undefined

  return mergeCellStyles(...styles)
}

const patchWorksheetXml = (xml: string, stylesByRef: Map<string, number>): string => {
  return xml.replace(/<c\b[^>]*>/g, (cellTag) => {
    const refMatch = cellTag.match(/\br=(["'])(.*?)\1/)
    if (!refMatch) return cellTag

    const styleIndex = stylesByRef.get(refMatch[2])
    const withoutStyle = cellTag.replace(/\s+s=(["']).*?\1/, "")

    if (styleIndex === undefined) {
      return withoutStyle
    }

    const end = withoutStyle.endsWith("/>") ? "/>" : ">"
    return `${withoutStyle.slice(0, -end.length)} s="${styleIndex}"${end}`
  })
}

const borderPartNode = (direction: string, spec?: { color?: ICellStyleColor; style?: IBorderStyle }): XmlNode => {
  const directionNode = new XmlNode(direction)

  if (!spec) return directionNode

  const colored = Boolean(spec.color) && hasColor(spec.color as ICellStyleColor)

  // A border side only renders when it has a style. Honor an explicit style;
  // otherwise default to "thin" when a color was given, and emit nothing for an
  // empty/color-less spec instead of forcing a "medium" border.
  if (spec.style) {
    directionNode.attr("style", spec.style)
  } else if (colored) {
    directionNode.attr("style", "thin")
  }

  if (colored) directionNode.append(colorNode("color", spec.color as ICellStyleColor, false))

  return directionNode
}

const colorNode = (tagName: string, color: ICellStyleColor, withAlpha: boolean): XmlNode => {
  const node = new XmlNode(tagName)

  if (color.auto !== undefined) node.attr("auto", color.auto ? 1 : 0)
  if (color.indexed !== undefined) node.attr("indexed", color.indexed)
  if (color.theme !== undefined) node.attr("theme", color.theme)
  if (color.tint !== undefined) node.attr("tint", color.tint)
  if (color.rgb) node.attr("rgb", withAlpha && color.rgb.length === 6 ? `FF${color.rgb}` : color.rgb)

  return node
}

const hasColor = (color: ICellStyleColor): boolean => {
  return color.auto !== undefined || color.indexed !== undefined || color.theme !== undefined || color.tint !== undefined || Boolean(color.rgb)
}

const escapeXmlAttribute = (value: string): string => {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&apos;")
}

const isCellRef = (value: string): boolean => /^[A-Z]+[0-9]+$/.test(value)

const toUint8Array = (data: ArrayBuffer | Uint8Array): Uint8Array => {
  return data instanceof Uint8Array ? data : new Uint8Array(data)
}

const binaryStringChunkSize = 0x8000

const uint8ToBinaryString = (data: Uint8Array): string => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(data).toString("binary")
  }

  const chunks: string[] = []
  for (let index = 0; index < data.length; index += binaryStringChunkSize) {
    chunks.push(String.fromCharCode(...data.subarray(index, index + binaryStringChunkSize)))
  }
  return chunks.join("")
}

const uint8ToBase64 = (data: Uint8Array): string => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(data).toString("base64")
  }
  return btoa(uint8ToBinaryString(data))
}

const stableStringify = (value: unknown): string => {
  if (!isPlainObject(value)) {
    return JSON.stringify(value)
  }

  const entries = Object.keys(value)
    .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
    .sort()
    .map((key) => `"${key}":${stableStringify((value as Record<string, unknown>)[key])}`)

  return `{${entries.join(",")}}`
}

const deepMerge = (base: unknown, override: unknown): unknown => {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return cloneValue(override)
  }

  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  Object.keys(override).forEach((key) => {
    const overrideValue = (override as Record<string, unknown>)[key]
    if (overrideValue === undefined) return

    result[key] = key in result ? deepMerge(result[key], overrideValue) : cloneValue(overrideValue)
  })

  return result
}

const cloneValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(cloneValue)
  if (isPlainObject(value)) {
    const clone: Record<string, unknown> = {}
    Object.keys(value).forEach((key) => {
      clone[key] = cloneValue((value as Record<string, unknown>)[key])
    })
    return clone
  }
  return value
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)
}
