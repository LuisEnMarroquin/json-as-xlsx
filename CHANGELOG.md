# Changelog

All notable changes to `json-as-xlsx` are documented in the project's
**[GitHub Releases](https://github.com/LuisEnMarroquin/json-as-xlsx/releases)**,
which are generated automatically for every published version.

This project uses a custom single-digit versioning scheme (each segment is one
digit and rolls over at `9`) — see [CONTRIBUTING.md](CONTRIBUTING.md#versioning)
for the rules.

## Unreleased

- Fixed columns that share a `label` being merged into a single column, which
  dropped data and left formats and styles on the wrong columns. Columns are now
  written by position, so integer-like labels such as `"2024"` also keep their
  declared order.
- Minify all JavaScript files published in the npm package.
- Added opt-in `writeEmptyValuesAsBlankCells` support so empty, null and missing
  values can be exported as true blank cells in Excel.
- Documentation overhaul: revamped `README.md` (installation, settings table,
  Node.js/buffer usage, hyperlink format, TypeScript notes) and `CONTRIBUTING.md`.
- Added `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue/PR templates.

For the full history of released versions, see the
[Releases page](https://github.com/LuisEnMarroquin/json-as-xlsx/releases).
