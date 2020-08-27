<template>
  <div id="app">
    <h1>Testing json-as-xlsx</h1>
    <button @click="downloadFile">Download</button>
    <h2>
      <span>See this project on: </span>
      <a href="https://github.com/LuisEnMarroquin/json-as-xlsx">GitHub</a>
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
        { label: 'Password', value: function x(row) { return (row.hidden ? row.hidden.password : '') } }
      ]
      var content = [
        { email: 'Ana', age: 16, hidden: { password: '11111111' } },
        { email: 'Luis', age: 19, hidden: { password: '12345678' } },
        { email: null, age: 21, hidden: { password: '87654321' } }
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
