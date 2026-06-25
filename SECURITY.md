# Security Policy

## Supported versions

Only the latest published version of `json-as-xlsx` receives security updates.
Please make sure you are on the most recent release before reporting an issue.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| Older   | :x:                |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report them privately using one of these channels:

- GitHub's [private vulnerability reporting](https://github.com/LuisEnMarroquin/json-as-xlsx/security/advisories/new)
  (preferred), or
- Email <xlsx@marroquin.dev>.

Please include as much detail as you can:

- A description of the vulnerability and its impact.
- Steps to reproduce or a proof of concept.
- The version of `json-as-xlsx` affected.

You can expect an initial response within a few days. Once the issue is
confirmed, a fix will be released as soon as practical and you will be credited
unless you prefer to remain anonymous.

Note: most of the spreadsheet generation is delegated to the underlying
[SheetJS](https://docs.sheetjs.com) library — vulnerabilities originating there
should also be reported to that project.
