import test from 'tape'
import { decodeToken } from 'jsontokens'

import { makeV1GaiaAuthToken } from '../../../lib/storage/hub'

const hubInfo = {
  challenge_text: 'challenge',
  latest_auth_version: 'v1'
}
const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'

export function runHubTests() {
  test('adding scopes to auth token', (t) => {
    t.plan(4)
    const scopes = [
      {
        scope: 'putFilePrefix',
        domain: 'testingScoped'
      }
    ]
    const token = makeV1GaiaAuthToken(hubInfo, privateKey, 'http://localhost:4000', null, scopes)
    t.assert(token.indexOf('v1:') === 0, 'Token starts with v1:')
    const decodedToken = decodeToken(token.slice('v1:'.length))
    const { payload } = decodedToken
    t.assert(payload.scopes[0].scope === scopes[0].scope, 'scope should match')
    t.assert(payload.scopes[0].domain === scopes[0].domain, 'domain should match')
    t.assert(payload.scopes.length === scopes.length, 'number of scopes should match')
    // console.log(decodedToken)
  })

  test('using association tokens in a token', async (t) => {
    t.plan(1)
    const associationToken = 'myAssociationToken'
    const token = makeV1GaiaAuthToken(hubInfo, privateKey, 'http://localhost:4000', associationToken)
    const decodedToken = decodeToken(token.slice('v1:'.length))
    t.assert(decodedToken.payload.associationToken === associationToken, 'association token must be included')
  })
}

runHubTests()
