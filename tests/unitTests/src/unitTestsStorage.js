import test from 'tape'
import FetchMock from 'fetch-mock'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import bitcoin from 'bitcoinjs-lib'

import localStorage from 'mock-local-storage'

import { uploadToGaiaHub, getFullReadUrl,
         connectToGaiaHub, BLOCKSTACK_GAIA_HUB_LABEL,
         getBucketUrl } from '../../../lib/storage/hub'
import { getFile, putFile, getUserAppFileUrl } from '../../../lib/storage'

global.window = {}
window.localStorage = global.localStorage

export function runStorageTests() {

  test('getFile unencrypted', (t) => {
    t.plan(2)

    const path = 'file.json'
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack.org/hub/'
    }

    const fullReadUrl = 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/file.json'
    const fileContent = { test: 'test' }

    const getOrSetLocalGaiaHubConnection = sinon.stub().resolves(gaiaHubConfig)
    const getFullReadUrl = sinon.stub().resolves(fullReadUrl)

    const { getFile } = proxyquire('../../../lib/storage', {
      './hub': { getOrSetLocalGaiaHubConnection, getFullReadUrl },
    })

    FetchMock.get(fullReadUrl, fileContent)

    getFile(path)
      .then((file) => {
        t.ok(file, 'Returns file content')
        t.same(JSON.parse(file), fileContent)
      })
  })

  test('getFile unencrypted - multi-reader', (t) => {
    t.plan(4)

    const path = 'file.json'
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack.org/hub/'
    }

    const fullReadUrl = 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/file.json'
    const fileContent = { test: 'test' }

    const getOrSetLocalGaiaHubConnection = sinon.stub().resolves(gaiaHubConfig)
    const getFullReadUrl = sinon.stub().resolves(fullReadUrl)

    const { getFile } = proxyquire('../../../lib/storage', {
      './hub': { getOrSetLocalGaiaHubConnection, getFullReadUrl },
    })

    FetchMock.get(fullReadUrl, fileContent)

    const nameLookupUrl = 'http://localhost:6270/v1/names/yukan.id'

    const nameRecord = {"status": "registered", "zonefile": "$ORIGIN yukan.id\n$TTL 3600\n_http._tcp URI 10 1 \"https://gaia.blockstack.org/hub/16zVUoP7f15nfTiHw2UNiX8NT5SWYqwNv3/0/profile.json\"\n", "expire_block": 581432, "blockchain": "bitcoin", "last_txid": "f7fa811518566b1914a098c3bd61a810aee56390815bd608490b0860ac1b5b4d", "address": "16zVUoP7f15nfTiHw2UNiX8NT5SWYqwNv3", "zonefile_hash": "98f42e11026d42d394b3424d4d7f0cccd6f376e2"}
    const nameRecordContent = JSON.stringify(nameRecord)
    FetchMock.get(nameLookupUrl, nameRecordContent)

    const profileUrl = 'https://gaia.blockstack.org/hub/16zVUoP7f15nfTiHw2UNiX8NT5SWYqwNv3/0/profile.json'
    const profileContent = [
  {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJqdGkiOiJjNDhmOTQ0OC1hMGZlLTRiOWUtOWQ2YS1mYzA5MzhjOGUyNzAiLCJpYXQiOiIyMDE4LTAxLTA4VDE4OjIyOjI0Ljc5NloiLCJleHAiOiIyMDE5LTAxLTA4VDE4OjIyOjI0Ljc5NloiLCJzdWJqZWN0Ijp7InB1YmxpY0tleSI6IjAyNDg3YTkxY2Q5NjZmYWVjZWUyYWVmM2ZkZTM3MjgwOWI0NmEzNmVlMTkyNDhjMDFmNzJiNjQ1ZjQ0Y2VmMmUyYyJ9LCJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDI0ODdhOTFjZDk2NmZhZWNlZTJhZWYzZmRlMzcyODA5YjQ2YTM2ZWUxOTI0OGMwMWY3MmI2NDVmNDRjZWYyZTJjIn0sImNsYWltIjp7IkB0eXBlIjoiUGVyc29uIiwiQGNvbnRleHQiOiJodHRwOi8vc2NoZW1hLm9yZyIsImltYWdlIjpbeyJAdHlwZSI6IkltYWdlT2JqZWN0IiwibmFtZSI6ImF2YXRhciIsImNvbnRlbnRVcmwiOiJodHRwczovL3d3dy5kcm9wYm94LmNvbS9zL2oxaDBrdHMwbTdhYWRpcC9hdmF0YXItMD9kbD0xIn1dLCJnaXZlbk5hbWUiOiIiLCJmYW1pbHlOYW1lIjoiIiwiZGVzY3JpcHRpb24iOiIiLCJhY2NvdW50IjpbeyJAdHlwZSI6IkFjY291bnQiLCJwbGFjZWhvbGRlciI6ZmFsc2UsInNlcnZpY2UiOiJoYWNrZXJOZXdzIiwiaWRlbnRpZmllciI6Inl1a2FubCIsInByb29mVHlwZSI6Imh0dHAiLCJwcm9vZlVybCI6Imh0dHBzOi8vbmV3cy55Y29tYmluYXRvci5jb20vdXNlcj9pZD15dWthbmwifSx7IkB0eXBlIjoiQWNjb3VudCIsInBsYWNlaG9sZGVyIjpmYWxzZSwic2VydmljZSI6ImdpdGh1YiIsImlkZW50aWZpZXIiOiJ5a25sIiwicHJvb2ZUeXBlIjoiaHR0cCIsInByb29mVXJsIjoiaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20veWtubC8xZjcwMThiOThmNzE2ZjAxNWE2Y2Y0NGZkYTA4MDZkNyJ9LHsiQHR5cGUiOiJBY2NvdW50IiwicGxhY2Vob2xkZXIiOmZhbHNlLCJzZXJ2aWNlIjoidHdpdHRlciIsImlkZW50aWZpZXIiOiJ5dWthbmwiLCJwcm9vZlR5cGUiOiJodHRwIiwicHJvb2ZVcmwiOiJodHRwczovL3R3aXR0ZXIuY29tL3l1a2FuTC9zdGF0dXMvOTE2NzQwNzQ5MjM2MTAxMTIwIn1dLCJuYW1lIjoiS2VuIExpYW8iLCJhcHBzIjp7Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MCI6Imh0dHBzOi8vZ2FpYS5ibG9ja3N0YWNrLm9yZy9odWIvMUREVXFmS3RRZ1lOdDcyMnd1QjRaMmZQQzdhaU5HUWE1Ui8ifX19.UyQNZ02kBFHEovbwiGaS-VQd57w9kcwn1Nt3QbW3afEMArg1OndmeplB7lzjMuRCLAi-88lkpQLkFw7LwKZ31Q",
    "decodedToken": {
      "header": {
        "typ": "JWT",
        "alg": "ES256K"
      },
      "payload": {
        "jti": "c48f9448-a0fe-4b9e-9d6a-fc0938c8e270",
        "iat": "2018-01-08T18:22:24.796Z",
        "exp": "2019-01-08T18:22:24.796Z",
        "subject": {
          "publicKey": "02487a91cd966faecee2aef3fde372809b46a36ee19248c01f72b645f44cef2e2c"
        },
        "issuer": {
          "publicKey": "02487a91cd966faecee2aef3fde372809b46a36ee19248c01f72b645f44cef2e2c"
        },
        "claim": {
          "@type": "Person",
          "@context": "http://schema.org",
          "image": [
            {
              "@type": "ImageObject",
              "name": "avatar",
              "contentUrl": "https://www.dropbox.com/s/j1h0kts0m7aadip/avatar-0?dl=1"
            }
          ],
          "givenName": "",
          "familyName": "",
          "description": "",
          "account": [
            {
              "@type": "Account",
              "placeholder": false,
              "service": "hackerNews",
              "identifier": "yukanl",
              "proofType": "http",
              "proofUrl": "https://news.ycombinator.com/user?id=yukanl"
            },
            {
              "@type": "Account",
              "placeholder": false,
              "service": "github",
              "identifier": "yknl",
              "proofType": "http",
              "proofUrl": "https://gist.github.com/yknl/1f7018b98f716f015a6cf44fda0806d7"
            },
            {
              "@type": "Account",
              "placeholder": false,
              "service": "twitter",
              "identifier": "yukanl",
              "proofType": "http",
              "proofUrl": "https://twitter.com/yukanL/status/916740749236101120"
            }
          ],
          "name": "Ken Liao",
          "apps": {
            "http://localhost:8080": "https://gaia.blockstack.org/hub/1DDUqfKtQgYNt722wuB4Z2fPC7aiNGQa5R/"
          }
        }
      },
      "signature": "UyQNZ02kBFHEovbwiGaS-VQd57w9kcwn1Nt3QbW3afEMArg1OndmeplB7lzjMuRCLAi-88lkpQLkFw7LwKZ31Q"
    }
  }
]

    FetchMock.get(profileUrl, profileContent)

    const fileUrl = 'https://gaia.blockstack.org/hub/1DDUqfKtQgYNt722wuB4Z2fPC7aiNGQa5R/file.json'
    const fileContents = JSON.stringify({ "key": "value" })
    FetchMock.get(fileUrl, fileContents)

    const options = {
      username: 'yukan.id',
      app: 'http://localhost:8080'
    }

    getFile(path, options)
      .then((file) => {
        t.ok(file, 'Returns file content')
        t.same(JSON.parse(file), JSON.parse(fileContents))
      })

    const optionsNoApp = {
      username: 'yukan.id'
    }

    global.window = {
      location: {
        origin: 'http://localhost:8080'
      }
    }

    getFile(path, optionsNoApp)
      .then((file) => {
        t.ok(file, 'Returns file content')
        t.same(JSON.parse(file), JSON.parse(fileContents))
    })

  })

  test('putFile unencrypted', (t) => {
    t.plan(1)

    const path = 'file.json'
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack.org/hub/'
    }

    const fullReadUrl = 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/file.json'
    const fileContent = { test: 'test' }

    const getOrSetLocalGaiaHubConnection = sinon.stub().resolves(gaiaHubConfig)
    const uploadToGaiaHub = sinon.stub().resolves(fullReadUrl)

    const { putFile } = proxyquire('../../../lib/storage', {
      './hub': { getOrSetLocalGaiaHubConnection, uploadToGaiaHub },
    })

    putFile(path, fileContent)
      .then((publicURL) => {
        t.ok(publicURL, fullReadUrl)
      })
  })

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

  test('getBucketUrl', (t) => {
    t.plan(2)
    const hubServer = 'hub2.testblockstack.org'

    const hubInfo = {
      read_url_prefix: 'https://gaia.testblockstack.org/hub/',
      challenge_text: 'please-sign',
    }

    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const address = '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U'

    FetchMock.get(`${hubServer}/hub_info`, JSON.stringify(hubInfo))

    getBucketUrl(hubServer, privateKey)
      .then((bucketUrl) => {
        t.ok(bucketUrl, 'App index file URL returned by getBucketUrl')
        t.equal(bucketUrl, `${hubInfo.read_url_prefix}${address}/`)
      })
  })

  test('getUserAppFileUrl', (t) => {
    t.plan(2)

    const path = 'file.json'
    const name = 'test.id'
    const appOrigin = 'testblockstack.org'
    const profile = {
      'apps': {
        'testblockstack.org': 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/'
      }
    }

    const fileUrl = "https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/file.json"

    const lookupProfile = sinon.stub().resolves(profile)

    const { getUserAppFileUrl } = proxyquire('../../../lib/storage', {
      '../profiles': { lookupProfile }
    })

    getUserAppFileUrl(path, name, appOrigin)
      .then((url) => {
        t.ok(url, 'Returns user app file url')
        t.equals(url, fileUrl)
      })
  })

}
