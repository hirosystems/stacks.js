import {
  AuthRequest, AuthResponse,
  createUnsignedRequest, decodeToken
} from '../index'

const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'

let authRequest = new AuthRequest(privateKey)
console.log('auth request:')
console.log(authRequest)

const authRequestToken = authRequest.sign()
console.log('auth request token:')
console.log(authRequestToken)

const decodedAuthRequestToken = decodeToken(authRequestToken)
console.log('decoded auth request token:')
console.log(decodedAuthRequestToken)

const unsignedRequestToken = createUnsignedRequest({ 'app': 'unknown' })
console.log('unsigned request token')
console.log(unsignedRequestToken)