import * as test from 'tape'
import * as FetchMock from 'fetch-mock'
// @ts-ignore
import * as BN from 'bn.js'

import { network } from '../../../src'

const mynet = new network.BlockstackNetwork(
  'https://core.blockstack.org',
  'https://broadcast.blockstack.org',
  new network.BlockchainInfoApi()
)

const testAddresses = [
  {
    skHex: '85b33fdfa5efeca980806c6ad3c8a55d67a850bd987237e7d49c967566346fbd01',
    address: '1br553PVnK6F5nyBtb4ju1owwBKdsep5c'
  },
  {
    skHex: '744196d67ed78fe39009c71fbfd53e6ecca98353fbfe81ccba21b0703a69be9c01',
    address: '16xVjkJ3nY62B9t9q3N9wY6hx1duAfwRZR'
  },
  {
    address: '1HEjCcUjZXtbiDnCYviHLVZvSQsSZoDRFa',
    skHex: '12f90d1b9e34d8df56f0dc6754a97ab4a2eb962918c281b1b552162438e313c001' 
  },
  {
    address: '16TaQJi78o4A3nKDSzswqZiX3bhecNuNBQ',
    skHex: '58f7b29ee4a9a8b05855591b8a5405a0647c74c0a539515173adb9a32c964a9a01'
  },
  {
    address: '15eNSvgT3UFvHSonajxFswnmHFifJPE5LB',
    skHex: 'f5360140d18c6a34fbd2c45b98c1857c3fdad5454350249688a90efe936d475101'
  },
  {
    address: '1Lt8ajRt7i8ajkQsYQZbk3ULCVTsSn2TNV',
    skHex: '6eaed28d7f26f57fac925283aa0fe49c031028212863219f1c0141e4b0de2b2d01'
  },
  {
    address: '1GvM4xksXrQsq4xPRck11toRLXVq9UYj2B',
    skHex: '4c103c5c3de544c90f18a3ed29aaeebd33feedb1bb4f026df24aa3eddae826aa01'
  }
]

export function runNetworkTests() {
  test('prices-v1', (t) => {
    t.plan(2)
    FetchMock.restore()
    FetchMock.get('https://core.blockstack.org/v2/prices/names/test.id', 404)
    FetchMock.get('https://core.blockstack.org/v2/prices/namespaces/id', 404)
    FetchMock.get('https://core.blockstack.org/v1/prices/names/test.id', 
                  { name_price: { btc: 0.0001, satoshis: 1000 } })
    FetchMock.get('https://core.blockstack.org/v1/prices/namespaces/id', { satoshis: 650000 })

    mynet.getNamePrice('test.id')
      .then(response => t.deepEqual(
        response, { units: 'BTC', amount: new BN('5500') }))

    mynet.getNamespacePrice('id')
      .then(response => t.deepEqual(
        response, { units: 'BTC', amount: new BN('650000') }))
  })

  test('prices-v2', (t) => {
    t.plan(3)
    FetchMock.restore()
    FetchMock.get('https://core.blockstack.org/v1/prices/names/test.id', 404)
    FetchMock.get('https://core.blockstack.org/v1/prices/names/test-tokens.id', 404)
    FetchMock.get('https://core.blockstack.org/v1/prices/namespaces/id', 404)
    FetchMock.get('https://core.blockstack.org/v2/prices/names/test.id', 
                  { name_price: { units: 'BTC', amount: '1000' } })
    FetchMock.get('https://core.blockstack.org/v2/prices/names/test-tokens.id', 
                  { name_price: { units: 'STACKS', amount: '1733000' } })
    FetchMock.get('https://core.blockstack.org/v2/prices/namespaces/id', 
                  { units: 'BTC', amount: '650000' })

    mynet.getNamePrice('test.id')
      .then(response => t.deepEqual(
        response, { units: 'BTC', amount: new BN('5500') }))

    mynet.getNamePrice('test-tokens.id')
      .then(response => t.deepEqual(
        response, { units: 'STACKS', amount: new BN('1733000') }))

    mynet.getNamespacePrice('id')
      .then(response => t.deepEqual(
        response, { units: 'BTC', amount: new BN('650000') }))
  })

  test('accounts', (t) => {
    t.plan(10)
    FetchMock.restore()
    const addr = testAddresses[0].address
    const addr2 = testAddresses[1].address
    FetchMock.get(`https://core.blockstack.org/v1/accounts/${addr}/tokens`, ['STACKS'])
    FetchMock.get(`https://core.blockstack.org/v1/accounts/${addr2}/tokens`, 404)
    
    FetchMock.get(`https://core.blockstack.org/v1/accounts/${addr}/STACKS/balance`, 
                  { balance: '69129' })
    FetchMock.get(`https://core.blockstack.org/v1/accounts/${addr2}/NOPE/balance`, 404)

    FetchMock.get(`https://core.blockstack.org/v1/accounts/${addr}/STACKS/status`, 
                  { address: addr, credit_value: '123450', debit_value: '54321' })
    FetchMock.get(`https://core.blockstack.org/v1/accounts/${addr2}/STACKS/status`, 404)

    FetchMock.get(`https://core.blockstack.org/v1/accounts/${addr}/history?page=0`,
                  [{ address: addr, credit_value: '123450', debit_value: '54321' }])
    FetchMock.get(`https://core.blockstack.org/v1/accounts/${addr2}/history?page=0`, 404)

    FetchMock.get(`https://core.blockstack.org/v1/accounts/${addr}/history/567890`,
                  [{ address: addr, credit_value: '123450', debit_value: '54321' }])
    FetchMock.get(`https://core.blockstack.org/v1/accounts/${addr2}/history/567890`, 404)

    mynet.getAccountTokens(addr)
      .then(response => t.deepEqual(response, ['STACKS']))
    mynet.getAccountTokens(addr2)
      .then(() => t.fail('did not get exception when querying tokens of unknown address'))
      .catch(e => t.equal(e.message, 'Account not found'))

    mynet.getAccountBalance(addr, 'STACKS')
      .then(response => t.deepEqual(response, new BN('69129')))
    mynet.getAccountBalance(addr2, 'NOPE')
      .then(response => t.deepEqual(response, new BN('0')))

    mynet.getAccountStatus(addr, 'STACKS')
      .then(response => t.deepEqual(response, 
                                    {
                                      address: addr,
                                      credit_value: new BN('123450'),
                                      debit_value: new BN('54321')
                                    }))
    mynet.getAccountStatus(addr2, 'STACKS')
      .then(() => t.fail('did not get exception when querying status of unknown address'))
      .catch(e => t.equal(e.message, 'Account not found'))

    mynet.getAccountHistoryPage(addr, 0)
      .then(response => t.deepEqual(response, 
                                    [{
                                      address: addr,
                                      credit_value: new BN('123450'),
                                      debit_value: new BN('54321')
                                    }]))
    mynet.getAccountHistoryPage(addr2, 0)
      .then(() => t.fail('did not get exception when querying history of unknown address'))
      .catch(e => t.equal(e.message, 'Account not found'))

    mynet.getAccountAt(addr, 567890)
      .then(response => t.deepEqual(response, 
                                    [{
                                      address: addr,
                                      credit_value: new BN('123450'),
                                      debit_value: new BN('54321')
                                    }]))
    mynet.getAccountAt(addr2, 567890)
      .then(() => t.fail('did not get exception when querying block txs of unknown address'))
      .catch(e => t.equal(e.message, 'Account not found'))
  })
  
  test('zonefiles', (t) => {
    t.plan(2)
    FetchMock.restore()
    const zf = '$ORIGIN judecn.id\n$TTL 3600\n_https._tcp URI 10 1 '
      + '"https://raw.githubusercontent.com/jcnelson/profile/master/judecn.id"\n_https._tcp URI '
      + '10 1 "https://www.cs.princeton.edu/~jcnelson/judecn.id"\n'
    const zfh = '737c631c7c5d911c6617993c21fba731363f1cfe'
    const zfh2 = '737c631c7c5d911c6617993c21fba731363f1cff'

    FetchMock.get(`https://core.blockstack.org/v1/zonefiles/${zfh}`, zf)
    FetchMock.get(`https://core.blockstack.org/v1/zonefiles/${zfh2}`, zf)

    mynet.getZonefile(zfh)
      .then(response => t.equal(response, zf))

    mynet.getZonefile(zfh2)
      .catch(e => t.equal(e.message, `Zone file contents hash to ${zfh}, not ${zfh2}`))
  })
}
