import { isSameOriginAbsoluteUrl, isLaterVersion } from '../src'

test('isLaterVersion', () => {
  expect(isLaterVersion('', '1.1.0')).toEqual(false)
  expect(isLaterVersion('1.2.0', '1.1.0')).toEqual(true)
  expect(isLaterVersion('1.1.0', '1.1.0')).toEqual(true)
  expect(isLaterVersion('1.1.0', '1.2.0')).toEqual(false)
})

test('isSameOriginAbsoluteUrl', () => {
  expect(isSameOriginAbsoluteUrl('http://example.com', 'http://example.com/')).toEqual(true)
  expect(isSameOriginAbsoluteUrl('https://example.com', 'https://example.com/')).toEqual(true)
  expect(isSameOriginAbsoluteUrl('http://example.com', 'http://example.com/manifest.json')).toEqual(true)
  expect(isSameOriginAbsoluteUrl('https://example.com', 'https://example.com/manifest.json')).toEqual(true)
  expect(isSameOriginAbsoluteUrl('http://localhost:3000', 'http://localhost:3000/manifest.json')).toEqual(true)
  expect(isSameOriginAbsoluteUrl('http://app.example.com', 'http://app.example.com/manifest.json')).toEqual(true)
  expect(isSameOriginAbsoluteUrl('http://app.example.com:80', 'http://app.example.com/manifest.json')).toEqual(true)
  expect(isSameOriginAbsoluteUrl('https://app.example.com:80', 'https://app.example.com:80/manifest.json')).toEqual(true)
  
  expect(isSameOriginAbsoluteUrl('http://example.com', 'https://example.com/')).toEqual(false)
  expect(isSameOriginAbsoluteUrl('http://example.com', 'http://example.com:1234')).toEqual(false)
  expect(isSameOriginAbsoluteUrl('http://app.example.com', 'https://example.com/manifest.json')).toEqual(false)
})
