import {
  verifyProfileToken,
} from '../src'

import {sampleTokenFiles } from './sampleData'

const tokenFile = sampleTokenFiles.ryan_apr20.body
const token = tokenFile[0].token

const publicKey = '02413d7c51118104cfe1b41e540b6c2acaaf91f1e2e22316df7448fb6070d582ec'
const compressedAddress = '1BTku19roxQs2d54kbYKVTv21oBCuHEApF'
const uncompressedAddress = '12wes6TQpDF2j8zqvAbXV9KNCGQVF2y7G5'

test('verifyToken', () => {
  const decodedToken1 = verifyProfileToken(token, publicKey)
  expect(decodedToken1).toBeTruthy()

  const decodedToken2 = verifyProfileToken(token, compressedAddress)
  expect(decodedToken2).toBeTruthy()

  const decodedToken3 = verifyProfileToken(token, uncompressedAddress)
  expect(decodedToken3).toBeTruthy()
})