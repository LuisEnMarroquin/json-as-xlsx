<template>
  <div id="app">
    <h1>Testing json-as-xlsx</h1>
    <button @click="downloadFile">Download</button>
    <h2>
      <span>Visit this project on: </span>
      <a href="https://github.com/LuisEnMarroquin/json-as-xlsx" target="_blank">GitHub</a>
    </h2>
  </div>
</template>

<script>
const xlsx = require("../../src/index.js")
export default {
  name: "App",
  methods: {
    downloadFile: () => {
      let data = [
        {
          sheet: "Adults",
          columns: [
            { label: "User", value: "user" }, // Top level data
            { label: "Age", value: "age", format: '# "years"' }, // Custom format
            { label: "Phone", value: (row) => (row.more ? row.more.phone || "" : "") }, // Run functions
          ],
          content: [
            { user: "Andrea", age: 20, more: { phone: "11111111" } },
            { user: "Luis", age: 21, more: { phone: "12345678" } },
          ],
        },
        {
          sheet: "Children",
          columns: [
            { label: "User", value: "user" }, // Top level data
            { label: "Age", value: "age", format: '# "years"' }, // Custom format
            { label: "Phone", value: (row) => (row.more ? row.more.phone || "" : "") }, // Run functions
          ],
          content: [
            { user: "Manuel", age: 16, more: { phone: "99999999" } },
            { user: "Ana", age: 17, more: { phone: "87654321" } },
          ],
        },
      ]
      let settings = {
        fileName: "MySpreadsheet",
      }
      xlsx(data, settings)
    },
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
button {
  background-color: #008cba;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
}
</style>
