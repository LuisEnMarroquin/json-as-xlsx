# json-as-xlsx

This is a tool that helps to build an excel from a json and it depends only on `xlsx`

## Usage

Just import and use it

```js
var xlsx = require('json-as-xlsx')

var columns = [
  { label: 'Email', value: 'email' }, // Top level data
  { label: 'Age', value: row => (row.age + ' years') }, // Run functions
  { label: 'Password', value: row => (row.hidden ? row.hidden.password : '') }, // Deep props
]

var content = [
  { email: 'Ana', age: 16, hidden: { password: '11111111' } },
  { email: 'Luis', age: 19, hidden: { password: '12345678' } }
]

var settings = {
  sheetName: 'First sheet',
  fileName: 'Users',
  extraLength: 3
}

xlsx(columns, content, settings) // Will download the excel file
```

You can also see it being used with Vue 3 [here](src/App.vue)

## Publish package

Will publish the following files:
* LICENSE
* index.js
* README.md
* package.json

Login to npm registry
```shell
npm login
```

Publish package
```shell
npm publish
```

## Testing

Install dependencies
```shell
yarn install
```

Compile and hot-reload for development
```shell
yarn start
```

Compile and minify for production
```shell
yarn build
```
