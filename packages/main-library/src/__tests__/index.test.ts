import { read as readBufferWorkBook } from "@e965/xlsx"
import { existsSync, readFileSync, unlinkSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { strFromU8, unzipSync } from "fflate"
import jsonxlsx, { IContent, IJsonSheet, ISettings } from "../index"
import { toStyledOutput } from "../styles"

type IsAny<T> = 0 extends 1 & T ? true : false
type ExpectFalse<T extends false> = T

const unzipXlsxBuffer = (buffer: Buffer | undefined) => {
  expect(buffer).toBeInstanceOf(Buffer)
  return unzipSync(new Uint8Array(buffer as Buffer))
}

const getXmlCollectionCount = (xml: string, tagName: string): number => {
  const match = xml.match(new RegExp(`<${tagName} count="(\\d+)"`))

  expect(match).not.toBeNull()
  return Number(match?.[1])
}

const mockBrowserDownload = () => {
  jest.useFakeTimers()

  const originalBlob = (global as any).Blob
  const originalDocument = (global as any).document
  const originalUrl = (global as any).URL
  const link = {
    download: "",
    href: "",
    parentNode: undefined as undefined | { removeChild: jest.Mock },
    rel: "",
    style: {} as Record<string, string>,
    click: jest.fn(),
  }
  const parent = {
    appendChild: jest.fn((node: typeof link) => {
      node.parentNode = parent
      return node
    }),
    removeChild: jest.fn((node: typeof link) => {
      node.parentNode = undefined
      return node
    }),
  }

  ;(global as any).Blob = class {
    size: number
    type: string

    constructor(parts: Array<ArrayBuffer>, options: { type?: string } = {}) {
      this.size = parts.reduce((size, part) => size + part.byteLength, 0)
      this.type = options.type ?? ""
    }
  }
  ;(global as any).document = {
    body: parent,
    createElement: jest.fn(() => link),
    documentElement: parent,
  }
  ;(global as any).URL = {
    createObjectURL: jest.fn(() => "blob:json-as-xlsx-test"),
    revokeObjectURL: jest.fn(),
  }

  return {
    link,
    parent,
    restore: () => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()

      if (originalBlob === undefined) {
        delete (global as any).Blob
      } else {
        ;(global as any).Blob = originalBlob
      }

      if (originalDocument === undefined) {
        delete (global as any).document
      } else {
        ;(global as any).document = originalDocument
      }

      if (originalUrl === undefined) {
        delete (global as any).URL
      } else {
        ;(global as any).URL = originalUrl
      }
    },
  }
}

describe("json-as-xlsx", () => {
  it("should return undefined if sheets array is empty", () => {
    const sheets: IJsonSheet[] = []
    const result = jsonxlsx(sheets)
    expect(result).toBeUndefined()
  })

  // Regression guard for issue #87 ("xlsx is not a function"). We overwrite the
  // whole `module.exports` with the `xlsx` function so `require("json-as-xlsx")`
  // returns it directly. That override drops the named bindings tsc emitted, so
  // they are re-attached. Without `xlsx`/`default` re-attached,
  // `import { xlsx } from ...` and a default import transpiled to `.default`
  // (TS without esModuleInterop) both resolve to undefined and crash.
  describe("CommonJS export surface (issue #87)", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const required = require("../index")

    it("returns the xlsx function as the module itself", () => {
      expect(typeof required).toBe("function")
    })

    it("re-attaches xlsx and default so named/default imports resolve to the function", () => {
      expect(required.xlsx).toBe(required)
      expect(required.default).toBe(required)
    })

    it("keeps the other named bindings after the module.exports override", () => {
      expect(typeof required.utils).toBe("object")
      expect(typeof required.getContentProperty).toBe("function")
      expect(typeof required.getJsonSheetRow).toBe("function")
      expect(typeof required.getWorksheetColumnWidths).toBe("function")
      expect(required.libraryName).toBe("json-as-xlsx")
    })
  })

  describe("writeOptions.type is set to buffer", () => {
    const settings: ISettings = {
      writeOptions: {
        type: "buffer",
      },
    }

    it("should return buffer", () => {
      const sheets = [
        {
          columns: [{ label: "Name", value: "name" }],
          content: [{ name: "Martin" }],
        },
      ]
      const buffer = jsonxlsx(sheets, settings)
      expect(buffer).toBeInstanceOf(Buffer)
    })

    it("should return parsable xlsx buffer", () => {
      const sheets = [
        {
          columns: [{ label: "Name", value: "name" }],
          content: [{ name: "Martin" }],
        },
      ]
      const buffer = jsonxlsx(sheets, settings)
      const workBook = readBufferWorkBook(buffer)

      expect(workBook).toBeDefined()
    })

    it("should return one column filled cells", () => {
      const sheets = [
        {
          sheet: "Authors",
          columns: [{ label: "Name", value: "name" }],
          content: [{ name: "Martin" }, { name: "Kent" }],
        },
      ]
      const buffer = jsonxlsx(sheets, settings)
      const workBook = readBufferWorkBook(buffer)
      const workSheet = workBook.Sheets.Authors

      expect(workSheet["!ref"]).toBe("A1:A3")
      expect(workSheet.A1.v).toBe("Name")
      expect(workSheet.A2.v).toBe("Martin")
      expect(workSheet.A3.v).toBe("Kent")
    })

    it("should return only the column headers if there is no content", () => {
      const sheetName = "Authors"
      const sheets = [
        {
          sheet: sheetName,
          columns: [
            { label: "Name", value: "name" },
            { label: "Age", value: "age" },
          ],
          content: [],
        },
      ]
      const buffer = jsonxlsx(sheets, settings)
      const workBook = readBufferWorkBook(buffer)
      const workSheet = workBook.Sheets[sheetName]

      expect(workSheet.A1.v).toBe("Name")
      expect(workSheet.B1.v).toBe("Age")
    })

    it("should handle deep props", () => {
      const sheets = [
        {
          sheet: "Users",
          columns: [{ label: "IP", value: "metadata.ip" }],
          content: [
            { name: "Martin", metadata: { ip: "0.0.0.0" } },
            { name: "Robert", metadata: { ip: "0.0.0.1" } },
          ],
        },
      ]
      const buffer = jsonxlsx(sheets, settings)
      const workBook = readBufferWorkBook(buffer)
      const workSheet = workBook.Sheets.Users

      expect(workSheet.A1.v).toBe("IP")
      expect(workSheet.A2.v).toBe("0.0.0.0")
      expect(workSheet.A3.v).toBe("0.0.0.1")
    })

    it("should handle deep props through objects that have a v property", () => {
      const sheets = [
        {
          sheet: "Users",
          columns: [{ label: "Name", value: "metadata.person.name" }],
          content: [
            { metadata: { person: { v: "not a cell", name: "Martin" } } },
            { metadata: { person: { v: "not a cell", name: "Robert" } } },
          ],
        },
      ]
      const buffer = jsonxlsx(sheets, settings)
      const workBook = readBufferWorkBook(buffer)
      const workSheet = workBook.Sheets.Users

      expect(workSheet.A1.v).toBe("Name")
      expect(workSheet.A2.v).toBe("Martin")
      expect(workSheet.A3.v).toBe("Robert")
    })

    it("should handle function column value", () => {
      const maskPhoneNumber = (cell: IContent): string => new String(cell.phone).replace(/^(\d{3})(\d{4}).*/, "$1-$2")

      const sheets = [
        {
          sheet: "Users",
          columns: [{ label: "Phone number", value: maskPhoneNumber }],
          content: [
            { name: "Martin", phone: "1234567" },
            { name: "Robert", phone: "1234568" },
          ],
        },
      ]
      const buffer = jsonxlsx(sheets, settings)
      const workBook = readBufferWorkBook(buffer)
      const workSheet = workBook.Sheets.Users

      expect(workSheet.A1.v).toBe("Phone number")
      expect(workSheet.A2.v).toBe("123-4567")
      expect(workSheet.A3.v).toBe("123-4568")
    })

    it("should call optional callback", () => {
      const callback = jest.fn()
      const sheets = [
        {
          columns: [{ label: "Name", value: "name" }],
          content: [{ name: "Martin" }],
        },
      ]
      jsonxlsx(sheets, settings, callback)

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it("should handle multiple sheets", () => {
      const sheets = [
        {
          sheet: "Authors",
          columns: [
            { label: "Name", value: "name" },
            { label: "Age", value: "age" },
          ],
          content: [
            { name: "Martin", age: 50 },
            { name: "Robert", age: 20 },
            { name: "Andrea", age: 35 },
          ],
        },
        {
          sheet: "Books",
          columns: [
            { label: "Title", value: "title" },
            { label: "Author", value: "author" },
          ],
          content: [
            { title: "TDD", author: "Martin" },
            { title: "Git", author: "Robert" },
          ],
        },
      ]
      const buffer = jsonxlsx(sheets, settings)
      const workBook = readBufferWorkBook(buffer)

      const authorsSheet = workBook.Sheets.Authors
      const booksSheet = workBook.Sheets.Books

      expect(workBook.SheetNames).toEqual(["Authors", "Books"])

      expect(authorsSheet.A1.v).toBe("Name")
      expect(authorsSheet.B1.v).toBe("Age")
      expect(authorsSheet.A2.v).toBe("Martin")
      expect(authorsSheet.B2.v).toBe(50)
      expect(authorsSheet.A3.v).toBe("Robert")
      expect(authorsSheet.B3.v).toBe(20)
      expect(authorsSheet.A4.v).toBe("Andrea")
      expect(authorsSheet.B4.v).toBe(35)

      expect(booksSheet.A1.v).toBe("Title")
      expect(booksSheet.B1.v).toBe("Author")
      expect(booksSheet.A2.v).toBe("TDD")
      expect(booksSheet.B2.v).toBe("Martin")
      expect(booksSheet.A3.v).toBe("Git")
      expect(booksSheet.B3.v).toBe("Robert")
    })

    it("should allow null value in content", () => {
      const sheets = [
        {
          sheet: "Users",
          columns: [{ label: "IP", value: "metadata.ip" }],
          content: [
            { name: "Martin", metadata: { ip: null } },
            { name: "Robert", metadata: { ip: null } },
          ],
        },
      ]
      const buffer = jsonxlsx(sheets, settings)
      const workBook = readBufferWorkBook(buffer)
      const workSheet = workBook.Sheets.Users

      expect(workSheet.A1.v).toBe("IP")
      expect(workSheet.A2.v).toBe("")
      expect(workSheet.A3.v).toBe("")
    })

    it("should write empty values as empty-string cells by default", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Users",
          columns: [
            { label: "ID", value: "id" },
            { label: "Score", value: "score", format: "0.00" },
            { label: "Email", value: (row: IContent) => row.email ?? "" },
            { label: "Nested", value: "metadata.code" },
          ],
          content: [
            { id: "ID-1", score: 42, email: "ada@example.com", metadata: { code: "A" } },
            { id: "ID-2", email: "" },
            { id: "ID-3", score: null, metadata: {} },
          ],
        },
      ]

      const buffer = jsonxlsx(sheets, settings)
      const sheetXml = strFromU8(unzipXlsxBuffer(buffer)["xl/worksheets/sheet1.xml"])

      expect(sheetXml).toMatch(/<c r="B3"[^>]*><v><\/v><\/c>/)
      expect(sheetXml).toContain('<c r="C3" t="str"><v></v></c>')
      expect(sheetXml).toContain('<c r="D3" t="str"><v></v></c>')
      expect(sheetXml).toMatch(/<c r="B4"[^>]*><v><\/v><\/c>/)
      expect(sheetXml).toContain('<c r="C4" t="str"><v></v></c>')
      expect(sheetXml).toContain('<c r="D4" t="str"><v></v></c>')
    })

    it("should optionally write empty values as true blank cells", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Users",
          columns: [
            { label: "ID", value: "id" },
            { label: "Score", value: "score", format: "0.00" },
            { label: "Email", value: (row: IContent) => row.email ?? "" },
            { label: "Nested", value: "metadata.code" },
          ],
          content: [
            { id: "ID-1", score: 42, email: "ada@example.com", metadata: { code: "A" } },
            { id: "ID-2", email: "" },
            { id: "ID-3", score: null, metadata: {} },
          ],
        },
      ]

      const buffer = jsonxlsx(sheets, { ...settings, writeEmptyValuesAsBlankCells: true })
      const workBook = readBufferWorkBook(buffer)
      const workSheet = workBook.Sheets.Users
      const sheetXml = strFromU8(unzipXlsxBuffer(buffer)["xl/worksheets/sheet1.xml"])

      expect(workSheet.A3.v).toBe("ID-2")
      expect(workSheet.A4.v).toBe("ID-3")
      expect(workSheet.B3).toBeUndefined()
      expect(workSheet.C3).toBeUndefined()
      expect(workSheet.D3).toBeUndefined()
      expect(workSheet.B4).toBeUndefined()
      expect(workSheet.C4).toBeUndefined()
      expect(workSheet.D4).toBeUndefined()
      expect(sheetXml).not.toMatch(/<c r="B3"/)
      expect(sheetXml).not.toMatch(/<c r="C3"/)
      expect(sheetXml).not.toMatch(/<c r="D3"/)
      expect(sheetXml).not.toMatch(/<c r="B4"/)
      expect(sheetXml).not.toMatch(/<c r="C4"/)
      expect(sheetXml).not.toMatch(/<c r="D4"/)
    })

    it("should optionally render empty-content sheets with headers only", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Headers only",
          columns: [
            { label: "Name", value: "name" },
            { label: "Age", value: "age" },
          ],
          content: [],
        },
      ]

      const buffer = jsonxlsx(sheets, { ...settings, writeEmptyValuesAsBlankCells: true })
      const workBook = readBufferWorkBook(buffer)
      const workSheet = workBook.Sheets["Headers only"]
      const sheetXml = strFromU8(unzipXlsxBuffer(buffer)["xl/worksheets/sheet1.xml"])

      expect(workSheet["!ref"]).toBe("A1:B1")
      expect(workSheet.A1.v).toBe("Name")
      expect(workSheet.B1.v).toBe("Age")
      expect(sheetXml).not.toContain('<row r="2"')
      expect(sheetXml).not.toContain('<c r="A2"')
      expect(sheetXml).not.toContain('<c r="B2"')
    })

    it("should keep styled empty values as true blank cells when enabled", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Styled blanks",
          columns: [
            { label: "Website", value: "url", format: "hyperlink", cellStyle: { font: { bold: true } } },
            { label: "Amount", value: "amount", format: "0.00", cellStyle: { font: { italic: true } } },
            { label: "Name", value: "name", cellStyle: { fill: { fgColor: { rgb: "DCFCE7" } } } },
          ],
          content: [
            { url: "", amount: null, name: "Ada" },
            { url: "https://example.com", amount: 42, name: "" },
          ],
        },
      ]

      const buffer = jsonxlsx(sheets, {
        ...settings,
        enableStyles: true,
        writeEmptyValuesAsBlankCells: true,
      })
      const sheetXml = strFromU8(unzipXlsxBuffer(buffer)["xl/worksheets/sheet1.xml"])

      expect(sheetXml).not.toMatch(/<c r="A2"/)
      expect(sheetXml).not.toMatch(/<c r="B2"/)
      expect(sheetXml).not.toMatch(/<c r="C3"/)
      expect(sheetXml).toMatch(/<c r="C2"[^>]* s="\d+"[^>]*>/)
      expect(sheetXml).toMatch(/<c r="A3"[^>]* s="\d+"[^>]*>/)
      expect(sheetXml).toMatch(/<c r="B3"[^>]* s="\d+"[^>]*>/)
    })

    it("should not write style objects unless styles are enabled", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Styled",
          columns: [{ label: "Name", value: "name" }],
          content: [
            {
              name: {
                v: "Ada",
                t: "s",
                s: { font: { bold: true } },
              },
            },
          ],
        },
      ]
      const buffer = jsonxlsx(sheets, settings)
      const zip = unzipXlsxBuffer(buffer)
      const stylesXml = strFromU8(zip["xl/styles.xml"])
      const sheetXml = strFromU8(zip["xl/worksheets/sheet1.xml"])

      expect(stylesXml).not.toContain("<b/>")
      expect(sheetXml).toContain('<c r="A2" t="str">')
    })

    it("should write direct cell styles, column styles, header styles and number formats when styles are enabled", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Styled",
          columns: [
            {
              label: "Name",
              value: "name",
              cellStyle: { alignment: { wrapText: true } },
              headerStyle: {
                fill: { fgColor: { rgb: "21A366" } },
                font: { bold: true, color: { rgb: "FFFFFF" } },
              },
            },
            {
              label: "Salary",
              value: "salary",
              cellStyle: { font: { italic: true } },
              format: "$#,##0.00",
            },
          ],
          content: [
            {
              name: {
                v: "Ada\nLovelace",
                t: "s",
                s: { font: { bold: true, color: { rgb: "FF0000" } } },
              },
              salary: 5000,
            },
          ],
        },
      ]
      const buffer = jsonxlsx(sheets, { ...settings, enableStyles: true })
      const zip = unzipXlsxBuffer(buffer)
      const stylesXml = strFromU8(zip["xl/styles.xml"])
      const sheetXml = strFromU8(zip["xl/worksheets/sheet1.xml"])

      expect(stylesXml).toContain("<b/>")
      expect(stylesXml).toContain("<i/>")
      expect(stylesXml).toContain('<color rgb="FF0000"/>')
      expect(stylesXml).toContain('<fgColor rgb="FF21A366"/>')
      expect(stylesXml).toContain('<alignment wrapText="true"/>')
      expect(stylesXml).toContain('formatCode="$#,##0.00"')
      expect(sheetXml).toMatch(/<c r="A1"[^>]* s="\d+"[^>]*>/)
      expect(sheetXml).toMatch(/<c r="A2"[^>]* s="\d+"[^>]*>/)
      expect(sheetXml).toMatch(/<c r="B2"[^>]* s="\d+"[^>]*>/)
    })

    it("should write styled workbooks to disk in writeFile mode", () => {
      const fileName = join(tmpdir(), `json-as-xlsx-style-${Date.now()}`)
      const filePath = `${fileName}.xlsx`
      const sheets: IJsonSheet[] = [
        {
          sheet: "Styled",
          columns: [{ label: "Name", value: "name", headerStyle: { font: { bold: true } } }],
          content: [{ name: "Ada" }],
        },
      ]

      try {
        jsonxlsx(sheets, {
          enableStyles: true,
          fileName,
          writeMode: "writeFile",
          writeOptions: {
            bookType: "xlsx",
          },
        })

        expect(existsSync(filePath)).toBe(true)

        const zip = unzipSync(new Uint8Array(readFileSync(filePath)))
        expect(strFromU8(zip["xl/styles.xml"])).toContain("<b/>")
      } finally {
        if (existsSync(filePath)) {
          unlinkSync(filePath)
        }
      }
    })

    it("should write styled workbooks to disk when process.getBuiltinModule is unavailable", () => {
      const fileName = join(tmpdir(), `json-as-xlsx-style-fallback-${Date.now()}`)
      const filePath = `${fileName}.xlsx`
      const originalGetBuiltinModule = (process as any).getBuiltinModule
      const sheets: IJsonSheet[] = [
        {
          sheet: "Styled",
          columns: [{ label: "Name", value: "name", headerStyle: { font: { bold: true } } }],
          content: [{ name: "Ada" }],
        },
      ]

      Object.defineProperty(process, "getBuiltinModule", {
        configurable: true,
        value: undefined,
        writable: true,
      })

      try {
        jsonxlsx(sheets, {
          enableStyles: true,
          fileName,
          writeMode: "writeFile",
          writeOptions: {
            bookType: "xlsx",
          },
        })

        expect(existsSync(filePath)).toBe(true)
        expect(unzipSync(new Uint8Array(readFileSync(filePath)))["xl/styles.xml"]).toBeDefined()
      } finally {
        Object.defineProperty(process, "getBuiltinModule", {
          configurable: true,
          value: originalGetBuiltinModule,
          writable: true,
        })

        if (existsSync(filePath)) {
          unlinkSync(filePath)
        }
      }
    })

    it("keeps digit-only format codes as custom number formats when needed", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Formats",
          columns: [
            { label: "Zip", value: "zip", format: "00000" },
            { label: "Date", value: "date", format: "14" },
            { label: "Custom", value: "custom", format: "164" },
          ],
          content: [{ zip: 1234, date: 45000, custom: 7 }],
        },
      ]
      const buffer = jsonxlsx(sheets, { ...settings, enableStyles: true })
      const stylesXml = strFromU8(unzipXlsxBuffer(buffer)["xl/styles.xml"])

      // "00000" (zip code) must survive as a custom format, not collapse to General
      expect(stylesXml).toContain('formatCode="00000"')
      // Numeric strings outside the built-in range need a custom <numFmt> entry.
      expect(stylesXml).toContain('formatCode="164"')
      // "14" is a valid built-in id, so it must NOT get a custom <numFmt> entry
      expect(stylesXml).not.toContain('formatCode="14"')
    })

    it("rejects numeric custom number format ids", () => {
      const builtInSheets: IJsonSheet[] = [
        {
          sheet: "BuiltIn",
          columns: [{ label: "Date", value: "date", cellStyle: { numFmt: 14 } }],
          content: [{ date: 45000 }],
        },
      ]
      const sheets: IJsonSheet[] = [
        {
          sheet: "Formats",
          columns: [{ label: "Custom", value: "custom", cellStyle: { numFmt: 164 } }],
          content: [{ custom: 7 }],
        },
      ]

      expect(() => jsonxlsx(builtInSheets, { ...settings, enableStyles: true })).not.toThrow()
      expect(() => jsonxlsx(sheets, { ...settings, enableStyles: true })).toThrow("Numeric numFmt values must be built-in IDs")
    })

    it("only forces a border style when one is intended", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Borders",
          columns: [
            {
              label: "Cell",
              value: "value",
              cellStyle: { border: { top: { color: { rgb: "FF0000" } }, bottom: {}, left: { style: "thick" } } },
            },
          ],
          content: [{ value: "x" }],
        },
      ]
      const buffer = jsonxlsx(sheets, { ...settings, enableStyles: true })
      const stylesXml = strFromU8(unzipXlsxBuffer(buffer)["xl/styles.xml"])

      // color-only side defaults to thin, explicit style is honored, empty side has no style
      expect(stylesXml).toContain('<top style="thin"><color rgb="FF0000"/></top>')
      expect(stylesXml).toContain('<left style="thick"/>')
      expect(stylesXml).toContain("<bottom/>")
    })

    it("skips empty direct cell styles", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Noop",
          columns: [
            { label: "Empty", value: "empty" },
            { label: "Undefined", value: "undefinedStyle" },
            { label: "Styled", value: "styled" },
          ],
          content: [
            {
              empty: { v: "Ada", t: "s", s: {} },
              undefinedStyle: { v: "Grace", t: "s", s: { fill: undefined, font: { bold: undefined } } },
              styled: { v: "Bold", t: "s", s: { font: { bold: true } } },
            },
          ],
        },
      ]
      const buffer = jsonxlsx(sheets, { ...settings, enableStyles: true })
      const sheetXml = strFromU8(unzipXlsxBuffer(buffer)["xl/worksheets/sheet1.xml"])

      expect(sheetXml).not.toMatch(/<c r="A2"[^>]* s="/)
      expect(sheetXml).not.toMatch(/<c r="B2"[^>]* s="/)
      expect(sheetXml).toMatch(/<c r="C2"[^>]* s="\d+"[^>]*>/)
    })

    it("emits count attributes for the fixed-size style collections", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Counts",
          columns: [{ label: "Cell", value: "value", headerStyle: { font: { bold: true } } }],
          content: [{ value: "x" }],
        },
      ]
      const buffer = jsonxlsx(sheets, { ...settings, enableStyles: true })
      const stylesXml = strFromU8(unzipXlsxBuffer(buffer)["xl/styles.xml"])

      expect(stylesXml).toContain('<cellStyleXfs count="1">')
      expect(stylesXml).toContain('<cellStyles count="1">')
    })

    it("deduplicates shared sub-components across distinct styles", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Dedup",
          columns: [
            { label: "A", value: "a", cellStyle: { font: { bold: true }, fill: { fgColor: { rgb: "FF0000" } } } },
            { label: "B", value: "b", cellStyle: { font: { bold: true }, fill: { fgColor: { rgb: "00FF00" } } } },
          ],
          content: [{ a: 1, b: 2 }],
        },
      ]
      const buffer = jsonxlsx(sheets, { ...settings, enableStyles: true })
      const stylesXml = strFromU8(unzipXlsxBuffer(buffer)["xl/styles.xml"])

      const fontEls = (stylesXml.match(/<font>/g) ?? []).length
      const fontCount = Number((stylesXml.match(/<fonts count="(\d+)"/) ?? [])[1])

      // the shared bold font is written once (default font + the bold font), and
      // the declared count stays in sync with the actual number of entries
      expect(fontEls).toBe(fontCount)
      expect(fontEls).toBeLessThanOrEqual(2)
    })

    it("deduplicates styles that only differ by undefined keys", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Undefined",
          columns: [
            { label: "A", value: "a", cellStyle: { font: { bold: true, italic: undefined } } },
            { label: "B", value: "b", cellStyle: { font: { bold: true } } },
          ],
          content: [{ a: 1, b: 2 }],
        },
      ]
      const buffer = jsonxlsx(sheets, { ...settings, enableStyles: true })
      const stylesXml = strFromU8(unzipXlsxBuffer(buffer)["xl/styles.xml"])

      expect(getXmlCollectionCount(stylesXml, "cellXfs")).toBe(3)
    })
  })

  describe("browser downloads", () => {
    const sheets: IJsonSheet[] = [
      {
        sheet: "Users",
        columns: [{ label: "Name", value: "name" }],
        content: [{ name: "Ada" }],
      },
    ]

    it("should use the requested filename for styled workbook downloads", () => {
      const browser = mockBrowserDownload()

      try {
        jsonxlsx(sheets, { enableStyles: true, fileName: "StyledSpreadsheet" })

        expect(browser.link.download).toBe("StyledSpreadsheet.xlsx")
        expect(browser.link.href).toBe("blob:json-as-xlsx-test")
        expect(browser.parent.appendChild).toHaveBeenCalledWith(browser.link)
        expect(browser.link.click).toHaveBeenCalledTimes(1)
      } finally {
        browser.restore()
      }
    })
  })

  // These assertions are mostly compile-time: ts-jest type-checks this file, so
  // if the xlsx() return-type overloads regress, the suite fails to build.
  describe("return type overloads", () => {
    const sheets: IJsonSheet[] = [{ sheet: "S", columns: [{ label: "N", value: "n" }], content: [{ n: "x" }] }]

    it("narrows the return type from writeMode/writeOptions.type", () => {
      const asBuffer: Buffer | undefined = jsonxlsx(sheets, { writeOptions: { type: "buffer" } })
      const asString: string | undefined = jsonxlsx(sheets, { writeMode: "write", writeOptions: { type: "base64" } })
      const asStyledString: string | undefined = jsonxlsx(sheets, { enableStyles: true, writeMode: "write", writeOptions: { type: "string" } })
      const asArray: ArrayBuffer | undefined = jsonxlsx(sheets, { writeMode: "write", writeOptions: { type: "array" } })
      const asDefault: Buffer | undefined = jsonxlsx([])

      expect(asBuffer).toBeInstanceOf(Buffer)
      expect(typeof asString).toBe("string")
      expect(typeof asStyledString).toBe("string")
      expect(asArray).toBeInstanceOf(ArrayBuffer)
      expect(asDefault).toBeUndefined()
    })

    it("defaults writeMode 'write' to a buffer consistently across both paths", () => {
      // Without this default the non-styled path throws (SheetJS rejects an
      // undefined type) while the styled path returns a buffer.
      expect(jsonxlsx(sheets, { writeMode: "write" })).toBeInstanceOf(Buffer)
      expect(jsonxlsx(sheets, { writeMode: "write", enableStyles: true })).toBeInstanceOf(Buffer)
    })
  })

  describe("multiple tables per sheet", () => {
    const bufferSettings: ISettings = { writeOptions: { type: "buffer" } }

    it("stacks tables vertically with a blank-row gap by default", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Multi",
          tables: [
            {
              columns: [{ label: "Name", value: "name" }],
              content: [{ name: "Alice" }, { name: "Bob" }],
            },
            {
              columns: [
                { label: "Product", value: "product" },
                { label: "Price", value: "price" },
              ],
              content: [{ product: "Pen", price: 1.2 }],
            },
          ],
        },
      ]

      const workBook = readBufferWorkBook(jsonxlsx(sheets, bufferSettings))
      const workSheet = workBook.Sheets.Multi

      // First table at A1..A3
      expect(workSheet.A1.v).toBe("Name")
      expect(workSheet.A2.v).toBe("Alice")
      expect(workSheet.A3.v).toBe("Bob")
      // Row 4 is the gap and stays empty
      expect(workSheet.A4).toBeUndefined()
      // Second table starts at row 5
      expect(workSheet.A5.v).toBe("Product")
      expect(workSheet.B5.v).toBe("Price")
      expect(workSheet.A6.v).toBe("Pen")
      expect(workSheet.B6.v).toBe(1.2)
    })

    it("places tables side by side when layout is horizontal", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Multi",
          tablesLayout: "horizontal",
          tables: [
            {
              columns: [{ label: "Name", value: "name" }],
              content: [{ name: "Alice" }],
            },
            {
              columns: [{ label: "Product", value: "product" }],
              content: [{ product: "Pen" }],
            },
          ],
        },
      ]

      const workBook = readBufferWorkBook(jsonxlsx(sheets, bufferSettings))
      const workSheet = workBook.Sheets.Multi

      expect(workSheet.A1.v).toBe("Name")
      expect(workSheet.A2.v).toBe("Alice")
      // Column B is the gap and stays empty
      expect(workSheet.B1).toBeUndefined()
      // Second table starts at column C
      expect(workSheet.C1.v).toBe("Product")
      expect(workSheet.C2.v).toBe("Pen")
    })

    it("honors a custom tablesGap", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Multi",
          tablesGap: 0,
          tables: [
            {
              columns: [{ label: "Name", value: "name" }],
              content: [{ name: "Alice" }],
            },
            {
              columns: [{ label: "Product", value: "product" }],
              content: [{ product: "Pen" }],
            },
          ],
        },
      ]

      const workBook = readBufferWorkBook(jsonxlsx(sheets, bufferSettings))
      const workSheet = workBook.Sheets.Multi

      // No blank row between the tables
      expect(workSheet.A1.v).toBe("Name")
      expect(workSheet.A2.v).toBe("Alice")
      expect(workSheet.A3.v).toBe("Product")
      expect(workSheet.A4.v).toBe("Pen")
    })

    it("applies each table's column formats at its own offset", () => {
      let workbook: any
      jsonxlsx(
        [
          {
            sheet: "Multi",
            tables: [
              {
                columns: [{ label: "Name", value: "name" }],
                content: [{ name: "Alice" }],
              },
              {
                columns: [
                  { label: "Price", value: "price", format: "0.00" },
                  { label: "Site", value: "site", format: "hyperlink" },
                ],
                content: [{ price: 1.2, site: "https://example.com" }],
              },
            ],
          },
        ],
        { writeMode: "write" },
        (capturedWorkbook) => {
          workbook = capturedWorkbook
        },
      )

      const workSheet = workbook.Sheets.Multi

      // Second table header lands at row 4 (1 header + 1 data row + 1 gap)
      expect(workSheet.A4.v).toBe("Price")
      expect(workSheet.B4.v).toBe("Site")
      // Its number format and hyperlink are applied to the second table's data row
      expect(workSheet.A5.z).toBe("0.00")
      expect(workSheet.B5.l.Target).toBe("https://example.com")
    })

    it("applies each table's header styles at its own offset", () => {
      let workbook: any
      jsonxlsx(
        [
          {
            sheet: "Multi",
            tables: [
              {
                columns: [{ label: "Name", value: "name" }],
                content: [{ name: "Alice" }],
              },
              {
                columns: [{ label: "Product", value: "product", headerStyle: { font: { bold: true } } }],
                content: [{ product: "Pen" }],
              },
            ],
          },
        ],
        { enableStyles: true, writeMode: "write" },
        (capturedWorkbook) => {
          workbook = capturedWorkbook
        },
      )

      const workSheet = workbook.Sheets.Multi

      // First table header is untouched, second table header (row 4) is bold
      expect(workSheet.A1.s).toBeUndefined()
      expect(workSheet.A4.v).toBe("Product")
      expect(workSheet.A4.s.font.bold).toBe(true)
    })

    it("ignores top-level columns/content when tables is provided", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Multi",
          columns: [{ label: "Ignored", value: "ignored" }],
          content: [{ ignored: "nope" }],
          tables: [
            {
              columns: [{ label: "Name", value: "name" }],
              content: [{ name: "Alice" }],
            },
          ],
        },
      ]

      const workBook = readBufferWorkBook(jsonxlsx(sheets, bufferSettings))
      const workSheet = workBook.Sheets.Multi

      expect(workSheet.A1.v).toBe("Name")
      expect(workSheet.A2.v).toBe("Alice")
    })

    it("falls back to single-table columns/content when tables is empty", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Single",
          columns: [{ label: "Name", value: "name" }],
          content: [{ name: "Alice" }],
          tables: [],
        },
      ]

      const workBook = readBufferWorkBook(jsonxlsx(sheets, bufferSettings))
      const workSheet = workBook.Sheets.Single

      expect(workSheet.A1.v).toBe("Name")
      expect(workSheet.A2.v).toBe("Alice")
    })

    it("renders empty tables with headers only when blank cells are enabled", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Multi",
          tables: [
            {
              columns: [{ label: "Name", value: "name" }],
              content: [{ name: "Alice" }],
            },
            {
              columns: [
                { label: "Product", value: "product" },
                { label: "Price", value: "price" },
              ],
              content: [],
            },
          ],
        },
      ]

      const workBook = readBufferWorkBook(jsonxlsx(sheets, { ...bufferSettings, writeEmptyValuesAsBlankCells: true }))
      const workSheet = workBook.Sheets.Multi

      expect(workSheet.A1.v).toBe("Name")
      expect(workSheet.A2.v).toBe("Alice")
      expect(workSheet.A3).toBeUndefined()
      expect(workSheet.A4.v).toBe("Product")
      expect(workSheet.B4.v).toBe("Price")
      expect(workSheet.A5).toBeUndefined()
      expect(workSheet.B5).toBeUndefined()
    })
  })

  describe("styled binary output", () => {
    const bytes = new Uint8Array([0x00, 0x41, 0x7f, 0x80, 0x9f, 0xff])
    const expectedCharCodes = Array.from(bytes)

    it("keeps toStyledOutput typed as a concrete union", () => {
      const returnTypeIsAny: ExpectFalse<IsAny<ReturnType<typeof toStyledOutput>>> = false
      const output: ReturnType<typeof toStyledOutput> = toStyledOutput(bytes, "buffer")

      expect(returnTypeIsAny).toBe(false)
      expect(output).toBeInstanceOf(Buffer)
    })

    it("preserves bytes in Node", () => {
      const output = toStyledOutput(bytes, "binary") as string

      expect(Array.from(output, (char) => char.charCodeAt(0))).toEqual(expectedCharCodes)
    })

    it("preserves bytes without Buffer", () => {
      const originalBuffer = (global as any).Buffer
      ;(global as any).Buffer = undefined

      try {
        const output = toStyledOutput(bytes, "string") as string

        expect(Array.from(output, (char) => char.charCodeAt(0))).toEqual(expectedCharCodes)
      } finally {
        ;(global as any).Buffer = originalBuffer
      }
    })

    it("passes byte-preserving binary strings to btoa without Buffer", () => {
      const originalBuffer = (global as any).Buffer
      const originalBtoa = (global as any).btoa
      const btoa = jest.fn((value: string) => {
        expect(Array.from(value, (char) => char.charCodeAt(0))).toEqual(expectedCharCodes)
        return "encoded"
      })

      ;(global as any).Buffer = undefined
      ;(global as any).btoa = btoa

      try {
        expect(toStyledOutput(bytes, "base64")).toBe("encoded")
        expect(btoa).toHaveBeenCalledTimes(1)
      } finally {
        ;(global as any).Buffer = originalBuffer

        if (originalBtoa === undefined) {
          delete (global as any).btoa
        } else {
          ;(global as any).btoa = originalBtoa
        }
      }
    })
  })
})
