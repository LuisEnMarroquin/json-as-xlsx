// Empty stand-in for Node.js built-in modules (`fs`, `stream`, …) that the
// `@e965/xlsx` (SheetJS) dependency `require()`s for its Node code paths.
//
// In the browser those paths never run — file generation uses a Blob download
// instead. Without this shim, Vite "externalizes" the built-ins and logs
// "Module <x> has been externalized for browser compatibility" warnings in the
// console (see https://github.com/LuisEnMarroquin/json-as-xlsx/issues/96).
// Aliasing the built-ins to this empty object silences the noise while keeping
// the browser download path working.
export default {}
