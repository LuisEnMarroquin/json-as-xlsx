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
const xlsx = require('../index.js')
export default {
  name: 'App',
  methods: {
    downloadFile: function (event) {
      var columns = [
        { label: 'Email', value: 'email' },
        { label: 'Age', value: function x(row) { return (row.age + ' years') } },
        { label: 'Phone', value: function x(row) { return (row.more ? row.more.phone || '' : '') } }
      ]
      var content = [
        { email: 'Ana', age: 16, more: { phone: '11111111' } },
        { email: 'Luis', age: 19, more: { phone: '12345678' } },
        { email: null, age: 21, more: { phone: '87654321' } }
      ]
      var settings = {
        sheetName: 'First sheet',
        fileName: 'Users'
      }
      xlsx(columns, content, settings)
    }
  }
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
  background-color: #008CBA;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
}
</style>
