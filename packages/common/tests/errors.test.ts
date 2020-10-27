import { InvalidDIDError } from '../src/errors'

test('InvalidDIDError', () => {
  const error = new InvalidDIDError('the message')
  expect(error.message.indexOf('the message')).toEqual(0)
  expect(error.parameter).toEqual(undefined)
  expect((<any>error).param).toEqual(undefined)
})

