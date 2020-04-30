<template>
  <div id="app">
    <h1>Testing json-as-xlsx</h1>
    <button @click="downloadFile">Download</button>
  </div>
</template>

<script>
const xlsx = require('json-as-xlsx')
// const xlsx = require('../index.js')
export default {
  name: 'App',
  methods: {
    downloadFile: (event) => {
      var columns = [
        { label: 'Email', value: 'email' },
        { label: 'Age', value: row => (row.age + ' years') },
        { label: 'Password', value: row => (row.hidden ? row.hidden.password : '') },
      ]

      var content = [
        { email: 'Ana', age: 16, hidden: { password: '11111111' } },
        { email: 'Luis', age: 19, hidden: { password: '12345678' } }
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
