# WIP: Cell Styling Support

## Goal

Add real cell styling support to `json-as-xlsx` without replacing the current
`@e965/xlsx` engine globally. The implementation should preserve backward
compatibility by keeping the existing behavior as the default and making style
writing opt-in.

## Background

PR #71 proposed switching the library import from `xlsx` to `xlsx-js-style`.
That proved the feature demand is real, but merging that PR literally would
replace the underlying spreadsheet engine for all users.

The current repo uses `@e965/xlsx@^0.20.3`, while `xlsx-js-style@1.2.0` is based
on SheetJS 0.18.5. Replacing the engine would be risky for a published library.

## Investigation Summary

- `xlsx-js-style` is not a small wrapper. It is a full SheetJS fork with basic
  style writing added.
- In the `xlsx-js-style` source the style code lives mostly in the generated
  `src/xlsx.js`, not clean modular source.
- The reusable part is a `StyleBuilder` that builds `xl/styles.xml`.
- `StyleBuilder` alone is not enough. The writer also needs to set `s="..."`
  style indexes on worksheet cell XML entries.
- `@e965/xlsx` keeps `cell.s` objects in memory but does not write those style
  objects to the final `.xlsx` file.
- Tests should inspect the internal XML of the generated `.xlsx`, because
  reading the file back does not reliably expose all style details.

## Decision

Use option 2: keep `@e965/xlsx`, adapt the lightweight style-building logic, and
post-process generated XLSX zip files when styles are enabled.

Expected flow:

1. Build workbook normally with `@e965/xlsx`.
2. Preserve style information while generating worksheets.
3. Write workbook to a buffer/array.
4. Open the XLSX zip.
5. Generate `xl/styles.xml` from collected style objects.
6. Patch each `xl/worksheets/sheet*.xml` cell with numeric `s` style indexes.
7. Return/download the patched XLSX.

## API Direction

Keep existing APIs working exactly as before.

Add opt-in setting:

```ts
{
  enableStyles: true
}
```

Support cell objects in content values:

```ts
{
  name: {
    v: "Ada",
    t: "s",
    s: { font: { bold: true } }
  }
}
```

Also support more ergonomic column-level styles:

```ts
{
  label: "Name",
  value: "name",
  headerStyle: { font: { bold: true } },
  cellStyle: { alignment: { wrapText: true } }
}
```

Column `format` should continue to work. When styles are enabled, existing
formats should be translated into style `numFmt` while preserving current
behavior when styles are disabled.

## License Notes

`xlsx-js-style` is Apache-2.0 and credits SheetJS, sheetjs-style, and
sheetjs-style-v2. If adapting logic, preserve attribution in source comments
and avoid copying more than needed.

## Validation Needed

- Unit tests for existing behavior.
- Unit tests proving style XML is generated.
- Unit tests proving worksheet cells receive expected `s` style indexes.
- Tests for header styles, column cell styles, direct cell object styles, fills,
  fonts, alignment, number formats, and hyperlinks.
- `yarn test`
- `yarn build`
- If docs or examples change, ensure TypeScript demos still compile.

## Implementation Notes

- Added `packages/main-library/src/styles.ts` with style types, style XML
  generation, worksheet XML patching, and styled output helpers.
- Added `fflate` to `packages/main-library` for XLSX zip post-processing.
- Added `IStyledCell`, `ICellStyle`, `ICellStyleColor`, `IBorderStyle`, and
  related style exports.
- Added `settings.enableStyles`; the default remains `false`.
- Added `IColumn.headerStyle` and `IColumn.cellStyle`.
- Direct cell objects with `s` are supported when `enableStyles` is true.
- Existing column `format` still writes through `cell.z`; when styles are
  enabled, it is mirrored into the generated style `numFmt`.
- Deep property access remains backward-compatible for regular objects that
  happen to have a `v` property.
- Styled `writeFile` uses a browser Blob download when `document` exists, and
  `process.getBuiltinModule("fs")` in Node. The helper (`saveXlsxOutput`)
  appends a hidden anchor to the DOM, sets `download` to the requested filename,
  clicks it, then revokes the object URL after a short delay.
- The non-styled path is left untouched and keeps delegating to SheetJS
  `writeFile`/`write`, so existing (non-styled) behavior is byte-for-byte the
  same as before this feature.
- Root `yarn build` now builds `json-as-xlsx` before `demo-reactjs` so the demo
  sees fresh generated declaration files.
- Demo packages now depend on workspace version `2.5.9` instead of
  `file:../main-library`, preventing stale nested package copies.
- README, React demo, and Express demo now include styled examples.
- Vite pre-optimizes `json-as-xlsx` for the React demo so the linked CommonJS
  workspace package exposes the expected default import during local dev.

## Validation Completed

- `yarn workspace json-as-xlsx test`
- `yarn test` (20 tests)
- `yarn build`
- `packages/demo-express/node_modules/.bin/tsc -p packages/demo-express/tsconfig.json --noEmit`
- `yarn static`
- React demo browser smoke test at `http://127.0.0.1:6500/`:
  - The page rendered with `Download example` and `Download styled`.
  - `Download styled` generated `StyledSpreadsheet.xlsx`, MIME
    `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, ZIP
    signature `50 4b 03 04`.
  - `Download example` still generated `MySpreadsheet.xlsx` with ZIP signature
    `50 4b 03 04`.
- Express runtime smoke test at `http://127.0.0.1:5500/styled`:
  - Response was `200 OK` with `filename=MySheet-Styled.xlsx`.
  - Generated file had ZIP signature `50 4b 03 04`.
  - `xl/styles.xml` included bold font, fill color, wrapped alignment, and
    standard default fills (`none` / `gray125`).
  - Worksheet cells had `s="..."` style indexes.

## Notes / Follow-up

- Local Vite dev logs browser-compatibility warnings from the underlying XLSX
  browser bundle (`stream` / `fs` externalized), but the page has no runtime
  errors and both downloads produce valid XLSX blobs.
- UUID-filename bug (root cause): the first version of the styled download
  helper created a detached `<a>` (never appended to the DOM) and revoked the
  blob URL on a 0 ms timeout. In that race the browser ignores the `download`
  attribute and falls back to the blob URL's UUID. Fix: append the anchor to the
  DOM and delay `revokeObjectURL`. Verified in the React demo — both buttons now
  save `MySpreadsheet.xlsx` / `StyledSpreadsheet.xlsx`.
- Scope correction during review: the helper is used ONLY for the styled path.
  The non-styled path was reverted to the original SheetJS `writeFile`, which
  already appends its own anchor to the DOM and was never affected by the bug.
  This keeps the public, non-styled behavior 100% backward-compatible.
- Style XML fix during review: `defaultPivotStyle` was `TableStyleMedium4`
  (invalid pivot-style name); corrected to `PivotStyleMedium4` to match the
  reference `xlsx-js-style` output.
- Version: `packages/main-library/package.json` is still `2.5.9`. Per the repo
  versioning rules the next bump is `2.6.0` (patch is already `.9`). It must be
  bumped before this feature is merged to `main`/published to npm, but that is a
  release step, not part of develop work.
- `yarn workspace demo-express tsc ...` can accidentally pick the root
  TypeScript binary from Lerna. Use
  `packages/demo-express/node_modules/.bin/tsc -p packages/demo-express/tsconfig.json --noEmit`
  for the demo Express typecheck unless the workspace tooling is cleaned up.

## Checklist

- [x] Create this WIP file before implementation.
- [x] Add style-related public types without breaking existing types.
- [x] Add style metadata collection during worksheet creation.
- [x] Add XLSX zip post-processing.
- [x] Ensure browser and Node write modes both work.
- [x] Keep default behavior unchanged when styles are not enabled.
- [x] Add tests that inspect generated XLSX XML.
- [x] Update README with styled examples and settings docs.
- [x] Add React demo styled download button.
- [x] Add Express styled endpoint and link.
- [x] Run full validation.
- [x] Validate React demo in a browser.
- [x] Validate Express styled endpoint at runtime.
- [x] Update this WIP file with final implementation notes.
