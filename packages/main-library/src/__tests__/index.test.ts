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
  })
})
