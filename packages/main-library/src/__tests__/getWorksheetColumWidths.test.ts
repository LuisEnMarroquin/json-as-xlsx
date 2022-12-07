import { utils } from "xlsx"
import { getJsonSheetRow, getWorksheetColumnWidths } from "../index"

test("Should return only one column width", () => {
  const content = { username: "art3mis" }
  const columns = [{ label: "Username", value: "username" }]

  const jsonSheetRow = getJsonSheetRow(content, columns)
  const worksheet = utils.json_to_sheet([jsonSheetRow])

  // Column label is larger than content
  expect(getWorksheetColumnWidths(worksheet)).toEqual([{ width: 9 }])

  expect(getWorksheetColumnWidths(worksheet, 0)).toEqual([{ width: 8 }])

  expect(getWorksheetColumnWidths(worksheet, 4)).toEqual([{ width: 12 }])
})

test("Should return two column widths", () => {
  const content = { name: "Interstellar", year: 2014 }
  const columns = [
    { label: "Movie", value: "name" },
    { label: "Year", value: "year" },
  ]

  const jsonSheetRow = getJsonSheetRow(content, columns)
  const worksheet = utils.json_to_sheet([jsonSheetRow])

  // Content is larger than column label
  expect(getWorksheetColumnWidths(worksheet)).toEqual([{ width: 13 }, { width: 5 }])

  expect(getWorksheetColumnWidths(worksheet, 0)).toEqual([{ width: 12 }, { width: 4 }])

  expect(getWorksheetColumnWidths(worksheet, 4)).toEqual([{ width: 16 }, { width: 8 }])
})
