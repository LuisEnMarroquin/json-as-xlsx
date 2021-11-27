import jsonAsXlsx from '../index'
import { IJsonSheet } from '../types'

test('JsonAsXlsx should return undefined on empty data array', () => {
  expect(jsonAsXlsx([], { writeOptions: { type: 'buffer' } }))
    .toBeUndefined()
})

test('JsonAsXlsx should return xlsx with only column labels on empty content array', () => {
  const jsonSheet: IJsonSheet = {
    columns: [{ label: 'Username', value: 'username' }, { label: 'Playing', value: 'activity.game' }],
    content: []
  }

  expect(jsonAsXlsx([jsonSheet], { writeOptions: { type: 'buffer' } }))
    .toBeInstanceOf(Buffer)
})

test('JsonAsXlsx should return xlsx buffer even without worksheet name', () => {
  const worksheet: IJsonSheet = {
    columns: [{ label: 'Name', value: 'name' }],
    content: [{ name: 'Joseph' }]
  }

  // TODO: Verify buffer content
  expect(jsonAsXlsx([worksheet], { writeOptions: { type: 'buffer' } }))
    .toBeInstanceOf(Buffer)
})

test('JsonAsXlsx should return undefined on xlsx file creation', () => {
  const worksheet: IJsonSheet = {
    sheet: 'Friends',
    columns: [
      { label: 'Name', value: 'name' }
    ],
    content: [
      { name: 'Andreas', username: 'andr34s' }
    ]
  }

  // TODO: Verify that file was written
  expect(jsonAsXlsx([worksheet])).toBeUndefined()
})

test('JsonAsXlsx should return xlsx buffer for worksheet with name', () => {
  const data: IJsonSheet[] = [{
    sheet: 'Adults',
    columns: [
      { label: 'User', value: 'user' }, // Top level data
      { label: 'Age', value: (row: any) => (row.age + ' years') }, // Run functions
      { label: 'Phone', value: (row: any) => (row.more ? row.more.phone || '' : '') } // Deep props
    ],
    content: [
      { user: 'Andrea', age: 20, more: { phone: '11111111' } },
      { user: 'Luis', age: 21, more: { phone: '12345678' } }
    ]
  }]

  // TODO: Verify buffer content
  expect(jsonAsXlsx(data, { writeOptions: { type: 'buffer' } }))
    .toBeInstanceOf(Buffer)
})
