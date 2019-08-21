import * as test from 'tape'
import * as FetchMock from 'fetch-mock'
import * as proxyquire from 'proxyquire'
import * as sinon from 'sinon'
import { TokenSigner, TokenVerifier, decodeToken } from 'jsontokens'
import {
  uploadToGaiaHub, getFullReadUrl,
  connectToGaiaHub,
  getBucketUrl,
  deleteFromGaiaHub
} from '../../../src/storage/hub'
import { getFile, getFileUrl, putFile, listFiles, deleteFile } from '../../../src/storage'
import { getPublicKeyFromPrivate } from '../../../src/keys'

import { UserSession, AppConfig } from '../../../src'

// class LocalStorage {
//   constructor() {
//     this.data = {}
//   }
//
//   setItem(k, v) {
//     this.data[k] = v
//   }
//
//   removeItem(k) {
//     delete this.data[k]
//   }
//
//   getItem(k) {
//     return this.data[k]
//   }
// }
// const localStorage = new LocalStorage()
// global.localStorage = localStorage
// global.window = {}
// global.window.localStorage = localStorage
// global.window.location = {}
// global.window.location.origin = 'https://myApp.blockstack.org'

export function runStorageTests() {
  test('deleteFile', (t) => {
    t.plan(1)

    const path = 'file.json'
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack.org/hub/'
    }

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      gaiaHubConfig
    }

    const deleteFromGaiaHub = sinon.stub().resolves()
    const { deleteFile } = proxyquire('../../../src/storage', {
      './hub': { deleteFromGaiaHub }
    })

    const options = { wasSigned: false }
    deleteFile(path, options, blockstack)
      .then(() => {
        t.pass('Delete file')
      })
  })

  test('deleteFile gets a new gaia config and tries again', (t) => {
    t.plan(3)

    const path = 'file.txt'
    const fullDeleteUrl = 'https://hub.testblockstack.org/delete/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yabc/file.txt'
    const invalidHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yabc',
      server: 'https://hub.testblockstack.org',
      token: '',
      url_prefix: 'https://gaia.testblockstack.org/hub/'
    }
    const validHubConfig = Object.assign({}, invalidHubConfig, {
      token: 'valid'
    })
    const connectToGaiaHub = sinon.stub().resolves(validHubConfig)

    const UserSessionClass = proxyquire('../../../src/auth/userSession', {
      '../storage/hub': {
        connectToGaiaHub
      }
    }).UserSession as typeof UserSession

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSessionClass({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      gaiaHubConfig: invalidHubConfig,
      hubUrl: 'https://hub.testblockstack.org'
    }

    const { deleteFile } = proxyquire('../../../src/storage', {
      './hub': {
        connectToGaiaHub
      }
    })

    FetchMock.delete(fullDeleteUrl, (url, { headers }) => {
      console.log(url, headers)
      if ((<any>headers).Authorization === 'bearer ') {
        t.ok(true, 'tries with invalid token')
        return 401
      } else if ((<any>headers).Authorization === 'bearer valid') {
        t.ok(true, 'Tries with valid hub config')
        return 202
      }
      return 401
    })
    deleteFile(path, { }, blockstack)
      .then(() => t.ok(true, 'Request should pass'))
  })

  test('deleteFile wasSigned deletes signature file', (t) => {
    t.plan(3)

    const path = 'file.json'
    const fullDeleteUrl = 'https://hub.testblockstack.org/delete/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yabc/file.json'
    const fullDeleteSigUrl = 'https://hub.testblockstack.org/delete/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yabc/file.json.sig'
    const hubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yabc',
      server: 'https://hub.testblockstack.org',
      url_prefix: 'https://gaia.testblockstack.org/hub/'
    }
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      gaiaHubConfig: hubConfig
    }

    FetchMock.delete(fullDeleteUrl, (url, { headers }) => {
      console.log(url, headers)
      t.pass('delete main file request')
      return 202
    })

    FetchMock.delete(fullDeleteSigUrl, (url, { headers }) => {
      console.log(url, headers)
      t.pass('delete sig file request')
      return 202
    })

    deleteFile(path, { wasSigned: true }, blockstack)
      .then(() => t.ok(true, 'Request should pass'))
  })

  test('deleteFile throw on 404', (t) => {
    t.plan(2)

    const path = 'missingfile.txt'
    const fullDeleteUrl = 'https://hub.testblockstack.org/delete/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yabc/missingfile.txt'
    const hubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yabc',
      server: 'https://hub.testblockstack.org',
      url_prefix: 'https://gaia.testblockstack.org/hub/'
    }
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      gaiaHubConfig: hubConfig
    }

    FetchMock.delete(fullDeleteUrl, (url, { headers }) => {
      console.log(url, headers)
      t.pass('delete file requested')
      return 404
    })

    deleteFile(path, { wasSigned: false }, blockstack)
      .then(() => t.fail('deleteFile with 404 should fail'))
      .catch(() => t.pass('deleteFile with 404 should fail'))
  })

  test('getFile unencrypted, unsigned', (t) => {
    t.plan(2)

    const path = 'file.json'
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'https://gaia.testblockstack.org/hub/'
    }

    const fullReadUrl = 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/file.json'
    const fileContent = { test: 'test' }

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      gaiaHubConfig
    } // manually set private key for testing

    FetchMock.get(fullReadUrl, fileContent)
    const options = { decrypt: false }
    getFile(path, options, blockstack)
      .then((file) => {
        t.ok(file, 'Returns file content')
        t.same(JSON.parse(<string>file), fileContent)
      })
  })

  test('getFile unencrypted, unsigned - multi-reader', (t) => {
    t.plan(6)

    const path = 'file.json'
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'https://gaia.testblockstack.org/hub/'
    }

    const appConfig = new AppConfig(['store_write'], 'http://localhost:8080')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      gaiaHubConfig
    }

    const fullReadUrl = 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/file.json'
    const fileContent = { test: 'test' }

    FetchMock.get(fullReadUrl, fileContent)

    const nameLookupUrl = 'https://core.blockstack.org/v1/names/yukan.id'

    const nameRecord = {
      status: 'registered',
      zonefile: '$ORIGIN yukan.id\n$TTL 3600\n_http._tcp URI 10 1 "https://gaia.blockstack.org/hub/16zVUoP7f15nfTiHw2UNiX8NT5SWYqwNv3/0/profile.json"\n',
      expire_block: 581432,
      blockchain: 'bitcoin',
      last_txid: 'f7fa811518566b1914a098c3bd61a810aee56390815bd608490b0860ac1b5b4d',
      address: '16zVUoP7f15nfTiHw2UNiX8NT5SWYqwNv3',
      zonefile_hash: '98f42e11026d42d394b3424d4d7f0cccd6f376e2'
    }
    const nameRecordContent = JSON.stringify(nameRecord)
    FetchMock.get(nameLookupUrl, nameRecordContent)

    const profileUrl = 'https://gaia.blockstack.org/hub/16zVUoP7f15nfTiHw2UNiX8NT5SWYqwNv3/0/profile.json'

    /* eslint-disable */
    const profileContent = [
      {
        'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJqdGkiOiJjNDhmOTQ0OC1hMGZlLTRiOWUtOWQ2YS1mYzA5MzhjOGUyNzAiLCJpYXQiOiIyMDE4LTAxLTA4VDE4OjIyOjI0Ljc5NloiLCJleHAiOiIyMDE5LTAxLTA4VDE4OjIyOjI0Ljc5NloiLCJzdWJqZWN0Ijp7InB1YmxpY0tleSI6IjAyNDg3YTkxY2Q5NjZmYWVjZWUyYWVmM2ZkZTM3MjgwOWI0NmEzNmVlMTkyNDhjMDFmNzJiNjQ1ZjQ0Y2VmMmUyYyJ9LCJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDI0ODdhOTFjZDk2NmZhZWNlZTJhZWYzZmRlMzcyODA5YjQ2YTM2ZWUxOTI0OGMwMWY3MmI2NDVmNDRjZWYyZTJjIn0sImNsYWltIjp7IkB0eXBlIjoiUGVyc29uIiwiQGNvbnRleHQiOiJodHRwOi8vc2NoZW1hLm9yZyIsImltYWdlIjpbeyJAdHlwZSI6IkltYWdlT2JqZWN0IiwibmFtZSI6ImF2YXRhciIsImNvbnRlbnRVcmwiOiJodHRwczovL3d3dy5kcm9wYm94LmNvbS9zL2oxaDBrdHMwbTdhYWRpcC9hdmF0YXItMD9kbD0xIn1dLCJnaXZlbk5hbWUiOiIiLCJmYW1pbHlOYW1lIjoiIiwiZGVzY3JpcHRpb24iOiIiLCJhY2NvdW50IjpbeyJAdHlwZSI6IkFjY291bnQiLCJwbGFjZWhvbGRlciI6ZmFsc2UsInNlcnZpY2UiOiJoYWNrZXJOZXdzIiwiaWRlbnRpZmllciI6Inl1a2FubCIsInByb29mVHlwZSI6Imh0dHAiLCJwcm9vZlVybCI6Imh0dHBzOi8vbmV3cy55Y29tYmluYXRvci5jb20vdXNlcj9pZD15dWthbmwifSx7IkB0eXBlIjoiQWNjb3VudCIsInBsYWNlaG9sZGVyIjpmYWxzZSwic2VydmljZSI6ImdpdGh1YiIsImlkZW50aWZpZXIiOiJ5a25sIiwicHJvb2ZUeXBlIjoiaHR0cCIsInByb29mVXJsIjoiaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20veWtubC8xZjcwMThiOThmNzE2ZjAxNWE2Y2Y0NGZkYTA4MDZkNyJ9LHsiQHR5cGUiOiJBY2NvdW50IiwicGxhY2Vob2xkZXIiOmZhbHNlLCJzZXJ2aWNlIjoidHdpdHRlciIsImlkZW50aWZpZXIiOiJ5dWthbmwiLCJwcm9vZlR5cGUiOiJodHRwIiwicHJvb2ZVcmwiOiJodHRwczovL3R3aXR0ZXIuY29tL3l1a2FuTC9zdGF0dXMvOTE2NzQwNzQ5MjM2MTAxMTIwIn1dLCJuYW1lIjoiS2VuIExpYW8iLCJhcHBzIjp7Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MCI6Imh0dHBzOi8vZ2FpYS5ibG9ja3N0YWNrLm9yZy9odWIvMUREVXFmS3RRZ1lOdDcyMnd1QjRaMmZQQzdhaU5HUWE1Ui8ifX19.UyQNZ02kBFHEovbwiGaS-VQd57w9kcwn1Nt3QbW3afEMArg1OndmeplB7lzjMuRCLAi-88lkpQLkFw7LwKZ31Q',
        'decodedToken': {
          'header': {
            'typ': 'JWT',
            'alg': 'ES256K'
          },
          'payload': {
            'jti': 'c48f9448-a0fe-4b9e-9d6a-fc0938c8e270',
            'iat': '2018-01-08T18:22:24.796Z',
            'exp': '2019-01-08T18:22:24.796Z',
            'subject': {
              'publicKey': '02487a91cd966faecee2aef3fde372809b46a36ee19248c01f72b645f44cef2e2c'
            },
            'issuer': {
              'publicKey': '02487a91cd966faecee2aef3fde372809b46a36ee19248c01f72b645f44cef2e2c'
            },
            'claim': {
              '@type': 'Person',
              '@context': 'http://schema.org',
              'image': [
                {
                  '@type': 'ImageObject',
                  'name': 'avatar',
                  'contentUrl': 'https://www.dropbox.com/s/j1h0kts0m7aadip/avatar-0?dl=1'
                }
              ],
              'givenName': '',
              'familyName': '',
              'description': '',
              'account': [
                {
                  '@type': 'Account',
                  'placeholder': false,
                  'service': 'hackerNews',
                  'identifier': 'yukanl',
                  'proofType': 'http',
                  'proofUrl': 'https://news.ycombinator.com/user?id=yukanl'
                },
                {
                  '@type': 'Account',
                  'placeholder': false,
                  'service': 'github',
                  'identifier': 'yknl',
                  'proofType': 'http',
                  'proofUrl': 'https://gist.github.com/yknl/1f7018b98f716f015a6cf44fda0806d7'
                },
                {
                  '@type': 'Account',
                  'placeholder': false,
                  'service': 'twitter',
                  'identifier': 'yukanl',
                  'proofType': 'http',
                  'proofUrl': 'https://twitter.com/yukanL/status/916740749236101120'
                }
              ],
              'name': 'Ken Liao',
              'apps': {
                'http://localhost:8080': 'https://gaia.blockstack.org/hub/1DDUqfKtQgYNt722wuB4Z2fPC7aiNGQa5R/'
              }
            }
          },
          'signature': 'UyQNZ02kBFHEovbwiGaS-VQd57w9kcwn1Nt3QbW3afEMArg1OndmeplB7lzjMuRCLAi-88lkpQLkFw7LwKZ31Q'
        }
      }
    ]
    /* eslint-enable */
    FetchMock.get(profileUrl, profileContent)

    const fileUrl = 'https://gaia.blockstack.org/hub/1DDUqfKtQgYNt722wuB4Z2fPC7aiNGQa5R/file.json'
    const fileContents = JSON.stringify({ key: 'value' })
    FetchMock.get(fileUrl, fileContents)

    const options = {
      username: 'yukan.id',
      app: 'http://localhost:8080',
      decrypt: false
    }

    getFile(path, options, blockstack)
      .then((file) => {
        t.ok(file, 'Returns file content')
        t.same(JSON.parse(<string>file), JSON.parse(fileContents))
      })

    const optionsNameLookupUrl = {
      username: 'yukan.id',
      app: 'http://localhost:8080',
      zoneFileLookupURL: 'https://potato/v1/names',
      decrypt: false
    }

    FetchMock.get('https://potato/v1/names/yukan.id', nameRecordContent)
    getFile(path, optionsNameLookupUrl, blockstack)
      .then((file) => {
        t.ok(file, 'Returns file content')
        t.same(JSON.parse(<string>file), JSON.parse(fileContents))
      })

    const optionsNoApp = {
      username: 'yukan.id',
      decrypt: false
    }

    getFile(path, optionsNoApp, blockstack)
      .then((file) => {
        t.ok(file, 'Returns file content')
        t.same(JSON.parse(<string>file), JSON.parse(fileContents))
      })
  })

  test('encrypt & decrypt content', (t) => {
    t.plan(2)
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey
    } // manually set private key for testing

    const content = 'yellowsubmarine'
    const ciphertext = blockstack.encryptContent(content)
    t.ok(ciphertext)
    const deciphered = blockstack.decryptContent(ciphertext)
    t.equal(content, deciphered)
  })

  test('encrypt & decrypt content -- specify key', (t) => {
    t.plan(2)
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    const privateKey = '896adae13a1bf88db0b2ec94339b62382ec6f34cd7e2ff8abae7ec271e05f9d8'
    const publicKey = getPublicKeyFromPrivate(privateKey)
    const content = 'we-all-live-in-a-yellow-submarine'
    const ciphertext = blockstack.encryptContent(content, { publicKey })
    t.ok(ciphertext)
    const deciphered = blockstack.decryptContent(ciphertext, { privateKey })
    t.equal(content, deciphered)
  })

  test('putFile unencrypted, not signed', (t) => {
    t.plan(1)

    const path = 'file.json'
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack.org/hub/'
    }

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      gaiaHubConfig
    }

    const fullReadUrl = 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/file.json'
    const fileContent = { test: 'test' }

    const uploadToGaiaHub = sinon.stub().resolves(fullReadUrl) // eslint-disable-line no-shadow

    const { putFile } = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    })

    const options = { encrypt: false }

    putFile(path, fileContent, options, blockstack)
      .then((publicURL) => {
        t.ok(publicURL, fullReadUrl)
      })
  })

  test('putFile & getFile unencrypted, not signed, with contentType', (t) => {
    t.plan(3)
    const path = 'file.html'
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'https://gaia.testblockstack.org/hub/'
    }

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      gaiaHubConfig
    }

    const fullReadUrl = 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/file.html'
    const fileContent = '<!DOCTYPE html><html><head><title>Title</title></head><body>Blockstack</body></html>'

    const uploadToGaiaHub = sinon.stub().resolves(fullReadUrl) // eslint-disable-line no-shadow

    const { putFile } = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    })

    const config = {
      status: 200,
      body: fileContent,
      headers: { 'Content-Type': 'text/html' }
    }
    FetchMock.get(fullReadUrl, config)

    const options = { encrypt: false, contentType: 'text/html' }
    putFile(path, fileContent, options, blockstack)
      .then((publicURL) => {
        t.ok(publicURL, fullReadUrl)
      })
      .then(() => {
        const decryptOptions = { decrypt: false }
        getFile(path, decryptOptions, blockstack).then((readContent) => {
          t.equal(readContent, fileContent)
          t.ok(typeof (readContent) === 'string')
        })
      })
  })

  test('putFile & getFile encrypted, not signed', (t) => {
    t.plan(2)

    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })

    const path = 'file.json'
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'https://gaia.testblockstack.org/hub/'
    }

    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey,
      gaiaHubConfig
    } // manually set private key for testing

    const fullReadUrl = 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8A/file.json'
    const fileContent = JSON.stringify({ test: 'test' })

    const uploadToGaiaHub = sinon.stub().resolves(fullReadUrl) // eslint-disable-line no-shadow
    const getFullReadUrl = sinon.stub().resolves(fullReadUrl) // eslint-disable-line no-shadow

    const { putFile } = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    })
    const { getFile } = proxyquire('../../../src/storage', { // eslint-disable-line no-shadow
      './hub': { getFullReadUrl }
    })

    FetchMock.get(fullReadUrl, blockstack.encryptContent(fileContent))
    const encryptOptions = { encrypt: true }
    const decryptOptions = { decrypt: true }
    // put and encrypt the file
    putFile(path, fileContent, encryptOptions, blockstack)
      .then((publicURL) => {
        t.ok(publicURL, fullReadUrl)
      }).then(() => {
        // read and decrypt the file
        getFile(path, decryptOptions, blockstack).then((readContent) => {
          t.equal(readContent, fileContent)
          // put back whatever was inside before
        })
      })
  })

  test('putFile encrypt/no-sign using specifying public key & getFile decrypt', (t) => {
    t.plan(2)

    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const publicKey = getPublicKeyFromPrivate(privateKey)

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })

    const path = 'file.json'
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'https://gaia.testblockstack.org/hub/'
    }

    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey,
      gaiaHubConfig
    } // manually set private key for testing

    const fullReadUrl = 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8A/file.json'
    const fileContent = JSON.stringify({ test: 'test' })

    const uploadToGaiaHub = sinon.stub().resolves(fullReadUrl) // eslint-disable-line no-shadow
    const getFullReadUrl = sinon.stub().resolves(fullReadUrl) // eslint-disable-line no-shadow

    const { putFile } = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    })
    const { getFile } = proxyquire('../../../src/storage', { // eslint-disable-line no-shadow
      './hub': { getFullReadUrl }
    })

    FetchMock.get(fullReadUrl, blockstack.encryptContent(fileContent))
    const encryptOptions = { encrypt: publicKey }
    const decryptOptions = { decrypt: true }
    // put and encrypt the file
    putFile(path, fileContent, encryptOptions, blockstack)
      .then((publicURL) => {
        t.ok(publicURL, fullReadUrl)
      }).then(() => {
        // read and decrypt the file
        getFile(path, decryptOptions, blockstack).then((readContent) => {
          t.equal(readContent, fileContent)
        })
      })
  })

  test('putFile & getFile encrypted, signed', (t) => {
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'https://gaia.testblockstack2.org/hub/'
    }
    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey,
      gaiaHubConfig
    } // manually set private key for testing
    const readPrefix = 'https://gaia.testblockstack8.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U'
    const fullReadUrl = `${readPrefix}/file.json`
    const urlBadPK = `${readPrefix}/badPK.json`
    const urlBadSig = `${readPrefix}/badSig.json`
    const fileContent = JSON.stringify({ test: 'test' })
    const badPK = '0288580b020800f421d746f738b221d384f098e911b81939d8c94df89e74cba776'

    let putFiledContents = ''
    const uploadToGaiaHub = sinon.stub().callsFake( // eslint-disable-line no-shadow
      (fname, contents) => {
        putFiledContents = contents
        return Promise.resolve(`${readPrefix}/${fname}`)
      }
    )

    const getFullReadUrl = sinon.stub().callsFake( // eslint-disable-line no-shadow
      path => Promise.resolve(`${readPrefix}/${path}`)
    )

    const lookupProfile = sinon.stub().callsFake(
      (username) => {
        t.equal(username, 'applejacks.id', 'Unexpected user lookup request')
        return Promise.resolve({ apps: { origin: readPrefix } })
      }
    )

    const { putFile } = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    })
    const { getFile } = proxyquire('../../../src/storage', { // eslint-disable-line no-shadow
      './hub': { getFullReadUrl },
      '../profiles/profileLookup': { lookupProfile }
    })

    const encryptOptions = { encrypt: true, sign: true }
    const decryptOptions = { decrypt: true, verify: true }
    // put and encrypt the file
    putFile('doesnt-matter.json', fileContent, encryptOptions, blockstack)
      .then((publicURL) => {
        t.ok(publicURL, fullReadUrl)
        FetchMock.get(fullReadUrl, putFiledContents)
        const contentsObj = JSON.parse(putFiledContents)
        FetchMock.get(urlBadPK, JSON.stringify({
          signature: contentsObj.signature,
          publicKey: badPK,
          cipherText: contentsObj.cipherText
        }))
        FetchMock.get(urlBadSig, JSON.stringify({
          signature: contentsObj.signature,
          publicKey: contentsObj.publicKey,
          cipherText: 'potato potato potato'
        }))
      }).then(() => getFile('file.json', decryptOptions, blockstack).then((readContent) => {
        t.equal(readContent, fileContent)
      }))
      .then(() => getFile('file.json', {
        decrypt: true,
        verify: true,
        username: 'applejacks.id',
        app: 'origin'
      }, blockstack)
        .then((readContent) => {
          t.equal(readContent, fileContent)
        }))
      .then(() => getFile('badPK.json', decryptOptions, blockstack)
        .then(() => t.true(false, 'Should not successfully decrypt file'))
        .catch(err => t.ok(err.message.indexOf('doesn\'t match gaia address') >= 0,
                           `Should fail with complaint about mismatch PK: ${err.message}`)))
      .then(() => getFile('badPK.json', {
        decrypt: true,
        verify: true,
        username: 'applejacks.id',
        app: 'origin'
      }, blockstack)
        .then(() => t.true(false, 'Should not successfully decrypt file'))
        .catch(err => t.ok(err.message.indexOf('doesn\'t match gaia address') >= 0,
                           `Should fail with complaint about mismatch PK: ${err.message}`)))
      .then(() => getFile('badSig.json', decryptOptions, blockstack)
        .then(() => t.true(false, 'Should not successfully decrypt file'))
        .catch(err => t.ok(err.message.indexOf('do not match ECDSA') >= 0,
                           'Should fail with complaint about bad signature')))
      .catch(err => console.log(err.stack))
      .then(() => {
        t.end()
      })
  })

  test('putFile & getFile unencrypted, signed', (t) => {
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })

    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack2.org/hub/'
    }

    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey,
      gaiaHubConfig
    } // manually set private key for testing

    const readPrefix = 'https://gaia.testblockstack4.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U'

    const goodPath = 'file.json'
    const badPKPath = 'badPK.json'
    const badSigPath = 'badSig.json'
    const noSigPath = 'noSig.json'

    const fileContent = JSON.stringify({ test: 'test' })
    const badPK = '0288580b020800f421d746f738b221d384f098e911b81939d8c94df89e74cba776'

    const putFiledContents = []
    const pathToReadUrl = (fname => `${readPrefix}/${fname}`)

    const uploadToGaiaHub = sinon.stub().callsFake( // eslint-disable-line no-shadow
      (fname, contents) => {
        putFiledContents.push([fname, contents])
        if (!fname.endsWith('.sig')) {
          t.equal(contents, fileContent)
        }
        return Promise.resolve(pathToReadUrl(fname))
      }
    )

    const getFullReadUrl = sinon.stub().callsFake( // eslint-disable-line no-shadow
      path => Promise.resolve(pathToReadUrl(path))
    )

    const lookupProfile = sinon.stub().callsFake(
      (username) => {
        t.equal(username, 'applejacks.id', 'Unexpected user lookup request')
        return Promise.resolve({ apps: { origin: readPrefix } })
      }
    )

    const { putFile } = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    })
    const { getFile } = proxyquire('../../../src/storage', { // eslint-disable-line no-shadow
      './hub': { getFullReadUrl },
      '../profiles/profileLookup': { lookupProfile }
    })

    const encryptOptions = { encrypt: false, sign: true }
    const decryptOptions = { decrypt: false, verify: true }
    const multiplayerDecryptOptions = {
      username: 'applejacks.id',
      decrypt: false,
      verify: true,
      app: 'origin'
    }
    // put and encrypt the file
    putFile(goodPath, fileContent, encryptOptions, blockstack)
      .then((publicURL) => {
        t.equal(publicURL, pathToReadUrl(goodPath))
        t.equal(putFiledContents.length, 2)

        let sigContents = ''
        // good path mocks
        putFiledContents.forEach(
          ([path, contents]) => {
            FetchMock.get(pathToReadUrl(path),
                          contents)
            if (path.endsWith('.sig')) {
              sigContents = contents
            }
          }
        )
        const sigObject = JSON.parse(sigContents)
        // bad sig mocks
        FetchMock.get(pathToReadUrl(badSigPath), 'hello world, this is inauthentic.')
        FetchMock.get(pathToReadUrl(`${badSigPath}.sig`), sigContents)

        // no sig mocks
        FetchMock.get(pathToReadUrl(noSigPath), 'hello world, this is inauthentic.')
        FetchMock.get(pathToReadUrl(`${noSigPath}.sig`), { status: 404, body: 'nopers.' })

        // bad pk mocks
        FetchMock.get(pathToReadUrl(badPKPath), fileContent)
        FetchMock.get(pathToReadUrl(`${badPKPath}.sig`),
                      JSON.stringify({
                        signature: sigObject.signature,
                        publicKey: badPK
                      }))
      })
      .then(() => getFile(goodPath, decryptOptions, blockstack).then((readContent) => {
        t.equal(readContent, fileContent, 'should read the file')
      }))
      .then(() => getFile(badSigPath, decryptOptions, blockstack)
        .then(() => t.fail('Should have failed to read file.'))
        .catch(err => t.ok(err.message.indexOf('do not match ECDSA') >= 0,
                           'Should fail with complaint about bad signature')))
      .then(() => getFile(noSigPath, decryptOptions, blockstack)
        .then(() => t.fail('Should have failed to read file.'))
        .catch(err => t.ok(err.message.indexOf('obtain signature for file') >= 0,
                           'Should fail with complaint about missing signature')))
      .then(() => getFile(badPKPath, decryptOptions, blockstack)
        .then(() => t.fail('Should have failed to read file.'))
        .catch(err => t.ok(err.message.indexOf('match gaia address') >= 0,
                           'Should fail with complaint about matching addresses')))
      .then(() => getFile(goodPath, multiplayerDecryptOptions, blockstack)
        .then((readContent) => {
          t.equal(readContent, fileContent, 'should read the file')
        }))
      .then(() => getFile(badSigPath, multiplayerDecryptOptions, blockstack)
        .then(() => t.fail('Should have failed to read file.'))
        .catch(err => t.ok(err.message.indexOf('do not match ECDSA') >= 0,
                           'Should fail with complaint about bad signature')))
      .then(() => getFile(noSigPath, multiplayerDecryptOptions, blockstack)
        .then(() => t.fail('Should have failed to read file.'))
        .catch(err => t.ok(err.message.indexOf('obtain signature for file') >= 0,
                           'Should fail with complaint about missing signature')))
      .then(() => getFile(badPKPath, multiplayerDecryptOptions, blockstack)
        .then(() => t.fail('Should have failed to read file.'))
        .catch(err => t.ok(err.message.indexOf('match gaia address') >= 0,
                           'Should fail with complaint about matching addresses')))
      .catch((err) => {
        console.log(err.stack)
        t.fail('Unexpected error!')
      })
      .then(() => {
        t.end()
      })
  })

  test('promises reject', (t) => {
    t.plan(2)
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    const path = 'file.json'
    const fullReadUrl = 'https://hub.testblockstack.org/store/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/file.json'
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.testblockstack.org',
      token: '',
      url_prefix: 'https://gaia.testblockstack.org/hub/'
    }
    blockstack.store.getSessionData().userData = <any>{
      gaiaHubConfig
    }

    FetchMock.post(`${fullReadUrl}`, { status: 404, body: 'Not found.' })
    putFile(path, 'hello world', { encrypt: false }, blockstack)
      .then(() => t.ok(false, 'Should not have returned'))
      .catch(() => t.ok(true, 'Should have rejected promise'))

    const gaiaHubUrl = 'https://potato.hub.farm'
    const signer = '01010101'
    FetchMock.get('https://potato.hub.farm/hub_info', { status: 421, body: 'Nope.' })
    connectToGaiaHub(gaiaHubUrl, signer)
      .then(() => t.ok(false, 'Should not have returned'))
      .catch(() => t.ok(true, 'Should have rejected promise'))
  })

  test('putFile gets a new gaia config and tries again', (t) => {
    t.plan(3)

    const path = 'file.json'
    const fullWriteUrl = 'https://hub.testblockstack.org/store/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yabc/file.json'
    const invalidHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yabc',
      server: 'https://hub.testblockstack.org',
      token: '',
      url_prefix: 'https://gaia.testblockstack.org/hub/'
    }
    const validHubConfig = Object.assign({}, invalidHubConfig, {
      token: 'valid'
    })
    const connectToGaiaHub = sinon.stub().resolves(validHubConfig)

    const UserSessionClass = proxyquire('../../../src/auth/userSession', {
      '../storage/hub': {
        connectToGaiaHub
      }
    }).UserSession as typeof UserSession

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSessionClass({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      gaiaHubConfig: invalidHubConfig,
      hubUrl: 'https://hub.testblockstack.org'
    }

    const { putFile } = proxyquire('../../../src/storage', {
      './hub': {
        connectToGaiaHub
      }
    })

    FetchMock.post(fullWriteUrl, (url, { headers }) => {
      console.log(url, headers)
      if ((<any>headers).Authorization === 'bearer ') {
        t.ok(true, 'tries with invalid token')
        return 401
      } else if ((<any>headers).Authorization === 'bearer valid') {
        t.ok(true, 'Tries with valid hub config')
        return {
          status: 200,
          body: JSON.stringify({ publicURL: 'readURL' })
        }
      }
      return 401
    })
    putFile(path, 'hello world', { encrypt: false }, blockstack)
      .then(() => t.ok(true, 'Request should pass'))
  })

  test('getFileUrl', (t) => { 
    t.plan(2)
    const config = {
      address: '19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk',
      url_prefix: 'https://gaia.testblockstack.org/hub/',
      token: '',
      server: 'https://hub.testblockstack.org'
    }

    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey,
      gaiaHubConfig: config
    } // manually set for testing

    FetchMock.get(`${config.url_prefix}${config.address}/foo.json`,
                  { status: 404 })

    getFileUrl('foo.json', {}, blockstack)
      .then(x => t.equal(
        x, 
        'https://gaia.testblockstack.org/hub/19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk/foo.json', 
        'getFileUrlImpl should return correct url'))

    blockstack.getFileUrl('foo.json') 
      .then(x => t.equal(
        x, 
        'https://gaia.testblockstack.org/hub/19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk/foo.json', 
        'UserSession.getFileUrl should return correct url'))
  })

  test('fetch404null', (t) => {
    t.plan(2)
    const config = {
      address: '19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk',
      url_prefix: 'gaia.testblockstack.org/hub/',
      token: '',
      server: 'hub.testblockstack.org'
    }

    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey,
      gaiaHubConfig: config
    } // manually set for testing

    FetchMock.get(`${config.url_prefix}${config.address}/foo.json`,
                  { status: 404 })

    const optionsNoDecrypt = { decrypt: false }
    getFile('foo.json', optionsNoDecrypt, blockstack)
      .then(x => t.equal(x, null, '404 should return null'))

    const optionsDecrypt = { decrypt: true }
    getFile('foo.json', optionsDecrypt, blockstack)
      .then(x => t.equal(x, null, '404 should return null, even if we try to decrypt'))
  })

  test('uploadToGaiaHub', (t) => {
    t.plan(2)

    const config = {
      address: '19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk',
      url_prefix: 'gaia.testblockstack.org',
      token: '',
      server: 'hub.testblockstack.org'
    }

    FetchMock.post(`${config.server}/store/${config.address}/foo.json`,
                   JSON.stringify({ publicURL: `${config.url_prefix}/${config.address}/foo.json` }))

    uploadToGaiaHub('foo.json', 'foo the bar', config)
      .then((url) => {
        t.ok(url, 'URL returned')
        t.equal(url, `${config.url_prefix}/${config.address}/foo.json`)
      })
  })

  test('deleteFromGaiaHub', (t) => {
    t.plan(1)

    const config = {
      address: '19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk',
      url_prefix: 'gaia.testblockstack.org',
      token: '',
      server: 'hub.testblockstack.org'
    }

    FetchMock.delete(`${config.server}/delete/${config.address}/foo.json`, 202)

    deleteFromGaiaHub('foo.json', config)
      .then(() => {
        t.pass('Delete http request made')
      })
  })

  test('getFullReadUrl', (t) => {
    t.plan(1)

    const config = {
      address: '19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk',
      url_prefix: 'gaia.testblockstack.org',
      token: '',
      server: 'hub.testblockstack.org'
    }

    getFullReadUrl('foo.json', config).then((outUrl) => {
      t.equal(`${config.url_prefix}${config.address}/foo.json`, outUrl)
    })
  })

  test('connectToGaiaHub', (t) => {
    t.plan(6)

    const hubServer = 'hub.testblockstack.org'

    const hubInfo = {
      read_url_prefix: 'gaia.testblockstack.org',
      challenge_text: 'please-sign',
      latest_auth_version: 'v1'
    }

    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const address = '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U'
    const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'

    FetchMock.get(`${hubServer}/hub_info`,
                  JSON.stringify(hubInfo))

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey
    } // manually set for testing

    connectToGaiaHub(hubServer, privateKey)
      .then((config) => {
        t.ok(config, 'Config returned by connectToGaiaHub()')
        t.equal(hubInfo.read_url_prefix, config.url_prefix)
        t.equal(address, config.address)
        t.equal(hubServer, config.server)
        const jsonTokenPart = config.token.slice('v1:'.length)

        const verified = new TokenVerifier('ES256K', publicKey)
          .verify(jsonTokenPart)
        t.ok(verified, 'Verified token')
        t.equal(hubServer, decodeToken(jsonTokenPart).payload.hubUrl, 'Intended hubUrl')
      })
  })

  test('connectToGaiaHub with an association token', (t) => {
    t.plan(7)

    const hubServer = 'hub.testblockstack.org'

    const hubInfo = {
      read_url_prefix: 'gaia.testblockstack.org',
      challenge_text: 'please-sign',
      latest_auth_version: 'v1'
    }

    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const address = '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U'
    const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'

    const identityPrivateKey = '4dea04fe440d760664d96f1fd219e7a73324fc8faa28c7babd1a7813d05970aa01'
    const identityPublicKey = '0234f3c7aec9fe13190aede94d1eaa0a7d2b48d18fd86b9651fc3996a5f467fc73'

    const FOUR_MONTH_SECONDS = 60 * 60 * 24 * 31 * 4
    const salt = '00000000000000000000000000000'
    const associationTokenClaim = {
      childToAssociate: publicKey,
      iss: identityPublicKey,
      exp: FOUR_MONTH_SECONDS + (Date.now() / 1000),
      salt
    }
    const gaiaAssociationToken = new TokenSigner('ES256K', identityPrivateKey)
      .sign(associationTokenClaim)

    FetchMock.get(`${hubServer}/hub_info`,
                  JSON.stringify(hubInfo))

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey
    } // manually set for testing

    connectToGaiaHub(hubServer, privateKey, gaiaAssociationToken)
      .then((config) => {
        t.ok(config, 'Config returned by connectToGaiaHub()')
        t.equal(hubInfo.read_url_prefix, config.url_prefix)
        t.equal(address, config.address)
        t.equal(hubServer, config.server)
        const jsonTokenPart = config.token.slice('v1:'.length)

        const verified = new TokenVerifier('ES256K', publicKey)
          .verify(jsonTokenPart)
        t.ok(verified, 'Verified token')
        t.equal(hubServer, decodeToken(jsonTokenPart).payload.hubUrl, 'Intended hubUrl')
        t.equal(gaiaAssociationToken, decodeToken(jsonTokenPart).payload.associationToken,
                'Intended association token')
      })
  })

  test('getBucketUrl', (t) => {
    t.plan(2)
    const hubServer = 'hub2.testblockstack.org'

    const hubInfo = {
      read_url_prefix: 'https://gaia.testblockstack.org/hub/',
      challenge_text: 'please-sign',
      latest_auth_version: 'v1'
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
      apps: {
        'testblockstack.org': 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/'
      }
    }

    const fileUrl = 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/file.json'

    const lookupProfile = sinon.stub().resolves(profile)

    const { getUserAppFileUrl } = proxyquire('../../../src/storage', {
      '../profiles/profileLookup': { lookupProfile }
    })

    getUserAppFileUrl(path, name, appOrigin)
      .then((url) => {
        t.ok(url, 'Returns user app file url')
        t.equals(url, fileUrl)
      })
  })

  test('listFiles', (t) => {
    t.plan(3)

    const path = 'file.json'
    const gaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack.org/hub/'
    }

    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey,
      gaiaHubConfig
    } // manually set for testing

    let callCount = 0
    FetchMock.post(`${gaiaHubConfig.server}/list-files/${gaiaHubConfig.address}`, () => {
      callCount += 1
      if (callCount === 1) {
        return { entries: [path], page: callCount }
      } else if (callCount === 2) {
        return { entries: [], page: callCount }
      } else {
        throw new Error('Called too many times')
      }
    })

    const files = []
    listFiles((name) => {
      files.push(name)
      return true
    }, blockstack)
      .then((count) => {
        t.equal(files.length, 1, 'Got one file back')
        t.equal(files[0], 'file.json', 'Got the right file back')
        t.equal(count, 1, 'Count matches number of files')
      })
  })


  test('connect to gaia hub with a user session and association token', (t) => {
    t.plan(1)
    const hubServer = 'hub.testblockstack.org'
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'

    const hubInfo = {
      read_url_prefix: 'gaia.testblockstack.org',
      challenge_text: 'please-sign',
      latest_auth_version: 'v1'
    }

    const address = '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U'
    const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'

    const identityPrivateKey = '4dea04fe440d760664d96f1fd219e7a73324fc8faa28c7babd1a7813d05970aa01'
    const identityPublicKey = '0234f3c7aec9fe13190aede94d1eaa0a7d2b48d18fd86b9651fc3996a5f467fc73'

    const FOUR_MONTH_SECONDS = 60 * 60 * 24 * 31 * 4
    const salt = '00000000000000000000000000000'
    const associationTokenClaim = {
      childToAssociate: publicKey,
      iss: identityPublicKey,
      exp: FOUR_MONTH_SECONDS + (Date.now() / 1000),
      salt
    }
    const gaiaAssociationToken = new TokenSigner('ES256K', identityPrivateKey)
      .sign(associationTokenClaim)

    FetchMock.get(`${hubServer}/hub_info`, JSON.stringify(hubInfo))

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey,
      hubUrl: hubServer,
      gaiaAssociationToken
    }
    blockstack.setLocalGaiaHubConnection().then((gaiaConfig) => {
      const { token } = gaiaConfig
      const { payload } = decodeToken(token.slice(2))
      t.equal(payload.associationToken, gaiaAssociationToken, 'gaia config includes association token')
    })
  })

  test('listFiles gets a new gaia config and tries again', (t) => {
    t.plan(4)

    const path = 'file.json'
    const listFilesUrl = 'https://hub.testblockstack.org/list-files/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yabc'
    const invalidHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yabc',
      server: 'https://hub.testblockstack.org',
      token: '',
      url_prefix: 'https://gaia.testblockstack.org/hub/'
    }
    const validHubConfig = Object.assign({}, invalidHubConfig, {
      token: 'valid'
    })
    const connectToGaiaHub = sinon.stub().resolves(validHubConfig)
    
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const UserSessionClass = proxyquire('../../../src/auth/userSession', {
      '../storage/hub': {
        connectToGaiaHub
      }
    }).UserSession as typeof UserSession

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSessionClass({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey,
      gaiaHubConfig: invalidHubConfig
    }

    const { listFiles } = proxyquire('../../../src/storage', {
      './hub': {
        connectToGaiaHub
      }
    })

    let callCount = 0
    FetchMock.post(listFilesUrl, (url, { headers }) => {
      if ((<any>headers).Authorization === 'bearer ') {
        t.ok(true, 'tries with invalid token')
        return 401
      }
      callCount += 1
      if (callCount === 1) {
        return { entries: [path], page: callCount }
      } else if (callCount === 2) {
        return { entries: [], page: callCount }
      } else {
        throw new Error('Called too many times')
      }
    })

    const files = []
    listFiles((name) => {
      files.push(name)
      return true
    }, blockstack)
      .then((count) => {
        t.equal(files.length, 1, 'Got one file back')
        t.equal(files[0], 'file.json', 'Got the right file back')
        t.equal(count, 1, 'Count matches number of files')
      })
  })
}
