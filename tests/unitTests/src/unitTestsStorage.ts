import * as test from 'tape-promise/tape'
import * as FetchMock from 'fetch-mock'
import * as proxyquire from 'proxyquire'
import * as sinon from 'sinon'
import * as crypto from 'crypto'
import { TokenSigner, TokenVerifier, decodeToken } from 'jsontokens'
import {
  uploadToGaiaHub, getFullReadUrl,
  connectToGaiaHub,
  getBucketUrl,
  deleteFromGaiaHub,
  GaiaHubConfig
} from '../../../src/storage/hub'
import { getFile, getFileUrl, putFile, listFiles, deleteFile } from '../../../src/storage'
import { getPublicKeyFromPrivate } from '../../../src/keys'

import { UserSession, AppConfig } from '../../../src'
import { DoesNotExist } from '../../../src/errors'
import * as util from 'util'
import * as jsdom from 'jsdom'
import { UserData } from '../../../src/auth/authApp'
import { eciesGetJsonStringLength as eciesGetJsonStringLength, aes256CbcEncrypt } from '../../../src/encryption/ec'
import { getAesCbcOutputLength, getBase64OutputLength } from '../../../src/utils'


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
  test('deleteFile', async (t) => {
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
    const deleteFile = proxyquire('../../../src/storage', {
      './hub': { deleteFromGaiaHub }
    }).deleteFile as typeof import('../../../src/storage').deleteFile

    const options = { wasSigned: false }
    await deleteFile(blockstack, path, options)
      .then(() => {
        t.pass('Delete file')
      })
  })

  test('deleteFile gets a new gaia config and tries again', async (t) => {
    t.plan(3)
    FetchMock.reset()
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

    const deleteFile = proxyquire('../../../src/storage', {
      './hub': {
        connectToGaiaHub
      }
    }).deleteFile as typeof import('../../../src/storage').deleteFile

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
    await deleteFile(blockstack, path, { })
      .then(() => t.ok(true, 'Request should pass'))
  })

  test('deleteFile wasSigned deletes signature file', async (t) => {
    t.plan(3)
    FetchMock.reset()
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

    await deleteFile(blockstack, path, { wasSigned: true })
    t.ok(true, 'Request should pass')
  })

  test('deleteFile throw on 404', (t) => {
    t.plan(2)
    FetchMock.reset()
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

    return deleteFile(blockstack, path, { wasSigned: false })
      .then(() => t.fail('deleteFile with 404 should fail'))
      .catch(() => t.pass('deleteFile with 404 should fail'))
  })

  test('deleteFile removes etag from map', async (t) => {
    FetchMock.reset()
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

    const fileContent = 'test-content'
    const testEtag = 'test-etag'

    const putOptions = { encrypt: false }
    const uploadToGaiaHub = sinon.stub().resolves({ publicURL: 'url', etag: testEtag })

    const deleteOptions = { wasSigned: false };
    const deleteFromGaiaHub = sinon.stub().resolves()

    const proxy = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub, deleteFromGaiaHub }
    })
    const putFile = proxy.putFile as typeof import('../../../src/storage').putFile;
    const deleteFile = proxy.deleteFile as typeof import('../../../src/storage').deleteFile;

    // create file and save etag
    await putFile(blockstack, path, fileContent, putOptions)

    // delete file
    await deleteFile(blockstack, path, deleteOptions);

    // create same file
    await putFile(blockstack, path, fileContent, putOptions)

    t.true(uploadToGaiaHub.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, sinon.match.any, true, undefined))
  })

  test('getFile unencrypted, unsigned', async (t) => {
    t.plan(2)
    FetchMock.reset()
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
    const file = await getFile(blockstack, path, options)
    t.ok(file, 'Returns file content')
    t.same(JSON.parse(<string>file), fileContent)
  })

  test('core node preferences respected for name lookups', async (t) => {
    FetchMock.restore()
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

    const defaultCoreNode = 'https://core.blockstack.org'
    const appSpecifiedCoreNode = 'https://app-specified-core-node.local'
    const userSpecifiedCoreNode = 'https://user-specified-core-node.local'

    const nameLookupPath = '/v1/names/yukan.id'

    const options = {
      username: 'yukan.id',
      app: 'http://localhost:8080',
      decrypt: false
    }

    await new Promise((resolve) => {
      FetchMock.get(defaultCoreNode + nameLookupPath, () => {
        resolve()
        return '_'
      })
      getFile(blockstack, path, options).catch(() => {})
    })
    t.pass('default core node used for name lookup')
    FetchMock.restore()


    blockstack.appConfig.coreNode = appSpecifiedCoreNode
    await new Promise((resolve) => {
      FetchMock.get(appSpecifiedCoreNode + nameLookupPath, () => {
        resolve()
        return '_'
      })
      getFile(blockstack, path, options).catch(() => {})
    })
    t.pass('app specified core node used for name lookup')
    FetchMock.restore()


    blockstack.store.getSessionData().userData.coreNode = userSpecifiedCoreNode
    await new Promise((resolve) => {
      FetchMock.get(userSpecifiedCoreNode + nameLookupPath, () => {
        resolve()
        return '_'
      })
      getFile(blockstack, path, options).catch(() => {})
    })
    t.pass('user specified core node used for name lookup')
    FetchMock.restore()
  })

  test('getFile unencrypted, unsigned - multi-reader', async (t) => {
    FetchMock.reset()
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

    await getFile(blockstack, path, options)
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
    await getFile(blockstack, path, optionsNameLookupUrl)
      .then((file) => {
        t.ok(file, 'Returns file content')
        t.same(JSON.parse(<string>file), JSON.parse(fileContents))
      })

    const optionsNoApp = {
      username: 'yukan.id',
      decrypt: false
    }

    await getFile(blockstack, path, optionsNoApp)
      .then((file) => {
        t.ok(file, 'Returns file content')
        t.same(JSON.parse(<string>file), JSON.parse(fileContents))
      })
  })

  test('encrypt & decrypt content', async (t) => {
    t.plan(2)
    FetchMock.reset()
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().userData = <any>{
      appPrivateKey: privateKey
    } // manually set private key for testing

    const content = 'yellowsubmarine'
    const ciphertext = await blockstack.encryptContent(content)
    t.ok(ciphertext)
    const deciphered = await blockstack.decryptContent(ciphertext)
    t.equal(content, deciphered)
  })

  test('encrypt & decrypt content -- specify key', async (t) => {
    t.plan(2)
    FetchMock.reset()
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    const privateKey = '896adae13a1bf88db0b2ec94339b62382ec6f34cd7e2ff8abae7ec271e05f9d8'
    const publicKey = getPublicKeyFromPrivate(privateKey)
    const content = 'we-all-live-in-a-yellow-submarine'
    const ciphertext = await blockstack.encryptContent(content, { publicKey })
    t.ok(ciphertext)
    const deciphered = await blockstack.decryptContent(ciphertext, { privateKey })
    t.equal(content, deciphered)
  })

  test('putFile unencrypted, using Blob content', async (t) => {
    FetchMock.reset()
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

    const dom = new jsdom.JSDOM('', {}).window
    const globalAPIs: {[key: string]: any } = {
      File: dom.File,
      Blob: dom.Blob,
      FileReader: (dom as any).FileReader as FileReader
    }
    for (const globalAPI of Object.keys(globalAPIs)) {
      (global as any)[globalAPI] = globalAPIs[globalAPI]
    }
    try {
      const fileContent = new dom.File(['file content test'], 'filenametest.txt', { type: 'text/example' })
      const fullReadUrl = 'https://gaia.testblockstack.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U/file.json'

      let uploadContentType: any
      const uploadToGaiaHub = (
        filename: string, 
        contents: any,
        hubConfig: any,
        contentType: string) => {
          uploadContentType = contentType
          return Promise.resolve({ publicURL: fullReadUrl })
      };

      const putFile = proxyquire('../../../src/storage', {
        './hub': { uploadToGaiaHub }
      }).putFile as typeof import('../../../src/storage').putFile

      const options = { encrypt: false }

      const publicURL = await putFile(blockstack, path, fileContent, options)
      t.equal(publicURL, fullReadUrl)
      t.equal(uploadContentType, 'text/example')
    } finally {
      for (const globalAPI of Object.keys(globalAPIs)) {
        delete (global as any)[globalAPI]
      }
    }
  })

  test('putFile encrypted, using Blob content, encrypted', async (t) => {
    FetchMock.reset()
    const dom = new jsdom.JSDOM('', {}).window
    const globalAPIs: {[key: string]: any } = {
      File: dom.File,
      Blob: dom.Blob,
      FileReader: (dom as any).FileReader as FileReader
    }
    for (const globalAPI of Object.keys(globalAPIs)) {
      (global as any)[globalAPI] = globalAPIs[globalAPI]
    }
    try {
      const contentDataString = 'file content test'
      const fileContent = new dom.File([contentDataString], 'filenametest.txt', { type: 'text/example' })

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
  
      let encryptedContent: any
      const uploadToGaiaHub = (
        filename: string, 
        contents: any,
        hubConfig: any,
        contentType: string) => {
          encryptedContent = contents
          return Promise.resolve({ publicURL: fullReadUrl })
      };
      const getFullReadUrl = sinon.stub().resolves(fullReadUrl) // eslint-disable-line no-shadow
  
      const putFile = proxyquire('../../../src/storage', {
        './hub': { uploadToGaiaHub }
      }).putFile as typeof import('../../../src/storage').putFile
      const getFile = proxyquire('../../../src/storage', { // eslint-disable-line no-shadow
        './hub': { getFullReadUrl }
      }).getFile as typeof import('../../../src/storage').getFile
  
      const encryptOptions = { encrypt: true }
      const decryptOptions = { decrypt: true }
      // put and encrypt the file
      const publicURL = await putFile(blockstack, path, fileContent, encryptOptions)
      t.equal(publicURL, fullReadUrl)
      FetchMock.get(fullReadUrl, encryptedContent)
      const readContent = await getFile(blockstack, path, decryptOptions)
      const readContentStr = readContent.toString()
      t.equal(readContentStr, contentDataString)
    } finally {
      for (const globalAPI of Object.keys(globalAPIs)) {
        delete (global as any)[globalAPI]
      }
      FetchMock.restore()
    }
  })

  test('putFile unencrypted, using TypedArray content, encrypted', async (t) => {
    FetchMock.reset()
    try {
      const contentDataString = 'file content test1234567'
      const textEncoder = new util.TextEncoder()
      const encodedArray = textEncoder.encode(contentDataString)
      const fileContent = new Uint32Array(encodedArray.buffer)

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
  
      let postedContent: any
      const uploadToGaiaHub = (
        filename: string, 
        contents: any,
        hubConfig: any,
        contentType: string) => {
          postedContent = Buffer.from(contents.buffer).toString()
          return Promise.resolve({ publicURL: fullReadUrl })
      };
      const getFullReadUrl = sinon.stub().resolves(fullReadUrl) // eslint-disable-line no-shadow
  
      const putFile = proxyquire('../../../src/storage', {
        './hub': { uploadToGaiaHub }
      }).putFile as typeof import('../../../src/storage').putFile
      const getFile = proxyquire('../../../src/storage', { // eslint-disable-line no-shadow
        './hub': { getFullReadUrl }
      }).getFile as typeof import('../../../src/storage').getFile
  
      const encryptOptions = { encrypt: false, contentType: 'text/plain; charset=utf-8' }
      const decryptOptions = { decrypt: false }
      // put and encrypt the file
      const publicURL = await putFile(blockstack, path, fileContent, encryptOptions)
      t.equal(publicURL, fullReadUrl)
      FetchMock.get(fullReadUrl, { status: 200, body: postedContent, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      const readContent = await getFile(blockstack, path, decryptOptions)
      const readContentStr = readContent.toString()
      t.equal(readContentStr, contentDataString)
    } finally {
      FetchMock.restore()
    }
  })

  test('putFile encrypted, using TypedArray content, encrypted', async (t) => {
    FetchMock.reset()
    try {
      const contentDataString = 'file content test1234567'
      const textEncoder = new util.TextEncoder()
      const encodedArray = textEncoder.encode(contentDataString)
      const fileContent = new Uint32Array(encodedArray.buffer)

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
  
      let encryptedContent: any
      const uploadToGaiaHub = (
        filename: string, 
        contents: any,
        hubConfig: any,
        contentType: string) => {
          encryptedContent = contents
          return Promise.resolve({ publicURL: fullReadUrl })
      };
      const getFullReadUrl = sinon.stub().resolves(fullReadUrl) // eslint-disable-line no-shadow
  
      const putFile = proxyquire('../../../src/storage', {
        './hub': { uploadToGaiaHub }
      }).putFile as typeof import('../../../src/storage').putFile
      const getFile = proxyquire('../../../src/storage', { // eslint-disable-line no-shadow
        './hub': { getFullReadUrl }
      }).getFile as typeof import('../../../src/storage').getFile
  
      const encryptOptions = { encrypt: true }
      const decryptOptions = { decrypt: true }
      // put and encrypt the file
      const publicURL = await putFile(blockstack, path, fileContent, encryptOptions)
      t.equal(publicURL, fullReadUrl)
      FetchMock.get(fullReadUrl, encryptedContent)
      const readContent = await getFile(blockstack, path, decryptOptions)
      const readContentStr = readContent.toString()
      t.equal(readContentStr, contentDataString)
    } finally {
      FetchMock.restore()
    }
  })

  test('putFile unencrypted, not signed', async (t) => {
    FetchMock.reset()
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
    const fileContent = JSON.stringify({ test: 'test' })

    const uploadToGaiaHub = sinon.stub().resolves({ publicURL: fullReadUrl }) // eslint-disable-line no-shadow
    
    const putFile = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    }).putFile as typeof import('../../../src/storage').putFile

    const options = { encrypt: false }

    await putFile(blockstack, path, fileContent as any, options)
      .then((publicURL: string) => {
        t.ok(publicURL, fullReadUrl)
      })
  })

  test('putFile passes etag to upload function', async (t) => {
    FetchMock.reset()
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

    const fileContent = 'test-content'
    const testEtag = 'test-etag'
    const options = { encrypt: false }

    const uploadToGaiaHub = sinon.stub().resolves({ publicURL: 'url', etag: testEtag })
    const putFile = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    }).putFile as typeof import('../../../src/storage').putFile

    // create file and save etag
    await putFile(blockstack, path, fileContent, options)
    // update file, using saved etag
    await putFile(blockstack, path, fileContent, options)

    // test that saved etag was passed to upload function
    t.true(uploadToGaiaHub.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, sinon.match.any, false, testEtag))
  })

  test('putFile includes If-None-Match header in request when creating a new file', async (t) => {
    FetchMock.reset()
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

    const fileContent = 'test-content'
    const options = { encrypt: false }

    const storeURL = `${gaiaHubConfig.server}/store/${gaiaHubConfig.address}/${path}`
    FetchMock.post(storeURL, { status: 202, body: '{}' })

    // create new file
    await putFile(blockstack, path, fileContent, options)

    t.equal(FetchMock.lastOptions().headers['If-None-Match'], '*')
  })

  test('putFile throws correct error when server rejects etag', async (t) => {
    FetchMock.reset()
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

    try {
      const content = 'test-content'
      const storeURL = `${gaiaHubConfig.server}/store/${gaiaHubConfig.address}/${path}`

      // Mock a PreconditionFailedError
      FetchMock.post(storeURL, { status: 412, body: 'Precondition Failed' })

      const options = { encrypt: false }

      await putFile(blockstack, path, content, options)
    } catch(err) {
      t.equals(err.code, 'precondition_failed_error')
    }
  })

  test('putFile & getFile unencrypted, not signed, with contentType', async (t) => {
    FetchMock.reset()
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

    const uploadToGaiaHub = sinon.stub().resolves({ publicURL: fullReadUrl }) // eslint-disable-line no-shadow

    const putFile = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    }).putFile as typeof import('../../../src/storage').putFile

    const config = {
      status: 200,
      body: fileContent,
      headers: { 'Content-Type': 'text/html' }
    }
    FetchMock.get(fullReadUrl, config)

    const options = { encrypt: false, contentType: 'text/html' }
    await putFile(blockstack, path, fileContent, options)
      .then((publicURL: string) => {
        t.ok(publicURL, fullReadUrl)
      })
      .then(() => {
        const decryptOptions = { decrypt: false }
        return getFile(blockstack, path, decryptOptions).then((readContent) => {
          t.equal(readContent, fileContent)
          t.ok(typeof (readContent) === 'string')
        })
      })
  })

  test('putFile & getFile encrypted, not signed', async (t) => {
    FetchMock.reset()
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

    const uploadToGaiaHub = sinon.stub().resolves({ publicURL: fullReadUrl }) // eslint-disable-line no-shadow
    const getFullReadUrl = sinon.stub().resolves(fullReadUrl) // eslint-disable-line no-shadow

    const putFile = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    }).putFile as typeof import('../../../src/storage').putFile
    const getFile = proxyquire('../../../src/storage', { // eslint-disable-line no-shadow
      './hub': { getFullReadUrl }
    }).getFile as typeof import('../../../src/storage').getFile

    FetchMock.get(fullReadUrl, await blockstack.encryptContent(fileContent))
    const encryptOptions = { encrypt: true }
    const decryptOptions = { decrypt: true }
    // put and encrypt the file
    await putFile(blockstack, path, fileContent, encryptOptions)
      .then((publicURL: string) => {
        t.ok(publicURL, fullReadUrl)
      }).then(() => {
        // read and decrypt the file
        return getFile(blockstack, path, decryptOptions).then((readContent: string) => {
          t.equal(readContent, fileContent)
          // put back whatever was inside before
        })
      })
  })

  test('putFile encrypt/no-sign using specifying public key & getFile decrypt', async (t) => {
    FetchMock.reset()
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

    const uploadToGaiaHub = sinon.stub().resolves({ publicURL: fullReadUrl }) // eslint-disable-line no-shadow
    const getFullReadUrl = sinon.stub().resolves(fullReadUrl) // eslint-disable-line no-shadow

    const putFile = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    }).putFile as typeof import('../../../src/storage').putFile
    const getFile = proxyquire('../../../src/storage', { // eslint-disable-line no-shadow
      './hub': { getFullReadUrl }
    }).getFile as typeof import('../../../src/storage').getFile

    FetchMock.get(fullReadUrl, await blockstack.encryptContent(fileContent))
    const encryptOptions = { encrypt: publicKey }
    const decryptOptions = { decrypt: privateKey }
    // put and encrypt the file
    await putFile(blockstack, path, fileContent, encryptOptions)
      .then((publicURL: string) => {
        t.ok(publicURL, fullReadUrl)
      }).then(() => {
        // read and decrypt the file
        return getFile(blockstack, path, decryptOptions).then((readContent: string) => {
          t.equal(readContent, fileContent)
        })
      })
  })

  test('putFile & getFile encrypted, signed', async (t) => {
    FetchMock.reset()
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    const gaiaHubConfig: GaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'https://gaia.testblockstack2.org/hub/',
      max_file_upload_size_megabytes: 2
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
        return Promise.resolve({ publicURL: `${readPrefix}/${fname}` })
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

    const putFile = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    }).putFile as typeof import('../../../src/storage').putFile
    const getFile = proxyquire('../../../src/storage', { // eslint-disable-line no-shadow
      './hub': { getFullReadUrl },
      '../profiles/profileLookup': { lookupProfile }
    }).getFile as typeof import('../../../src/storage').getFile

    const encryptOptions = { encrypt: true, sign: true }
    const decryptOptions = { decrypt: true, verify: true }
    // put and encrypt the file
    return putFile(blockstack, 'doesnt-matter.json', fileContent, encryptOptions)
      .then((publicURL: string) => {
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
      }).then(() => getFile(blockstack, 'file.json', decryptOptions).then((readContent: string) => {
        t.equal(readContent, fileContent)
      }))
      .then(() => getFile(blockstack, 'file.json', {
        decrypt: true,
        verify: true,
        username: 'applejacks.id',
        app: 'origin'
      })
        .then((readContent: string) => {
          t.equal(readContent, fileContent)
        }))
      .then(() => getFile(blockstack, 'badPK.json', decryptOptions)
        .then(() => t.true(false, 'Should not successfully decrypt file'))
        .catch((err: Error) => t.ok(err.message.indexOf('doesn\'t match gaia address') >= 0,
          `Should fail with complaint about mismatch PK: ${err.message}`)))
      .then(() => getFile(blockstack, 'badPK.json', {
        decrypt: true,
        verify: true,
        username: 'applejacks.id',
        app: 'origin'
      })
        .then(() => t.true(false, 'Should not successfully decrypt file'))
        .catch((err: Error) => t.ok(err.message.indexOf('doesn\'t match gaia address') >= 0,
          `Should fail with complaint about mismatch PK: ${err.message}`)))
      .then(() => getFile(blockstack, 'badSig.json', decryptOptions)
        .then(() => t.true(false, 'Should not successfully decrypt file'))
        .catch((err: Error) => t.ok(err.message.indexOf('do not match ECDSA') >= 0,
          'Should fail with complaint about bad signature')))
      .catch((err: Error) => console.log(err.stack))
      .then(() => {
        t.end()
      })
  })

  test('putFile & getFile unencrypted, signed', async (t) => {
    FetchMock.reset()
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')

    const gaiaHubConfig: GaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack2.org/hub/',
      max_file_upload_size_megabytes: 2
    }

    // manually set gaia config and private key for testing
    const blockstack = new UserSession({ 
      appConfig, 
      sessionOptions: { 
        userData: {
          gaiaHubConfig: gaiaHubConfig,
          appPrivateKey: privateKey
        } as UserData 
      }
    })

    const readPrefix = 'https://gaia.testblockstack4.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U'

    const goodPath = 'file.json'
    const badPKPath = 'badPK.json'
    const badSigPath = 'badSig.json'
    const noSigPath = 'noSig.json'

    const fileContent = JSON.stringify({ test: 'test' })
    const badPK = '0288580b020800f421d746f738b221d384f098e911b81939d8c94df89e74cba776'

    const putFiledContents: [string, string, string][] = []
    const pathToReadUrl = ((fname: string) => `${readPrefix}/${fname}`)

    const uploadToGaiaHub = sinon.stub().callsFake( // eslint-disable-line no-shadow
      ((fname, contents, hubConfig, contentType) => {
        const contentString = Buffer.from(contents as any).toString()
        putFiledContents.push([fname, contentString, contentType])
        if (!fname.endsWith('.sig')) {
          t.equal(contentString, fileContent)
        }
        return Promise.resolve({ publicURL: pathToReadUrl(fname) })
      }) as typeof import('../../../src/storage').uploadToGaiaHub
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

    const putFile = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    }).putFile as typeof import('../../../src/storage').putFile
    const getFile = proxyquire('../../../src/storage', { // eslint-disable-line no-shadow
      './hub': { getFullReadUrl },
      '../profiles/profileLookup': { lookupProfile }
    }).getFile as typeof import('../../../src/storage').getFile

    const encryptOptions = { encrypt: false, sign: true }
    const decryptOptions = { decrypt: false, verify: true }
    const multiplayerDecryptOptions = {
      username: 'applejacks.id',
      decrypt: false,
      verify: true,
      app: 'origin'
    }
    // put and encrypt the file
    const publicURL = await putFile(blockstack, goodPath, fileContent, encryptOptions)
    t.equal(publicURL, pathToReadUrl(goodPath))
    t.equal(putFiledContents.length, 2)

    let sigContents = ''

    // good path mocks
    putFiledContents.forEach(
      ([path, contents, contentType]) => {
        FetchMock.get(pathToReadUrl(path), { 
          body: contents, 
          headers: {'Content-Type': contentType}
        })
        if (path.endsWith('.sig')) {
          sigContents = Buffer.isBuffer(contents) ? contents.toString() : contents
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
    
    let readContent = await getFile(blockstack, goodPath, decryptOptions)
    t.equal(readContent, fileContent, 'should read the file')
    try {
      await getFile(blockstack, badSigPath, decryptOptions)
      t.fail('Should have failed to read file.')
    } catch (err) {
      t.ok(err.message.indexOf('do not match ECDSA') >= 0,
        'Should fail with complaint about bad signature')
    }
    try {
      await getFile(blockstack, noSigPath, decryptOptions)
      t.fail('Should have failed to read file.')
    } catch (err) {
      t.ok(err.message.indexOf('obtain signature for file') >= 0,
        'Should fail with complaint about missing signature')
    }
    try {
      await getFile(blockstack, badPKPath, decryptOptions)
      t.fail('Should have failed to read file.')
    } catch (err) {
      t.ok(err.message.indexOf('match gaia address') >= 0,
        'Should fail with complaint about matching addresses')
    }

    readContent = await getFile(blockstack, goodPath, multiplayerDecryptOptions)
    t.equal(readContent, fileContent, 'should read the file')

    try {
      await getFile(blockstack, badSigPath, multiplayerDecryptOptions)
      t.fail('Should have failed to read file.')
    } catch (err) {
      t.ok(err.message.indexOf('do not match ECDSA') >= 0,
      'Should fail with complaint about bad signature')
    }
    try {
      await getFile(blockstack, noSigPath, multiplayerDecryptOptions)
      t.fail('Should have failed to read file.')
    } catch (err) {
      t.ok(err.message.indexOf('obtain signature for file') >= 0,
        'Should fail with complaint about missing signature')
    }
    try {
      await getFile(blockstack, badPKPath, multiplayerDecryptOptions)
      t.fail('Should have failed to read file.')
    } catch (err) {
      t.ok(err.message.indexOf('match gaia address') >= 0,
      ' Should fail with complaint about matching addresses')
    }
  })

  test('putFile oversized -- unencrypted, signed', async (t) => {
    FetchMock.reset()
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')

    const gaiaHubConfig: GaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack2.org/hub/',
      // 500 bytes
      max_file_upload_size_megabytes: 0.0005
    }

    // manually set gaia config and private key for testing
    const userSession = new UserSession({ 
      appConfig, 
      sessionOptions: { 
        userData: {
          gaiaHubConfig: gaiaHubConfig,
          appPrivateKey: privateKey
        } as UserData 
      }
    })

    const readPrefix = 'https://gaia.testblockstack4.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U'

    // 600 bytes
    const fileContent = Buffer.alloc(600)
    const pathToReadUrl = ((fname: string) => `${readPrefix}/${fname}`)

    const uploadToGaiaHub = sinon.stub().callsFake(
      ((fname) => {
        return Promise.resolve({ publicURL: pathToReadUrl(fname) })
      }) as typeof import('../../../src/storage').uploadToGaiaHub
    )

    const putFile = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    }).putFile as typeof import('../../../src/storage').putFile

    const encryptOptions = { encrypt: false, sign: true }
    try {
      await putFile(userSession, 'file.bin', fileContent, encryptOptions)
      t.fail('should have thrown error with oversized content -- unencrypted, signed')
    } catch (error) {
      t.equal('PayloadTooLargeError', error.name, 'error thrown with oversized content -- unencrypted, signed')
    }
  })

  test('putFile oversized -- encrypted, signed', async (t) => {
    FetchMock.reset()
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')

    const gaiaHubConfig: GaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack2.org/hub/',
      // 500 bytes
      max_file_upload_size_megabytes: 0.0005
    }

    // manually set gaia config and private key for testing
    const userSession = new UserSession({ 
      appConfig, 
      sessionOptions: { 
        userData: {
          gaiaHubConfig: gaiaHubConfig,
          appPrivateKey: privateKey
        } as UserData 
      }
    })

    const readPrefix = 'https://gaia.testblockstack4.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U'

    // 600 bytes
    const fileContent = Buffer.alloc(600)
    const pathToReadUrl = ((fname: string) => `${readPrefix}/${fname}`)

    const uploadToGaiaHub = sinon.stub().callsFake(
      ((fname) => {
        return Promise.resolve({ publicURL: pathToReadUrl(fname) })
      }) as typeof import('../../../src/storage').uploadToGaiaHub
    )

    const putFile = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    }).putFile as typeof import('../../../src/storage').putFile

    const encryptOptions = { encrypt: true, sign: true }
    try {
      await putFile(userSession, 'file.bin', fileContent, encryptOptions)
      t.fail('should have thrown error with oversized content -- encrypted, signed')
    } catch (error) {
      t.equal('PayloadTooLargeError', error.name, 'error thrown with oversized content -- encrypted, signed')
    }
  })

  test('putFile oversized -- unencrypted', async (t) => {
    FetchMock.reset()
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')

    const gaiaHubConfig: GaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack2.org/hub/',
      // 500 bytes
      max_file_upload_size_megabytes: 0.0005
    }

    // manually set gaia config and private key for testing
    const userSession = new UserSession({ 
      appConfig, 
      sessionOptions: { 
        userData: {
          gaiaHubConfig: gaiaHubConfig,
          appPrivateKey: privateKey
        } as UserData 
      }
    })

    const readPrefix = 'https://gaia.testblockstack4.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U'

    // 600 bytes
    const fileContent = Buffer.alloc(600)
    const pathToReadUrl = ((fname: string) => `${readPrefix}/${fname}`)

    const uploadToGaiaHub = sinon.stub().callsFake(
      ((fname) => {
        return Promise.resolve({ publicURL: pathToReadUrl(fname) })
      }) as typeof import('../../../src/storage').uploadToGaiaHub
    )

    const putFile = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    }).putFile as typeof import('../../../src/storage').putFile

    const encryptOptions = { encrypt: false, sign: false }
    try {
      await putFile(userSession, 'file.bin', fileContent, encryptOptions)
      t.fail('should have thrown error with oversized content -- unencrypted')
    } catch (error) {
      t.equal('PayloadTooLargeError', error.name, 'error thrown with oversized content -- unencrypted')
    }
  })

  test('putFile oversized -- encrypted', async (t) => {
    FetchMock.reset()
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')

    const gaiaHubConfig: GaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack2.org/hub/',
      // 500 bytes
      max_file_upload_size_megabytes: 0.0005
    }

    // manually set gaia config and private key for testing
    const userSession = new UserSession({ 
      appConfig, 
      sessionOptions: { 
        userData: {
          gaiaHubConfig: gaiaHubConfig,
          appPrivateKey: privateKey
        } as UserData 
      }
    })

    const readPrefix = 'https://gaia.testblockstack4.org/hub/1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U'

    // 600 bytes
    const fileContent = Buffer.alloc(600)
    const pathToReadUrl = ((fname: string) => `${readPrefix}/${fname}`)

    const uploadToGaiaHub = sinon.stub().callsFake(
      ((fname) => {
        return Promise.resolve({ publicURL: pathToReadUrl(fname) })
      }) as typeof import('../../../src/storage').uploadToGaiaHub
    )

    const putFile = proxyquire('../../../src/storage', {
      './hub': { uploadToGaiaHub }
    }).putFile as typeof import('../../../src/storage').putFile

    const encryptOptions = { encrypt: true, sign: false }
    try {
      await putFile(userSession, 'file.bin', fileContent, encryptOptions)
      t.fail('should have thrown error with oversized content -- encrypted')
    } catch (error) {
      t.equal('PayloadTooLargeError', error.name, 'error thrown with oversized content -- encrypted')
    }
  })

  test('aes256Cbc output size calculation', async (t) => {
    const testLengths = [0, 1, 2, 3, 4, 8, 100, 500, 1000]
    for (let i = 0; i < 10; i++) {
      testLengths.push(Math.floor(Math.random() * Math.floor(1030)))
    }
    const iv = crypto.randomBytes(16)
    const key = Buffer.from('a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229', 'hex')
    for (let len of testLengths) {
      const data = crypto.randomBytes(len)
      const encryptedData = await aes256CbcEncrypt(iv, key, data)
      const calculatedLength = getAesCbcOutputLength(len)
      t.equal(calculatedLength, encryptedData.length, `calculated aes-cbc length for input size ${len} should match actual encrypted ciphertext length`)
    }
  })

  test('base64 output size calculation', async (t) => {
    const testLengths = [0, 1, 2, 3, 4, 8, 100, 500, 1000]
    for (let i = 0; i < 10; i++) {
      testLengths.push(Math.floor(Math.random() * Math.floor(1030)))
    }
    for (let len of testLengths) {
      const data = crypto.randomBytes(len)
      const encodedLength = data.toString('base64')
      const calculatedLength = getBase64OutputLength(len)
      t.equal(calculatedLength, encodedLength.length, `calculated base64 length for input size ${len} should match actual encoded buffer length`)
    } 
  })

  test('playload size detection', async (t) => {
    FetchMock.reset()
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')

    const gaiaHubConfig: GaiaHubConfig = {
      address: '1NZNxhoxobqwsNvTb16pdeiqvFvce3Yg8U',
      server: 'https://hub.blockstack.org',
      token: '',
      url_prefix: 'gaia.testblockstack2.org/hub/',
      // 500 bytes
      max_file_upload_size_megabytes: 0.0005
    }

    // manually set gaia config and private key for testing
    const userSession = new UserSession({ 
      appConfig, 
      sessionOptions: { 
        userData: {
          gaiaHubConfig: gaiaHubConfig,
          appPrivateKey: privateKey
        } as UserData 
      }
    })
    const data = Buffer.alloc(100)

    const encryptedData1 = await userSession.encryptContent(data, {
      wasString: false,
      cipherTextEncoding: 'hex',
    })
    const detectedSize1 = eciesGetJsonStringLength({ 
      contentLength: data.byteLength, 
      wasString: false,
      cipherTextEncoding: 'hex',
      sign: false,
    })
    t.equal(detectedSize1, encryptedData1.length, 'ecies config 1 json byte length calculation should match actual encrypted payload byte length')

    const encryptedData2 = await userSession.encryptContent(data, {
      wasString: true,
      cipherTextEncoding: 'hex',
    })
    const detectedSize2 = eciesGetJsonStringLength({ 
      contentLength: data.byteLength, 
      wasString: true,
      cipherTextEncoding: 'hex',
      sign: false,
    })
    t.equal(detectedSize2, encryptedData2.length, 'ecies config 2 json byte length calculation should match actual encrypted payload byte length')

    const encryptedData3 = await userSession.encryptContent(data, {
      wasString: true,
      cipherTextEncoding: 'hex',
      sign: true,
    })
    const detectedSize3 = eciesGetJsonStringLength({ 
      contentLength: data.byteLength, 
      wasString: true,
      cipherTextEncoding: 'hex',
      sign: true,
    })
    t.equal(detectedSize3, 729, 'ecies config 3 json byte length calculation should match actual encrypted payload byte length')
    // size can vary due to ECDSA signature DER encoding
    // range: 585 + (144 max)
    t.true(encryptedData3.length >= 585 && encryptedData3.length <= 729, 'ecies config 3 json byte range length calculation should match expected')
    const encryptedData4 = await userSession.encryptContent(data, {
      wasString: true,
      cipherTextEncoding: 'base64',
    })
    const detectedSize4 = eciesGetJsonStringLength({ 
      contentLength: data.byteLength, 
      wasString: true,
      cipherTextEncoding: 'base64',
      sign: false,
    })
    t.equal(detectedSize4, encryptedData4.length, 'ecies config 4 json byte length calculation should match actual encrypted payload byte length')
    
  })

  test('promises reject', async (t) => {
    FetchMock.reset()
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
    await putFile(blockstack, path, 'hello world', { encrypt: false })
      .then(() => t.ok(false, 'Should not have returned'))
      .catch(() => t.ok(true, 'Should have rejected promise'))

    const gaiaHubUrl = 'https://potato.hub.farm'
    const signer = '01010101'
    FetchMock.get('https://potato.hub.farm/hub_info', { status: 421, body: 'Nope.' })
    await connectToGaiaHub(gaiaHubUrl, signer)
      .then(() => t.ok(false, 'Should not have returned'))
      .catch(() => t.ok(true, 'Should have rejected promise'))
  })

  test('putFile gets a new gaia config and tries again', async (t) => {
    FetchMock.reset()
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

    const putFile = proxyquire('../../../src/storage', {
      './hub': {
        connectToGaiaHub
      }
    }).putFile as typeof import('../../../src/storage').putFile

    FetchMock.post(fullWriteUrl, (url, req) => {
      const authHeader = (req.headers as Record<string, string>)['Authorization'] 
      if (authHeader === 'bearer ') {
        t.ok(true, 'tries with invalid token')
        return { status: 401 }
      } else if (authHeader === 'bearer valid') {
        t.ok(true, 'Tries with valid hub config')
        return {
          status: 200,
          body: JSON.stringify({ publicURL: 'readURL' })
        }
      }
      return { status: 401 }
    })
    await putFile(blockstack, path, 'hello world', { encrypt: false })
      .then(() => t.ok(true, 'Request should pass'))
  })

  test('getFileUrl', async (t) => { 
    FetchMock.reset()
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

    await getFileUrl(blockstack, 'foo.json', {})
      .then(x => t.equal(
        x, 
        'https://gaia.testblockstack.org/hub/19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk/foo.json', 
        'getFileUrlImpl should return correct url'))

    await blockstack.getFileUrl('foo.json') 
      .then(x => t.equal(
        x, 
        'https://gaia.testblockstack.org/hub/19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk/foo.json', 
        'UserSession.getFileUrl should return correct url'))
  })

  test('getFile throw on 404', async (t) => {
    FetchMock.reset()
    t.plan(4)
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
    await getFile(blockstack, 'foo.json', optionsNoDecrypt)
      .then(() => t.fail('getFile (no decrypt) with 404 should fail'))
      .catch(() => t.pass('getFile (no decrypt) with 404 should fail'))

    const optionsDecrypt = { decrypt: true }
    await getFile(blockstack, 'foo.json', optionsDecrypt)
      .then(() => t.fail('getFile (decrypt) with 404 should fail'))
      .catch((err) => {
        t.ok(err instanceof DoesNotExist, "DoesNotExist error thrown")
        t.equal(err.hubError.statusCode, 404)
        t.equal(err.hubError.statusText, 'Not Found')
      })
  })

  test('uploadToGaiaHub', async (t) => {
    FetchMock.reset()
    t.plan(2)

    const config = {
      address: '19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk',
      url_prefix: 'gaia.testblockstack.org',
      token: '',
      server: 'hub.testblockstack.org',
      max_file_upload_size_megabytes: 20
    }
    const resp = JSON.stringify({ publicURL: `${config.url_prefix}/${config.address}/foo.json` })
    FetchMock.post(`${config.server}/store/${config.address}/foo.json`, resp)

    await uploadToGaiaHub('foo.json', 'foo the bar', config)
      .then((res) => {
        t.ok(res, 'URL returned')
        t.equal(JSON.stringify(res), resp)
      })
  })

  test('deleteFromGaiaHub', async (t) => {
    FetchMock.reset()
    t.plan(1)

    const config = {
      address: '19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk',
      url_prefix: 'gaia.testblockstack.org',
      token: '',
      server: 'hub.testblockstack.org',
      max_file_upload_size_megabytes: 20
    }

    FetchMock.delete(`${config.server}/delete/${config.address}/foo.json`, 202)

    await deleteFromGaiaHub('foo.json', config)
      .then(() => {
        t.pass('Delete http request made')
      })
  })

  test('getFullReadUrl', async (t) => {
    FetchMock.reset()
    t.plan(1)

    const config = {
      address: '19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk',
      url_prefix: 'gaia.testblockstack.org',
      token: '',
      server: 'hub.testblockstack.org',
      max_file_upload_size_megabytes: 20
    }

    await getFullReadUrl('foo.json', config).then((outUrl) => {
      t.equal(`${config.url_prefix}${config.address}/foo.json`, outUrl)
    })
  })

  test('connectToGaiaHub', async (t) => {
    FetchMock.reset()
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

    await connectToGaiaHub(hubServer, privateKey)
      .then((config) => {
        t.ok(config, 'Config returned by connectToGaiaHub()')
        t.equal(hubInfo.read_url_prefix, config.url_prefix)
        t.equal(address, config.address)
        t.equal(hubServer, config.server)
        const jsonTokenPart = config.token.slice('v1:'.length)

        const verified = new TokenVerifier('ES256K', publicKey)
          .verify(jsonTokenPart)
        t.ok(verified, 'Verified token')
        t.equal(hubServer, (decodeToken(jsonTokenPart).payload as any).hubUrl, 'Intended hubUrl')
      })
  })

  test('connectToGaiaHub with an association token', async (t) => {
    FetchMock.reset()
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

    const config = await connectToGaiaHub(hubServer, privateKey, gaiaAssociationToken)
    t.ok(config, 'Config returned by connectToGaiaHub()')
    t.equal(hubInfo.read_url_prefix, config.url_prefix)
    t.equal(address, config.address)
    t.equal(hubServer, config.server)
    const jsonTokenPart = config.token.slice('v1:'.length)

    const verified = new TokenVerifier('ES256K', publicKey)
      .verify(jsonTokenPart)
    t.ok(verified, 'Verified token')
    t.equal(hubServer, (decodeToken(jsonTokenPart).payload as any).hubUrl, 'Intended hubUrl')
    t.equal(gaiaAssociationToken, (decodeToken(jsonTokenPart).payload as any).associationToken,
            'Intended association token')
      
  })

  test('getBucketUrl', (t) => {
    FetchMock.reset()
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

    return getBucketUrl(hubServer, privateKey)
      .then((bucketUrl) => {
        t.ok(bucketUrl, 'App index file URL returned by getBucketUrl')
        t.equal(bucketUrl, `${hubInfo.read_url_prefix}${address}/`)
      })
  })

  test('getUserAppFileUrl', async (t) => {
    FetchMock.reset()
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

    const getUserAppFileUrl = proxyquire('../../../src/storage', {
      '../profiles/profileLookup': { lookupProfile }
    }).getUserAppFileUrl as typeof import('../../../src/storage').getUserAppFileUrl

    await getUserAppFileUrl(path, name, appOrigin)
      .then((url: string) => {
        t.ok(url, 'Returns user app file url')
        t.equals(url, fileUrl)
      })
  })

  test('listFiles', async (t) => {
    FetchMock.reset()
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
        return JSON.stringify({ entries: [path], page: callCount })
      } else if (callCount === 2) {
        return JSON.stringify({ entries: [], page: callCount })
      } else {
        throw new Error('Called too many times')
      }
    })

    const files: string[] = []
    await listFiles(blockstack, (name) => {
      files.push(name)
      return true
    }).then((count) => {
      t.equal(files.length, 1, 'Got one file back')
      t.equal(files[0], 'file.json', 'Got the right file back')
      t.equal(count, 1, 'Count matches number of files')
    })
  })


  test('connect to gaia hub with a user session and association token', async (t) => {
    FetchMock.reset()
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
    const gaiaConfig = await blockstack.setLocalGaiaHubConnection()
    const { token } = gaiaConfig
    const assocToken = (decodeToken(token.slice(2)).payload as any).associationToken
    t.equal(assocToken, gaiaAssociationToken, 'gaia config includes association token')
  })

  test('listFiles gets a new gaia config and tries again', async (t) => {
    FetchMock.reset()
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

    const listFiles = proxyquire('../../../src/storage', {
      './hub': {
        connectToGaiaHub
      }
    }).listFiles as typeof import('../../../src/storage').listFiles

    let callCount = 0
    FetchMock.post(listFilesUrl, (url, { headers }) => {
      if ((<any>headers).Authorization === 'bearer ') {
        t.ok(true, 'tries with invalid token')
        return 401
      }
      callCount += 1
      if (callCount === 1) {
        return { entries: [null], page: callCount }
      } else if (callCount === 2) {
        return { entries: [path], page: callCount }
      } else if (callCount === 3) {
        return { entries: [], page: callCount }
      } else {
        throw new Error('Called too many times')
      }
    })

    const files: string[] = []
    await listFiles(blockstack, (name: string) => {
      files.push(name)
      return true
    }).then((count: number) => {
      t.equal(files.length, 1, 'Got one file back')
      t.equal(files[0], 'file.json', 'Got the right file back')
      t.equal(count, 1, 'Count matches number of files')
    })
  })
}
