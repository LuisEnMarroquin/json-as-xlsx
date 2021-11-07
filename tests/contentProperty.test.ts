import { getContentProperty } from '../index'

test('Should access first level property', () => {
  const supportTicket = {
    id: 'e4te583nbt',
    title: 'Problem with server',
    user: 'daniel31'
  }

  expect(getContentProperty(supportTicket, 'user'))
    .toBe('daniel31')

  expect(getContentProperty(supportTicket, 'description'))
    .toBe('')
})

test('Should access second level property', () => {
  const employee = {
    name: 'Sophie',
    age: '21',
    email: {
      work: 'sophiedev@job.com',
      personal: 'sophie@email.com'
    }
  }

  expect(getContentProperty(employee, 'email.work'))
    .toBe('sophiedev@job.com')

  expect(getContentProperty(employee, 'email.personal'))
    .toBe('sophie@email.com')

  expect(getContentProperty(employee, 'email.business'))
    .toBe('')
})

test('Should access third level property', () => {
  const purchase = {
    id: '934as44951',
    costumer: {
      email: 'jeniffer@email.com',
      phoneNumber: '44444444',
      billingAddress: {
        line1: '123 Street',
        city: 'Montreal',
        postalCode: 55555
      }
    }
  }

  expect(getContentProperty(purchase, 'costumer.billingAddress.line1'))
    .toBe('123 Street')

  expect(getContentProperty(purchase, 'costumer.billingAddress.city'))
    .toBe('Montreal')

  expect(getContentProperty(purchase, 'costumer.billingAddress.postalCode'))
    .toBe(55555)

  expect(getContentProperty(purchase, 'costumer.billingAddress.countryCode'))
    .toBe('')
})
