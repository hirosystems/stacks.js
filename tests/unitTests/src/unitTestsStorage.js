import test from 'tape'
import FetchMock from 'fetch-mock'
import bitcoin from 'bitcoinjs-lib'

import localStorage from 'mock-local-storage'

import { uploadToGaiaHub, getFullReadUrl,
         connectToGaiaHub, BLOCKSTACK_GAIA_HUB_LABEL } from '../../../lib/storage/hub'
import { getFile } from '../../../lib/storage'

global.window = {}
window.localStorage = global.localStorage

export function runStorageTests() {

  test('fetch404null', (t) => {
    t.plan(2)
    const config = { address: '19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk',
                     url_prefix: 'gaia.testblockstack.org/hub/',
                     token: '',
                     server: 'hub.testblockstack.org' }

    global.localStorage.setItem(BLOCKSTACK_GAIA_HUB_LABEL, JSON.stringify(config))

    FetchMock.get(`${config.url_prefix}${config.address}/foo.json`,
                  { status: 404 })

    getFile('foo.json', false)
      .then(x => t.equal(x, null, '404 should return null'))
    getFile('foo.json', true)
      .then(x => t.equal(x, null, '404 should return null, even if we try to decrypt'))
  })

  test('uploadToGaiaHub', (t) => {
    t.plan(2)

    const config = { address: '19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk',
                     url_prefix: 'gaia.testblockstack.org',
                     token: '',
                     server: 'hub.testblockstack.org' }

    FetchMock.post(`${config.server}/store/${config.address}/foo.json`,
                   JSON.stringify({publicURL: '${config.url_prefix}/${config.address}/foo.json'}))

    uploadToGaiaHub('foo.json', 'foo the bar', config)
      .then((url) => {
        t.ok(url, 'URL returned')
        t.equal(url, '${config.url_prefix}/${config.address}/foo.json')
      })
  })

  test('getFullReadUrl', (t) => {
    t.plan(1)

    const config = { address: '19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk',
                     url_prefix: 'gaia.testblockstack.org',
                     token: '',
                     server: 'hub.testblockstack.org' }

    const outUrl = getFullReadUrl('foo.json', config)
    t.equal(`${config.url_prefix}${config.address}/foo.json`, outUrl)
  })

  test('connectToGaiaHub', (t) => {
    t.plan(5)

    const hubServer = 'hub.testblockstack.org'

    const hubInfo = {
      read_url_prefix: 'gaia.testblockstack.org',
      challenge_text: 'please-sign',
    }

    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const address = '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U'
    const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'

    FetchMock.get(`${hubServer}/hub_info`,
                   JSON.stringify(hubInfo))

    connectToGaiaHub(hubServer, privateKey)
      .then((config) => {
        t.ok(config, 'Config returned by connectToGaiaHub()')
        t.equal(hubInfo.read_url_prefix, config.url_prefix)
        t.equal(address, config.address)
        t.equal(hubServer, config.server)

        const verificationKey = bitcoin.ECPair.fromPublicKeyBuffer(Buffer.from(publicKey, 'hex'))

        const decoded = JSON.parse(Buffer.from(config.token, 'base64').toString())
        const signature = bitcoin.ECSignature.fromDER(Buffer.from(
          decoded.signature, 'hex'))

        t.ok(verificationKey.verify(
          bitcoin.crypto.sha256(hubInfo.challenge_text), signature), 'Verified token')
      })
  })

}
