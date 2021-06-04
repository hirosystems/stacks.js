import {
  verifyProfileToken,
} from '../src'

import {sampleTokenFiles } from './sampleData'

const tokenFile = sampleTokenFiles.ryan_apr20.body
const token = tokenFile[0].token

const publicKey = '02413d7c51118104cfe1b41e540b6c2acaaf91f1e2e22316df7448fb6070d582ec'
const address = 'SPAMWCETADJ9R8D0BXVJKKN3NDMNZ517JSGAG6YX'

test('verifyToken', () => {
  const decodedToken1 = verifyProfileToken(token, publicKey)
  expect(decodedToken1).toBeTruthy()

  const decodedToken2 = verifyProfileToken(token, address)
  expect(decodedToken2).toBeTruthy()
})