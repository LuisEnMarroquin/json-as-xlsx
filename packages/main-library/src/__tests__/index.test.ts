import { read as readBufferWorkBook } from "@e965/xlsx"
import { existsSync, readFileSync, unlinkSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { strFromU8, unzipSync } from "fflate"
import jsonxlsx, { IContent, IJsonSheet, ISettings } from "../index"

const unzipXlsxBuffer = (buffer: Buffer | undefined) => {
  expect(buffer).toBeInstanceOf(Buffer)
  return unzipSync(new Uint8Array(buffer as Buffer))
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

    it("keeps digit-only format codes as custom number formats", () => {
      const sheets: IJsonSheet[] = [
        {
          sheet: "Formats",
          columns: [
            { label: "Zip", value: "zip", format: "00000" },
            { label: "Date", value: "date", format: "14" },
          ],
          content: [{ zip: 1234, date: 45000 }],
        },
      ]
      const buffer = jsonxlsx(sheets, { ...settings, enableStyles: true })
      const stylesXml = strFromU8(unzipXlsxBuffer(buffer)["xl/styles.xml"])

      // "00000" (zip code) must survive as a custom format, not collapse to General
      expect(stylesXml).toContain('formatCode="00000"')
      // "14" is a valid built-in id, so it must NOT get a custom <numFmt> entry
      expect(stylesXml).not.toContain('formatCode="14"')
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
      const asArray: ArrayBuffer | undefined = jsonxlsx(sheets, { writeMode: "write", writeOptions: { type: "array" } })
      const asDefault: Buffer | undefined = jsonxlsx([])

      expect(asBuffer).toBeInstanceOf(Buffer)
      expect(typeof asString).toBe("string")
      expect(asArray).toBeInstanceOf(ArrayBuffer)
      expect(asDefault).toBeUndefined()
    })
  })
})
