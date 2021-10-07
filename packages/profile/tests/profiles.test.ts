import { parseZoneFile } from 'zone-file'
import {
  signProfileToken,
  wrapProfileToken,
  verifyProfileToken,
  extractProfile,
  makeProfileZoneFile,
  getTokenFileUrl,
} from '../src'

import { sampleProfiles } from './sampleData'

const profiles = [
  sampleProfiles.naval,
  sampleProfiles.google,
  sampleProfiles.balloonDog
]

const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'

profiles.forEach(profile => {
  let tokenRecords: any[] = []

  test('profileToToken', () => {
    const token = signProfileToken(profile, privateKey)
    expect(token).toBeTruthy()

    const tokenRecord = wrapProfileToken(token)
    expect(tokenRecord).toBeTruthy()

    const decodedToken = verifyProfileToken(tokenRecord.token, publicKey)
    expect(decodedToken).toBeTruthy()
  })

  test('profileToTokens', () => {
    tokenRecords = [wrapProfileToken(signProfileToken(profile, privateKey))]
    expect(tokenRecords).toBeTruthy()
    const tokensVerified = true

    // this will throw an error if one is invalid
    tokenRecords.map(tokenRecord => verifyProfileToken(tokenRecord.token, publicKey))

    expect(tokensVerified).toEqual(true)
  })

  test('tokenToProfile', () => {
    const recoveredProfile = extractProfile(tokenRecords[0].token, publicKey)
    expect(recoveredProfile).toBeTruthy()
    expect(JSON.stringify(recoveredProfile)).toEqual(JSON.stringify(profile))
  })

  test('makeProfileZoneFile', () => {
    const origin = 'satoshi.id'
    const tokenFileUrl = 'https://example.com/satoshi.json'
    const expectedZoneFile = '$ORIGIN satoshi.id\n$TTL 3600\n_http._tcp	IN	URI	10	1	"https://example.com/satoshi.json"\n\n'
    const actualZoneFile = makeProfileZoneFile(origin, tokenFileUrl)
    expect(actualZoneFile).toEqual(expectedZoneFile)
  })

  test('getTokenFileUrl', () => {
    const zoneFile = '$ORIGIN satoshi.id\n$TTL 3600\n_http._tcp	IN	URI	10	1	"https://example.com/satoshi.json"\n\n'
    const expectedTokenFileUrl = "https://example.com/satoshi.json"
    const actualTokenFileUrl = getTokenFileUrl(parseZoneFile(zoneFile))
    expect(actualTokenFileUrl).toEqual(expectedTokenFileUrl)
  })

  test('getTokenFileUrl from zonefile with redirect', () => {
    const zoneFile = '$ORIGIN satoshi.id\n$TTL 3600\n_redirect	IN	URI	10	1	"https://example.com/"\n_http._tcp	IN	URI	10	1	"https://example.com/satoshi.json"\n\n'
    const expectedTokenFileUrl = "https://example.com/satoshi.json"
    const actualTokenFileUrl = getTokenFileUrl(parseZoneFile(zoneFile))
    expect(actualTokenFileUrl).toEqual(expectedTokenFileUrl)
  })

});
