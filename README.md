# json-as-xlsx

json-as-xlsx is a tool that helps to build an excel from a json. It depends only on xlsx

# Usage

Just import and use it

```js
var xlsx = require('json-as-xlsx')

var columns = [
    { label: 'Email', value: 'email' }, // Top level data
    { label: 'Age', value: row => (row.age + ' years') }, // Run functions
    { label: 'Password', value: row => (row.hidden ? row.hidden.password : '') }, // Deep props
]

var content = [
    { email: 'Luis', age: 19, hidden: { password: '12345678' } },
    { email: 'Ana', age: 16, hidden: { password: '11111111' } }
]

var settings = {
    sheetName: 'First sheet',
    fileName: 'Users'
}

xlsx(columns, content, settings)
```
