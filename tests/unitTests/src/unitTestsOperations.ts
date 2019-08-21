import * as test from 'tape'
import * as FetchMock from 'fetch-mock'
import { Transaction, TransactionBuilder, networks, address as bjsAddress, TxOutput } from 'bitcoinjs-lib'
// @ts-ignore
import * as BN from 'bn.js'

import { network, InsightClient, BitcoindAPI } from '../../../src/network'
import {
  estimateTXBytes, addUTXOsToFund, sumOutputValues,
  hash160, hash128, decodeB40
} from '../../../src/operations/utils'

import { transactions, safety, config } from '../../../src'

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

function networkTests() {
  test('insight-client', (t) => {
    t.plan(5)
    const mynet = new InsightClient('https://utxo.tester.com')

    FetchMock.restore()

    FetchMock.get('https://bitcoinfees.earn.com/api/v1/fees/recommended', { fastestFee: 1000 })

    const txhashFound = 'txhash-found'
    const blockHash = 'block-hash'
    const txhashNotFound = 'txhash-not-found'

    FetchMock.get(`https://utxo.tester.com/tx/${txhashNotFound}`,
                  {
                    body: JSON.stringify(
                      {
                        message: 'error fetching transaction details',
                        error: '-5: No information available about transaction'
                      }
                    ),
                    status: 400
                  })
    FetchMock.get(`https://utxo.tester.com/tx/${txhashFound}`,
                  { blockHash })
    FetchMock.get(`https://utxo.tester.com/block/${blockHash}`,
                  { height: 300 })
    FetchMock.get(`https://utxo.tester.com/addr/${testAddresses[0].address}/utxo`,
                  [{
                    value: 1,
                    satoshis: 1e8,
                    confirmations: 2,
                    txid: 'bar',
                    vout: 10
                  }])

    FetchMock.get('https://utxo.tester.com/status',
                  { blocks: 500 })
    FetchMock.post('https://utxo.tester.com/tx/send',
                   { body: 'true', status: 202 })

    mynet.broadcastTransaction('test-transaction-text')
      .then((response) => { t.ok(response, 'Should broadcast successfully') })

    mynet.getBlockHeight()
      .then((response) => { t.equal(response, 500, 'Should return block height') })

    mynet.getTransactionInfo(txhashNotFound)
      .then(() => t.ok(false, 'Should not return txinfo for not-found transaction.'))
      .catch(() => t.ok(true, 'Should throw exception for not-found transaction.'))

    mynet.getTransactionInfo(txhashFound)
      .then(txInfo => t.equal(txInfo.block_height, 300, 'Should return txinfo.block_height'))
      .catch(() => t.ok(false, 'Should not throw exception for a found transaction.'))

    mynet.getNetworkedUTXOs(testAddresses[0].address)
      .then((utxos) => {
        t.deepEqual(utxos, [{
          value: 1e8, confirmations: 2, tx_hash: 'bar', tx_output_n: 10
        }])
      })
  })
  test('bitcoind-client', (t) => {
    t.plan(2)
    const mynet = new BitcoindAPI('https://utxo.tester.com', { username: 'foo', password: 'bar' })

    FetchMock.restore()

    // @ts-ignore
    FetchMock.postOnce({
      name: 'Broadcast',
      matcher: (url, opts) => (url === 'https://utxo.tester.com'
          && opts
          && opts.body.indexOf('importaddress') > 0),
      response: {
        body: {},
        status: 200
      }
    })

    // @ts-ignore
    FetchMock.post({
      name: 'Broadcast',
      matcher: (url, opts) => (url === 'https://utxo.tester.com'
          && opts
          && opts.body.indexOf('listunspent') > 0),
      response: {
        body: JSON.stringify({ result: [] }),
        status: 200
      }
    })

    mynet.getNetworkedUTXOs(testAddresses[0].address)
      .then((utxos) => {
        t.deepEqual(utxos, [])
      })
      .catch((err) => {
        console.log(err)
        t.fail()
      })
      .then(() => mynet.getNetworkedUTXOs(testAddresses[0].address))
      .then((utxos) => {
        t.deepEqual(utxos, [])
      })
      .catch((err) => {
        console.log(err)
        t.fail()
      })
  })
}

function utilsTests() {
  test('estimateTXBytes', (t) => {
    t.plan(2)
    const txHex = '010000000288e68977fab8038af07746e5d687652a44aa15f532509c202749d'
        + 'bad8a418733000000006b483045022100813ef3534b5030b544e5a5bd1db93f85dc89e2'
        + 'a565197a14784edff5564bd65b022008005213c6aa4c7ebe06cfd86bdaf3e662ae58371'
        + '896a0a841e81106fbe1507401210236b07942707a86ab666bb300b58d295d988ce9c3a3'
        + '38a0e08380dd98732fd4faffffffff3ba3edfd7a7b12b27ac72c3e67768f617fc81bc38'
        + '88a51323a9fb8aa4b1e5e4a000000006b483045022100d0c9b1594137186a1dc6c0b3a6'
        + 'cbe08399b57e2b8c953584f2ce20bef5642eb902206b9c88b8d2d311db26601acf3068d'
        + 'd118649ead4a1f93d029a52c0c61cb2cd2901210236b07942707a86ab666bb300b58d29'
        + '5d988ce9c3a338a0e08380dd98732fd4faffffffff030000000000000000296a2769643'
        + 'f363da95bc8d5203d1c07bd87c564a1e6395826cfdfe87cfd31ffa2a3b8101e3e93096f'
        + '2b7c150000000000001976a91441577ec99314a293acbc17d8152137cf4862f7f188ace'
        + '8030000000000001976a9142ebe7b4729185f68c7185c3c6af60fad1b6eeebf88ac00000000'
    const tx = Transaction.fromHex(txHex)
    tx.ins.forEach((x) => {
      x.script = null
    })

    const actualLength = txHex.length / 2
    const estimatedLength = estimateTXBytes(tx, 0, 0)

    const tx2 = new TransactionBuilder()
    tx2.addOutput(tx.outs[0].script, 0)
    const estimatedLength2 = estimateTXBytes(tx2, 2, 2)

    t.ok(estimatedLength >= actualLength - 5 && estimatedLength <= actualLength + 5,
         `TX size estimate is roughly accurate? (estimated: ${estimatedLength},
           actual: ${actualLength})`)
    t.ok(estimatedLength2 >= actualLength - 5 && estimatedLength2 <= actualLength + 5,
         `TX size estimate is roughly accurate? (estimated: ${estimatedLength2},
           actual: ${actualLength})`)
  })

  test('encoding routines', (t) => {
    t.plan(5)

    t.equal(hash160(Buffer.from(
      '99999566ahjhqwuywqehpzlzlzlzl09189128921jkjlqjosq'
    )).toString('hex'),
            '7ea1fa0f2003c31b015a72af9f4a5f104b5c2840')

    t.equal(hash160(Buffer.from('1234')).toString('hex'),
            'fd7a0d80999bedd76c9a0828057817fc6049a507')

    t.equal(hash128(Buffer.from('999')).toString('hex'),
            '83cf8b609de60036a8277bd0e9613575')

    t.equal(hash128(Buffer.from('99999566ahjhqwuywqehpzlzlzlzl09189128921jkjlqjosqaaa'))
      .toString('hex'),
            '740ae7f18c939cf5e7c189a2c77a012f')

    t.equal(decodeB40('0123456789abcdefghijklmnopqrstuvwxyz-_.+0123456789abcdefghi'
                      + 'jklmnopqrstuvwxyz-_.+0123456789abcdefghijklmnopqrstuvwxyz-_'
                      + '.+0123456789abcdefghijklmnopqrstuvwxyz-_.+0123456789abcdefg'
                      + 'hijklmnopqrstuvwxyz-_.+'),
            '384a516059e707615a1992d3101f6f346df3326d03ea7b673e3754078895db48da2d0'
            + 'fcb1bd89d618b0863bd8bac6db43a2d9cff5cc307310922d3cb8cf9c159d31c6a9c91'
            + '03197263a4e88f52d1b77dfc610e1b8dc9616ba6c2d0a1b792f0d73784c698c69f34a'
            + 'e5e7900753627a3ac87529035fb1a6cba7ce2e1df590941cf30a44557')
  })

  test('not enough UTXOs to fund', (t) => {
    t.plan(1)

    const txB = new TransactionBuilder()
    txB.addOutput(testAddresses[0].address, 10000)
    txB.addOutput(testAddresses[1].address, 0)

    const utxos = [{
      value: 50000,
      tx_hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      tx_output_n: 0
    }]

    t.throws(() => addUTXOsToFund(txB, utxos, 60000, 10),
             /^NotEnoughFundsError: Not enough UTXOs to fund./,
             'Errors when not enough value to fund')
  })


  test('addUTXOsToFundSingleUTXO', (t) => {
    t.plan(2)

    const txB = new TransactionBuilder()
    txB.addOutput(testAddresses[0].address, 10000)
    txB.addOutput(testAddresses[1].address, 0)

    const utxos = [{
      value: 50000,
      tx_hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      tx_output_n: 0
    }]

    const change = addUTXOsToFund(txB, utxos, 10000, 10)

    t.equal(change, 38520) // gots to pay the fee!
    t.equal((<any>txB).__TX.ins[0].hash.toString('hex'),
            Buffer.from(Buffer.from(utxos[0].tx_hash, 'hex').reverse()).toString('hex'))
  })

  test('addUTXOsToFundTwoUTXOs', (t) => {
    t.plan(3)

    const txB = new TransactionBuilder()
    txB.addOutput(testAddresses[0].address, 10000)
    txB.addOutput(testAddresses[1].address, 0)

    const utxos = [{
      value: 50000,
      tx_hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      tx_output_n: 0
    },
                   {
                     value: 10000,
                     tx_hash: '3387418aaddb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e688',
                     tx_output_n: 0
                   }]

    const change = addUTXOsToFund(txB, utxos, 55000, 10)

    t.ok(change <= 5000, `${(<any>txB).__TX.outs[1].value} should be less than 5k`)
    t.equal((<any>txB).__TX.ins[0].hash.toString('hex'),
            Buffer.from(Buffer.from(utxos[0].tx_hash, 'hex').reverse()).toString('hex'))
    t.equal((<any>txB).__TX.ins[1].hash.toString('hex'),
    Buffer.from(Buffer.from(utxos[1].tx_hash, 'hex').reverse()).toString('hex'))
  })

  test('modifiedTXSets', (t) => {
    t.plan(11)
    const txStarterHex = '01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323'
    + 'a9fb8aa4b1e5e4a000000006a473044022050176492b92c79ba'
    + '23fb815e62a7778ccb45a50ca11b8dabdbadc1828e6ba34002200ce770'
    + '82a072eba8d3ce49e6a316e6173c1f97d955064574fe620cc25002eadb'
    + '01210236b07942707a86ab666bb300b58d295d988ce9c3a338a0e08380'
    + 'dd98732fd4faffffffff030000000000000000296a2769643f363da95b'
    + 'c8d5203d1c07bd87c564a1e6395826cfdfe87cfd31ffa2a3b8101e3e93'
    + '096f2be02c0000000000001976a91441577ec99314a293acbc17d81521'
    + '37cf4862f7f188ac39050000000000001976a9142ebe7b4729185f68c7'
    + '185c3c6af60fad1b6eeebf88ac00000000'

    const txStarter = Transaction.fromHex(txStarterHex)

    const txHash = '22a024f16944d2f568de4a613566fcfab53b86d37f1903668d399f9a366883de'

    t.equal(Buffer.from(txStarter.getHash().reverse()).toString('hex'), txHash)

    const usedTXHash = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
    const utxoValues = [287825, 287825]
    const utxoSet1 = [{
      value: utxoValues[0],
      tx_hash_big_endian: usedTXHash,
      tx_output_n: 0
    },
                      {
                        value: utxoValues[1],
                        tx_hash_big_endian:
                      '3387418aaddb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e688',
                        tx_output_n: 0
                      }]
    const utxoSet2 = []

    config.network.modifyUTXOSetFrom(txStarterHex)

    const testAddress1 = '16xVjkJ3nY62B9t9q3N9wY6hx1duAfwRZR'
    const testAddress2 = '15GAGiT2j2F1EzZrvjk3B8vBCfwVEzQaZx'

    FetchMock.restore()

    FetchMock.get('https://bitcoinfees.earn.com/api/v1/fees/recommended', { fastestFee: 1000 })

    FetchMock.get(`https://blockchain.info/unspent?format=json&active=${testAddress1}&cors=true`,
                  { unspent_outputs: utxoSet1 })
    FetchMock.get(`https://blockchain.info/unspent?format=json&active=${testAddress2}&cors=true`,
                  { unspent_outputs: utxoSet2 })

    Promise.all([config.network.getUTXOs(testAddress1),
                 config.network.getUTXOs(testAddress2)])
      .then(([utxos1, utxos2]) => {
        t.equal(utxos1.length, 2)
        t.equal(utxos2.length, 1)
        t.ok(utxos1.find(x => x.tx_hash === txHash && x.value === 11488),
             'UTXO set should include the new transaction\'s outputs')
        t.ok(utxos2.find(x => x.tx_hash === txHash && x.value === 1337),
             'UTXO set should include the new transaction\'s outputs')
        t.ok(!utxos1.find(x => x.tx_hash === usedTXHash),
             'UTXO set shouldn\'t include the transaction\'s spent input')
      })
      .then(() => {
        config.network.resetUTXOs(testAddress1)
        config.network.resetUTXOs(testAddress2)
        return Promise.all([config.network.getUTXOs(testAddress1),
                            config.network.getUTXOs(testAddress2)])
      })
      .then(([utxos1, utxos2]) => {
        t.equal(utxos1.length, 2)
        t.equal(utxos2.length, 0)
        t.ok(!utxos1.find(x => x.tx_hash === txHash && x.value === 11488),
             'UTXO set should not include the new transaction\'s outputs after reset')
        t.ok(!utxos2.find(x => x.tx_hash === txHash && x.value === 1337),
             'UTXO set should not include the new transaction\'s outputs after reset')
        t.ok(utxos1.find(x => x.tx_hash === usedTXHash),
             'UTXO set should include the transaction\'s input after reset')
      })
  })
}

function transactionTests() {
  const utxoValues = [288000, 287825, 287825]
  const namespaceUtxoValues = [288000, 287825, 287825]
  const tokenUtxoValues = [288000, 287825, 287825]
  const BURN_AMT = 6500
  const NAMESPACE_PRICE = { units: 'STACKS', amount: '6400000000' }
  const BURN_ADDR = '15GAGiT2j2F1EzZrvjk3B8vBCfwVEzQaZx'
  const NAMESPACE_BURN_ADDR = '1111111111111111111114oLvT2'

  const utxoSet = [
    {
      value: utxoValues[0],
      tx_hash_big_endian: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      tx_output_n: 0
    },
    {
      value: utxoValues[1],
      tx_hash_big_endian: '3387418aaddb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e688',
      tx_output_n: 0
    },
    {
      value: utxoValues[2],
      tx_hash_big_endian: 'ffffffffffdb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e688',
      tx_output_n: 2
    }
  ]

  const utxoSet2 = [
    {
      value: 5500,
      tx_hash_big_endian: 'ffffffffaab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdedffff',
      tx_output_n: 0
    }
  ]

  const namespaceUtxoSet = [
    {
      value: namespaceUtxoValues[0],
      tx_hash_big_endian: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33c',
      tx_output_n: 0
    },
    {
      value: namespaceUtxoValues[1],
      tx_hash_big_endian: '3387418aaddb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e689',
      tx_output_n: 0
    },
    {
      value: namespaceUtxoValues[2],
      tx_hash_big_endian: 'ffffffffffdb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e689',
      tx_output_n: 2
    }
  ]

  const namespaceUtxoSet2 = [
    {
      value: 654321,
      tx_hash_big_endian: 'ffffffffaab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdee0000',
      tx_output_n: 0
    }
  ]

  const tokenUtxoSet = [
    {
      value: tokenUtxoValues[0],
      tx_hash_big_endian: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33c',
      tx_output_n: 0
    },
    {
      value: tokenUtxoValues[1],
      tx_hash_big_endian: '3387418aaddb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e689',
      tx_output_n: 0
    },
    {
      value: tokenUtxoValues[2],
      tx_hash_big_endian: 'ffffffffffdb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e689',
      tx_output_n: 2
    }
  ]

  const tokenUtxoSet2 = [
    {
      value: 1654321,
      tx_hash_big_endian: 'fefefefeaab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdee0000',
      tx_output_n: 0
    }
  ]

  function setupMocks() {
    FetchMock.restore()
    FetchMock.get('https://bitcoinfees.earn.com/api/v1/fees/recommended', { fastestFee: 1000 })
    FetchMock.get(`https://blockchain.info/unspent?format=json&active=${testAddresses[1].address}&cors=true`,
                  { unspent_outputs: utxoSet })
    FetchMock.get(`https://blockchain.info/unspent?format=json&active=${testAddresses[0].address}&cors=true`,
                  { unspent_outputs: utxoSet2 })
    FetchMock.get(`https://blockchain.info/unspent?format=json&active=${testAddresses[2].address}&cors=true`,
                  { unspent_outputs: namespaceUtxoSet })
    FetchMock.get(`https://blockchain.info/unspent?format=json&active=${testAddresses[3].address}&cors=true`,
                  { unspent_outputs: namespaceUtxoSet2 })
    FetchMock.get(`https://blockchain.info/unspent?format=json&active=${testAddresses[4].address}&cors=true`,
                  { unspent_outputs: tokenUtxoSet })
    FetchMock.get(`https://blockchain.info/unspent?format=json&active=${testAddresses[5].address}&cors=true`,
                  { unspent_outputs: tokenUtxoSet2 })
    FetchMock.get('https://core.blockstack.org/v2/prices/names/foo.test',
                  { name_price: { units: 'BTC', amount: String(BURN_AMT) } })
    FetchMock.get('https://core.blockstack.org/v2/prices/names/bar.test2',
                  { name_price: { units: 'STACKS', amount: String(BURN_AMT) } })
    FetchMock.get('https://core.blockstack.org/v2/prices/namespaces/hello',
                  NAMESPACE_PRICE)
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test',
                  { version: 2, address: BURN_ADDR, reveal_block: 600 })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test2',
                  { version: 3, address: BURN_ADDR, reveal_block: 600 })
    FetchMock.get('https://core.blockstack.org/v1/blockchains/bitcoin/consensus',
                  { consensus_hash: 'dfe87cfd31ffa2a3b8101e3e93096f2b' })
    FetchMock.get('https://blockchain.info/latestblock?cors=true',
                  { height: 601 })
  }

  function getInputVals(inputTXArgument, utxoSets = utxoSet) {
    const utxosAll = utxoSets.concat()
    return inputTXArgument.ins.reduce((agg, x) => {
      const inputTX = utxosAll.find(
        y => Buffer.from(Buffer.from(y.tx_hash_big_endian, 'hex')
          .reverse()).compare(x.hash) === 0
      )
      if (inputTX) {
        return agg + inputTX.value
      } else {
        return agg
      }
    }, 0)
  }

  test('address coercion', (t) => {
    t.plan(8)
    const stashed = config.network.layer1
    try {
      const singleSigAddressMain = '1EJh2y3xKUwFjJ8v29a2NRruPJ71neozEE'
      const singleSigAddressTest = 'mtpeL28w8WNWWQcXjiYQCM5EFHhijXMF62'
      const multiSigAddressTest  = '2N6GHvciC9M4ze5QXpW2jZxjf5trnPFsyqZ'
      const multiSigAddressMain  = '3Ei5rsnAXtZeSHmz9NQrx1kPsYecbfdKiy'
      config.network.layer1 = networks.testnet
      t.equal(config.network.coerceAddress(singleSigAddressMain), singleSigAddressTest)
      t.equal(config.network.coerceAddress(singleSigAddressTest), singleSigAddressTest)
      t.equal(config.network.coerceAddress(multiSigAddressMain), multiSigAddressTest)
      t.equal(config.network.coerceAddress(multiSigAddressTest), multiSigAddressTest)
      config.network.layer1 = networks.bitcoin
      t.equal(config.network.coerceAddress(singleSigAddressMain), singleSigAddressMain)
      t.equal(config.network.coerceAddress(singleSigAddressTest), singleSigAddressMain)
      t.equal(config.network.coerceAddress(multiSigAddressMain), multiSigAddressMain)
      t.equal(config.network.coerceAddress(multiSigAddressTest), multiSigAddressMain)
    } finally {
      config.network.layer1 = stashed
    }
  })

  test('build incomplete', (t) => {
    setupMocks()
    t.plan(2)
    const getAddress = () => Promise.resolve(testAddresses[2].address)
    const signTransaction = () => Promise.resolve()
    const nullSigner = { getAddress, signTransaction }
    return transactions.makeNamespacePreorder('hello',
                                              testAddresses[3].address,
                                              <any>nullSigner)
      .then(() => {
        t.fail('Should have failed to build unsigned TX.')
      })
      .catch(() => {
        t.pass('Should have failed to build unsigned TX.')
      })
      .then(() => transactions.makeNamespacePreorder('hello',
                                                     testAddresses[3].address,
                                                     <any>nullSigner,
                                                     true))
      .then((txhex) => {
        t.ok(txhex, 'Should have built incomplete TX when buildIncomplete = true')
      })
      .catch((err) => {
        t.fail(`Should have built incomplete TX when buildIncomplete = true: Error: ${err}`)
      })
  })

  test('build and fund namespace preorder', (t) => {
    t.plan(6)
    setupMocks()

    Promise.all(
      [transactions.estimateNamespacePreorder('hello',
                                              testAddresses[3].address,
                                              testAddresses[2].address, 2),
       transactions.makeNamespacePreorder('hello',
                                          testAddresses[3].address,
                                          testAddresses[2].skHex)]
    )
      .then(([estimatedCost, hexTX]) => {
        t.ok(hexTX)
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx, namespaceUtxoSet)
        const fee = inputVals - outputVals
        const burnAddress = bjsAddress.fromOutputScript(tx.outs[2].script, networks.bitcoin)

        const change = (tx.outs[1] as TxOutput).value

        t.equal(inputVals - change,
                estimatedCost - 5500, 'Estimated cost should be +DUST_MINIMUM of actual.')
        t.equal(burnAddress, NAMESPACE_BURN_ADDR, `Burn address should be ${NAMESPACE_BURN_ADDR}`)
        t.equal((tx.outs[2] as TxOutput).value, 5500, 'Output should have paid +DUST_MINIMUM for namespace')
        t.equal(tx.ins.length, 2, 'Should use 2 utxos for the payer')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx of length ${txLen} should equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('build and fund namespace reveal', (t) => {
    t.plan(4)
    setupMocks()

    const ns = new transactions.BlockstackNamespace('hello')
    ns.setVersion(3)
    ns.setLifetime(52595)
    ns.setCoeff(4)
    ns.setBase(4)
    ns.setBuckets([6, 5, 4, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
    ns.setNonalphaDiscount(10)
    ns.setNoVowelDiscount(10)

    Promise.all(
      [transactions.estimateNamespaceReveal(ns,
                                            testAddresses[3].address,
                                            testAddresses[2].address),
       transactions.makeNamespaceReveal(ns,
                                        testAddresses[3].address,
                                        testAddresses[2].skHex)]
    )
      .then(([estimatedCost, hexTX]) => {
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx, namespaceUtxoSet)
        const fee = inputVals - outputVals

        // change address is the 3rd output usually...
        const change = (tx.outs[2] as TxOutput).value

        t.equal(bjsAddress.fromOutputScript(tx.outs[2].script, networks.bitcoin), testAddresses[2].address,
                'Payer change should be third output')
        t.equal(inputVals - change, estimatedCost, 'Estimated cost should match actual.')
        t.equal(tx.ins.length, 1, 'Should use 1 utxo for the payer')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx of length ${txLen} should equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('build and fund name import', (t) => {
    t.plan(4)
    setupMocks()

    Promise.all(
      [transactions.estimateNameImport(
        'import.hello', '151nahdGD9Dxd7xpwPeBECn5iEi4Thb7Rv',
        'cabdbc18ece9ffb6a7378faa4ac4ce58dcaaf575'
      ),
       transactions.makeNameImport(
         'import.hello', '151nahdGD9Dxd7xpwPeBECn5iEi4Thb7Rv',
         'cabdbc18ece9ffb6a7378faa4ac4ce58dcaaf575', testAddresses[3].skHex
       )]
    )
      .then(([estimatedCost, hexTX]) => {
        t.ok(hexTX)
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx, namespaceUtxoSet2)
        const fee = inputVals - outputVals

        const change = (tx.outs[3] as TxOutput).value
        t.equal(inputVals - change,
                estimatedCost, 'Estimated cost should match actual.')
        t.equal(tx.ins.length, 1, 'Should use 1 utxo for the payer')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx of length ${txLen} should equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('build and fund namespace ready', (t) => {
    t.plan(4)
    setupMocks()

    Promise.all(
      [transactions.estimateNamespaceReady('hello'),
       transactions.makeNamespaceReady('hello',
                                       testAddresses[3].skHex)]
    )
      .then(([estimatedCost, hexTX]) => {
        t.ok(hexTX)
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx, namespaceUtxoSet2)
        const fee = inputVals - outputVals

        const change = (tx.outs[1] as TxOutput).value
        t.equal(inputVals - change,
                estimatedCost, 'Estimated cost should match actual.')
        t.equal(tx.ins.length, 1, 'Should use 1 utxo for the payer')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx of length ${txLen} should equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('build and fund announce', (t) => {
    t.plan(4)
    setupMocks()

    Promise.all(
      [transactions.estimateAnnounce('53bb740c47435a51b07ecf0b9e086a2ad3c12c1d'),
       transactions.makeAnnounce(
         '53bb740c47435a51b07ecf0b9e086a2ad3c12c1d', testAddresses[3].skHex
       )]
    )
      .then(([estimatedCost, hexTX]) => {
        t.ok(hexTX)
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx, namespaceUtxoSet2)
        const fee = inputVals - outputVals

        const change = (tx.outs[1] as TxOutput).value
        t.equal(inputVals - change,
                estimatedCost, 'Estimated cost should match actual.')
        t.equal(tx.ins.length, 1, 'Should use 1 utxo for the payer')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx of length ${txLen} should equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('build and fund token transfer', (t) => {
    t.plan(6)
    setupMocks()

    Promise.all([
      transactions.estimateTokenTransfer(testAddresses[1].address,
                                         'STACKS',
                                         new BN('123'),
                                         'hello world!', 2),
      transactions.makeTokenTransfer(testAddresses[1].address,
                                     'STACKS',
                                     new BN('123'),
                                     'hello world!',
                                     testAddresses[4].skHex)])
      .then(([estimatedCost, hexTX]) => {
        t.ok(hexTX)
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx, tokenUtxoSet)
        const fee = inputVals - outputVals
        const change = (tx.outs[2] as TxOutput).value
        const recipientAddr = bjsAddress.fromOutputScript(tx.outs[1].script, networks.bitcoin)
        console.log(outputVals)
        console.log(inputVals)
        console.log(fee)
        console.log(change)
        console.log(recipientAddr)

        t.equal(inputVals - change, estimatedCost, 'Estimated cost should be equal')
        t.equal(recipientAddr, testAddresses[1].address, 'Recipient address is correct')
        t.equal((tx.outs[1] as TxOutput).value, 5500, 'Recipient address should have +DUST_MINIMUM')
        t.equal(tx.ins.length, 2, 'Should use 2 utxos from the payer')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx length ${txLen} should equal 1K satoshi/byte`)
      })
  })

  test('build and fund token transfer with separate funder', (t) => {
    t.plan(6)
    setupMocks()

    Promise.all([
      transactions.estimateTokenTransfer(testAddresses[1].address,
                                         'STACKS',
                                         new BN('123'),
                                         'hello world!', 2, 2),
      transactions.makeTokenTransfer(testAddresses[1].address,
                                     'STACKS',
                                     new BN('123'),
                                     'hello world!',
                                     testAddresses[4].skHex,
                                     testAddresses[5].skHex)])
      .then(([estimatedCost, hexTX]) => {
        t.ok(hexTX)
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx, tokenUtxoSet) + getInputVals(tx, tokenUtxoSet2)
        const fee = inputVals - outputVals
        const change = (tx.outs[3] as TxOutput).value
        const recipientAddr = bjsAddress.fromOutputScript(tx.outs[1].script, networks.bitcoin)
        const funderInputVals = getInputVals(tx, tokenUtxoSet2)

        t.equal(funderInputVals - change, estimatedCost, 'Estimated cost should be equal')
        t.equal(recipientAddr, testAddresses[1].address, 'Recipient address is correct')
        t.equal((tx.outs[1] as TxOutput).value, 5500, 'Recipient address should have +DUST_MINIMUM')
        t.equal(tx.ins.length, 2, 'Should use 2 utxos from (token-payer, btc-payer)')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx length ${txLen} should equal 1K satoshi/byte`)
      })
      .catch((err) => {
        console.log(err)
        t.fail(err)
      })
  })

  test('build and fund preorder', (t) => {
    t.plan(6)
    setupMocks()

    Promise.all(
      [transactions.estimatePreorder('foo.test',
                                     testAddresses[0].address,
                                     testAddresses[1].address),
       transactions.makePreorder('foo.test',
                                 testAddresses[0].address,
                                 testAddresses[1].skHex)]
    )
      .then(([estimatedCost, hexTX]) => {
        t.ok(hexTX)
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx)
        const fee = inputVals - outputVals
        const burnAddress = bjsAddress.fromOutputScript(tx.outs[2].script, networks.bitcoin)

        const change = (tx.outs[1] as TxOutput).value

        t.equal(inputVals - change,
                estimatedCost - 5500, 'Estimated cost should be +DUST_MINIMUM of actual.')
        t.equal(burnAddress, BURN_ADDR, `Burn address should be ${BURN_ADDR}`)
        t.equal((tx.outs[2] as TxOutput).value, BURN_AMT, `Output should have funded name price ${BURN_AMT}`)
        t.equal(tx.ins.length, 1, 'Should use 1 utxo for the payer')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx of length ${txLen} should equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('build and fund preorder with stacks', (t) => {
    t.plan(6)
    setupMocks()

    Promise.all(
      [transactions.estimatePreorder('bar.test2',
                                     testAddresses[0].address,
                                     testAddresses[1].address,
                                     2),
       transactions.makePreorder('bar.test2',
                                 testAddresses[0].address,
                                 testAddresses[1].skHex)]
    )
      .then(([estimatedCost, hexTX]) => {
        t.ok(hexTX)
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx)
        const fee = inputVals - outputVals
        const burnAddress = bjsAddress.fromOutputScript(tx.outs[2].script, networks.bitcoin)

        const change = (tx.outs[1] as TxOutput).value
        t.equal(inputVals - change,
                estimatedCost - 5500, 'Estimated cost should be +DUST_MINIMUM of actual.')
        t.equal(burnAddress, NAMESPACE_BURN_ADDR, `Burn address should be ${NAMESPACE_BURN_ADDR}`)
        t.equal((tx.outs[2] as TxOutput).value, 5500, 'Output should not have burned more than +DUST_MINIMUM')
        t.equal(tx.ins.length, 2, 'Should use 2 utxos for the payer')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx of length ${txLen} should equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('build and fund register', (t) => {
    t.plan(4)
    setupMocks()

    Promise.all(
      [transactions.estimateRegister('foo.test',
                                     testAddresses[0].address,
                                     testAddresses[1].address, true, 2),
       transactions.makeRegister('foo.test',
                                 testAddresses[0].address,
                                 testAddresses[1].skHex, 'hello world')]
    )
      .then(([estimatedCost, hexTX]) => {
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx)
        const fee = inputVals - outputVals

        // change address is the 3rd output usually...
        const change = (tx.outs[2] as TxOutput).value

        t.equal(bjsAddress.fromOutputScript(tx.outs[2].script, networks.bitcoin), testAddresses[1].address,
                'Payer change should be third output')
        t.equal(inputVals - change, estimatedCost, 'Estimated cost should match actual.')
        t.equal(tx.ins.length, 2, 'Should use both payer utxos')
        t.equal(Math.floor(fee / txLen), 1000,
                `Paid fee of ${fee} for tx of length ${txLen} should equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('build and fund update', (t) => {
    t.plan(5)
    setupMocks()

    Promise.all(
      [transactions.estimateUpdate('foo.test',
                                   testAddresses[0].address,
                                   testAddresses[1].address,
                                   3),
       transactions.makeUpdate('foo.test',
                               testAddresses[0].skHex,
                               testAddresses[1].skHex,
                               'hello world')]
    )
      .then(([estimatedCost, hexTX]) => {
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx)
        const fee = inputVals - outputVals

        // payer change address is the 3rd output...
        const changeOut = tx.outs[2]
        const ownerChange = tx.outs[1]
        const change = (changeOut as TxOutput).value

        t.equal(bjsAddress.fromOutputScript(changeOut.script, networks.bitcoin), testAddresses[1].address,
                'Owner change should be second output')
        t.equal(bjsAddress.fromOutputScript(ownerChange.script, networks.bitcoin), testAddresses[0].address,
                'Payer change should be third output')
        t.equal(inputVals - change, estimatedCost, 'Estimated cost should match actual.')
        t.equal(tx.ins.length, 4, 'Should use all payer utxos and one owner utxo')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx of length ${txLen} should roughly equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('build and fund transfer', (t) => {
    t.plan(6)
    setupMocks()

    Promise.all(
      [transactions.estimateTransfer('foo.test',
                                     testAddresses[2].address,
                                     testAddresses[0].address,
                                     testAddresses[1].address,
                                     3),
       transactions.makeTransfer('foo.test',
                                 testAddresses[2].address,
                                 testAddresses[0].skHex,
                                 testAddresses[1].skHex)]
    )
      .then(([estimatedCost, hexTX]) => {
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx)
        const fee = inputVals - outputVals

        // payer change address is the 4th output...
        const changeOut = tx.outs[3]
        // old owner change address is the 3rd output
        const ownerChange = tx.outs[2]

        const change = (changeOut as TxOutput).value

        t.equal(bjsAddress.fromOutputScript(tx.outs[1].script, networks.bitcoin), testAddresses[2].address,
                'New owner should be second output')
        t.equal(bjsAddress.fromOutputScript(ownerChange.script, networks.bitcoin), testAddresses[0].address,
                'Prior owner should be third output')
        t.equal(bjsAddress.fromOutputScript(changeOut.script, networks.bitcoin), testAddresses[1].address,
                'Payer change should be fourth output')
        t.equal(inputVals - change, estimatedCost, 'Estimated cost should match actual.')
        t.equal(tx.ins.length, 4, 'Should use both payer utxos and one owner utxo')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx of length ${txLen} should roughly equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('build and fund revoke', (t) => {
    t.plan(4)
    setupMocks()

    Promise.all(
      [transactions.estimateRevoke('foo.test',
                                   testAddresses[0].address,
                                   testAddresses[1].address, 2),
       transactions.makeRevoke('foo.test',
                               testAddresses[0].skHex,
                               testAddresses[1].skHex)]
    )
      .then(([estimatedCost, hexTX]) => {
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx)
        const fee = inputVals - outputVals

        // change address is the 3rd output usually...
        const change = (tx.outs[2] as TxOutput).value

        t.equal(bjsAddress.fromOutputScript(tx.outs[2].script, networks.bitcoin), testAddresses[1].address,
                'Payer change should be third output')
        t.equal(inputVals - change, estimatedCost, 'Estimated cost should match actual.')
        t.equal(tx.ins.length, 3, 'Should use both payer utxos')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx of length ${txLen} should equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('fund bitcoin spends', (t) => {
    t.plan(14)
    setupMocks()
    const TEST1_AMOUNT = 250000
    const TEST2_AMOUNT = 80000
    const TEST3_AMOUNT = 288000 + 287825 + 287825
    const TEST4_AMOUNT = 288000 + 287825 + 287825 + 1
    transactions.makeBitcoinSpend(testAddresses[2].address,
                                  testAddresses[1].skHex,
                                  TEST1_AMOUNT)
      .then((hexTX) => {
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx)
        const fee = inputVals - outputVals
        t.equal(tx.ins.length, 1, 'Should use 1 input')
        t.equal(tx.outs.length, 2, 'Should have a change output')
        const changeOut = tx.outs[1]
        t.equal(bjsAddress.fromOutputScript(changeOut.script, networks.bitcoin), testAddresses[1].address,
                'Must be correct change address')
        t.ok(Math.abs(1000 * txLen - fee) <= 2000,
             `Fee should be roughly correct: Actual fee: ${fee}, expected: ${1000 * txLen}`)
        t.equal(inputVals - (changeOut as TxOutput).value, TEST1_AMOUNT, 'Should fund correct amount')
      })
      .then(() => transactions.makeBitcoinSpend(testAddresses[2].address,
                                                testAddresses[1].skHex,
                                                TEST2_AMOUNT))
      .then(() => t.fail('Should reject with InvalidAmountError if not enough coin to fund fees.'))
      .catch(err => t.equal(
        err.name, 'InvalidAmountError',
        'Should reject with InvalidAmountError if not enough coin to fund fees.'
      ))
      .then(() => transactions.makeBitcoinSpend(testAddresses[2].address,
                                                testAddresses[1].skHex,
                                                TEST3_AMOUNT))
      .then((hexTX) => {
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx)
        const fee = inputVals - outputVals
        t.equal(tx.ins.length, 3, 'Should use 3 inputs')
        t.equal(tx.outs.length, 1, 'Should not have a change output')
        t.ok(Math.abs(1000 * txLen - fee) <= 2000, 'Fee should be roughly correct.')
        t.equal(outputVals + fee, TEST3_AMOUNT, 'Should fund correct amount')
      })
      .then(() => transactions.makeBitcoinSpend(testAddresses[2].address,
                                                testAddresses[1].skHex,
                                                TEST4_AMOUNT))
      .then((hexTX) => {
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx)
        const fee = inputVals - outputVals
        t.equal(tx.ins.length, 3, 'Should use 3 inputs')
        t.equal(tx.outs.length, 1, 'Should not have a change output')
        t.ok(Math.abs(1000 * txLen - fee) <= 2000, 'Fee should be roughly correct.')
        t.equal(outputVals + fee, TEST3_AMOUNT, 'Should fund maximum amount')
      })
  })

  test('build and fund renewal', (t) => {
    t.plan(7)
    setupMocks()

    Promise.all(
      [transactions.estimateRenewal('foo.test',
                                    testAddresses[2].address,
                                    testAddresses[0].address,
                                    testAddresses[1].address,
                                    true,
                                    3),
       transactions.makeRenewal('foo.test',
                                testAddresses[2].address,
                                testAddresses[0].skHex,
                                testAddresses[1].skHex,
                                'hello world')]
    )
      .then(([estimatedCost, hexTX]) => {
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx)
        const fee = inputVals - outputVals

        // payer change address is the 5th output...
        const changeOut = tx.outs[4]
        // old owner change address is the 3rd output
        const ownerChange = tx.outs[2]

        const change = (changeOut as TxOutput).value

        t.equal(bjsAddress.fromOutputScript(tx.outs[1].script, networks.bitcoin), testAddresses[2].address,
                'New owner should be second output')
        t.equal(bjsAddress.fromOutputScript(ownerChange.script, networks.bitcoin), testAddresses[0].address,
                'Prior owner should be third output')
        t.equal(bjsAddress.fromOutputScript(tx.outs[3].script, networks.bitcoin), BURN_ADDR,
                'Burn address should be fourth output')
        t.equal(bjsAddress.fromOutputScript(changeOut.script, networks.bitcoin), testAddresses[1].address,
                'Payer change should be fifth output')
        t.equal(inputVals - change, estimatedCost, 'Estimated cost should be accurate.')
        t.equal(tx.ins.length, 4, 'Should use both payer utxos and one owner utxo')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx of length ${txLen} should roughly equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('build and fund renewal with stacks', (t) => {
    t.plan(8)
    setupMocks()

    Promise.all(
      [transactions.estimateRenewal('bar.test2',
                                    testAddresses[2].address,
                                    testAddresses[0].address,
                                    testAddresses[1].address,
                                    true,
                                    3),
       transactions.makeRenewal('bar.test2',
                                testAddresses[2].address,
                                testAddresses[0].skHex,
                                testAddresses[1].skHex,
                                'hello world')]
    )
      .then(([estimatedCost, hexTX]) => {
        const tx = Transaction.fromHex(hexTX)
        const txLen = hexTX.length / 2
        const outputVals = sumOutputValues(tx)
        const inputVals = getInputVals(tx)
        const fee = inputVals - outputVals

        // payer change address is the 5th output...
        const changeOut = tx.outs[4]
        // old owner change address is the 3rd output
        const ownerChange = tx.outs[2]

        const change = (changeOut as TxOutput).value

        t.equal(bjsAddress.fromOutputScript(tx.outs[1].script, networks.bitcoin), testAddresses[2].address,
                'New owner should be second output')
        t.equal(bjsAddress.fromOutputScript(ownerChange.script, networks.bitcoin), testAddresses[0].address,
                'Prior owner should be third output')
        t.equal(bjsAddress.fromOutputScript(tx.outs[3].script, networks.bitcoin), NAMESPACE_BURN_ADDR,
                'Burn address should be fourth output, and it should be 11111....')
        t.equal(bjsAddress.fromOutputScript(changeOut.script, networks.bitcoin), testAddresses[1].address,
                'Payer change should be fifth output')
        t.equal(inputVals - change, estimatedCost, 'Estimated cost should be accurate.')
        t.equal(tx.ins.length, 4, 'Should use both payer utxos and one owner utxo')
        t.equal((tx.outs[3] as TxOutput).value, 5500, 'Output should not have burned more than +DUST_MINIMUM')
        t.ok(Math.floor(fee / txLen) > 990 && Math.floor(fee / txLen) < 1010,
             `Paid fee of ${fee} for tx of length ${txLen} should roughly equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })

  test('use alternative magic bytes', (t) => {
    t.plan(24)
    setupMocks()

    const ns = new transactions.BlockstackNamespace('hello')
    ns.setVersion(3)
    ns.setLifetime(52595)
    ns.setCoeff(4)
    ns.setBase(4)
    ns.setBuckets([6, 5, 4, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
    ns.setNonalphaDiscount(10)
    ns.setNoVowelDiscount(10)

    Promise.resolve().then(() => {
      network.defaults.MAINNET_DEFAULT.MAGIC_BYTES = 'di'
      return Promise.all([
        transactions.makeNamespacePreorder('hello',
                                           testAddresses[3].address,
                                           testAddresses[2].skHex),
        transactions.makeNamespaceReveal(ns,
                                         testAddresses[3].address,
                                         testAddresses[2].skHex),
        transactions.makeNameImport(
          'import.hello', '151nahdGD9Dxd7xpwPeBECn5iEi4Thb7Rv',
          'cabdbc18ece9ffb6a7378faa4ac4ce58dcaaf575', testAddresses[3].skHex
        ),
        transactions.makeNamespaceReady('hello',
                                        testAddresses[3].skHex),
        transactions.makePreorder('foo.test',
                                  testAddresses[0].address,
                                  testAddresses[1].skHex),
        transactions.makeRegister('foo.test',
                                  testAddresses[0].address,
                                  testAddresses[1].skHex, 'hello world'),
        transactions.makeUpdate('foo.test',
                                testAddresses[0].skHex,
                                testAddresses[1].skHex,
                                'hello world'),
        transactions.makeTransfer('foo.test',
                                  testAddresses[2].address,
                                  testAddresses[0].skHex,
                                  testAddresses[1].skHex),
        transactions.makeRenewal('foo.test',
                                 testAddresses[2].address,
                                 testAddresses[0].skHex,
                                 testAddresses[1].skHex,
                                 'hello world'),
        transactions.makeRevoke('foo.test',
                                testAddresses[0].skHex,
                                testAddresses[1].skHex),
        transactions.makeAnnounce(
          '53bb740c47435a51b07ecf0b9e086a2ad3c12c1d', testAddresses[3].skHex
        ),
        transactions.makeTokenTransfer(testAddresses[1].address,
                                       'STACKS',
                                       new BN('123'),
                                       'hello world!',
                                       testAddresses[4].skHex)
      ])
    })
      .then((txs) => {
        for (let i = 0; i < txs.length; i++) {
          const tx = Transaction.fromHex(txs[i])
          const nullOut = tx.outs[0].script
          t.equal(network.defaults.MAINNET_DEFAULT.MAGIC_BYTES, 'di')
          t.equal(Buffer.from(nullOut).toString().substring(2, 4), 'di')
        }
      })
      .then(() => { network.defaults.MAINNET_DEFAULT.MAGIC_BYTES = 'id' })
  })
        
  test(`broadcastTransaction:
    send via broadcast service with transaction to watch with default confs`, (t) => {
    t.plan(1)
    FetchMock.restore()
    const transaction = 'abc'
    const transactionToWatch = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
    const confirmations = 6
    FetchMock.post('https://broadcast.blockstack.org/v1/broadcast/transaction',
                   {
                     body: {
                       transaction,
                       transactionToWatch,
                       confirmations
                     },
                     status: 202
                   })

    network.defaults.MAINNET_DEFAULT.broadcastTransaction(transaction,
                                                          transactionToWatch).then(() => {
      t.assert(FetchMock.done())
    })
  })

  test(`broadcastTransaction:
    rejects with error when broadcast service has a problem`, (t) => {
    t.plan(3)
    FetchMock.restore()
    const transaction = 'abc'
    const transactionToWatch = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
    const confirmations = 6
    const expectedBody = JSON.stringify({
      transaction,
      transactionToWatch,
      confirmations
    })

    // @ts-ignore
    FetchMock.postOnce({
      name: 'Broadcast',
      matcher: (url, opts) => (url === 'https://broadcast.blockstack.org/v1/broadcast/transaction'
          && opts
          && opts.body === expectedBody),
      response: {
        result: {},
        status: 500
      }
    })

    network.defaults.MAINNET_DEFAULT.broadcastTransaction(transaction,
                                                          transactionToWatch)
      .catch((error) => {
        t.assert(FetchMock.done())
        t.assert(error.response)
        t.equal(error.code, 'remote_service_error')
      })
  })


  test(`broadcastTransaction:
    send via broadcast service with transaction to watch with custom confs`, (t) => {
    t.plan(1)
    FetchMock.restore()
    const transaction = 'abc'
    const transactionToWatch = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
    const confirmations = 8

    const expectedBody = JSON.stringify({
      transaction,
      transactionToWatch,
      confirmations
    })

    // @ts-ignore
    FetchMock.postOnce({
      name: 'Broadcast',
      matcher: (url, opts) => (url === 'https://broadcast.blockstack.org/v1/broadcast/transaction'
          && opts
          && opts.body === expectedBody),
      response: {
        body: JSON.stringify({}),
        status: 202
      }
    })

    network.defaults.MAINNET_DEFAULT.broadcastTransaction(transaction,
                                                          transactionToWatch, confirmations)
      .then(() => {
        t.assert(FetchMock.done())
      })
  })

  test('broadcastTransaction: send immediately via utxo service', (t) => {
    t.plan(1)
    FetchMock.restore()
    const transaction = '01000000010470c3139dc0f0882f98d75ae5bf957e68da'
    + 'dd32c5f81261c0b13e85f592ff7b0000000000ffffffff02b286a61e00000000'
    + '1976a9140f39a0043cf7bdbe429c17e8b514599e9ec53dea88ac010000000000'
    + '00001976a9148a8c9fd79173f90cf76410615d2a52d12d27d21288ac00000000'

    // @ts-ignore
    FetchMock.postOnce({
      name: 'Broadcast',
      matcher: (url, opts) => (url === 'https://blockchain.info/pushtx?cors=true'
          && opts
          && opts.body),
      response: {
        body: 'transaction submitted',
        status: 202
      }
    })

    network.defaults.MAINNET_DEFAULT.broadcastTransaction(transaction)
      .then(() => {
        t.assert(FetchMock.done())
      })
  })

  test('broadcastTransaction: rejects with error when utxo provider has a problem', (t) => {
    t.plan(3)
    FetchMock.restore()
    const transaction = '01000000010470c3139dc0f0882f98d75ae5bf957e68da'
    + 'dd32c5f81261c0b13e85f592ff7b0000000000ffffffff02b286a61e00000000'
    + '1976a9140f39a0043cf7bdbe429c17e8b514599e9ec53dea88ac010000000000'
    + '00001976a9148a8c9fd79173f90cf76410615d2a52d12d27d21288ac00000000'

    // @ts-ignore
    FetchMock.postOnce({
      name: 'Broadcast',
      matcher: (url, opts) => (url === 'https://blockchain.info/pushtx?cors=true'
          && opts
          && opts.body),
      response: {
        body: 'something else',
        status: 500
      }
    })
    network.defaults.MAINNET_DEFAULT.broadcastTransaction(transaction)
      .catch((error) => {
        t.assert(FetchMock.done())
        t.assert(error.response)
        t.equal(error.code, 'remote_service_error')
      })
  })

  test('broadcastZoneFile: send via broadcast service with transaction to watch', (t) => {
    t.plan(1)
    FetchMock.restore()
    const zoneFile = '$ORIGIN satoshi.id\n$TTL 3600\n_http._tcp	IN	URI	10	1	"https://example.com/satoshi.json"\n\n'
    const transactionToWatch = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'

    const expectedBody = JSON.stringify({
      zoneFile,
      transactionToWatch
    })
    // @ts-ignore
    FetchMock.postOnce({
      name: 'Broadcast',
      matcher: (url, opts) => (url === 'https://broadcast.blockstack.org/v1/broadcast/zone-file'
          && opts
          && opts.body === expectedBody),
      response: {
        body: JSON.stringify({}),
        status: 202
      }
    })

    network.defaults.MAINNET_DEFAULT.broadcastZoneFile(zoneFile, transactionToWatch).then(() => {
      t.assert(FetchMock.done())
    })
  })

  test('broadcastZoneFile: rejects with error if broadcast service error', (t) => {
    t.plan(3)
    FetchMock.restore()
    const zoneFile = '$ORIGIN satoshi.id\n$TTL 3600\n_http._tcp	IN	URI	10	1	"https://example.com/satoshi.json"\n\n'
    const transactionToWatch = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'

    const expectedBody = JSON.stringify({
      zoneFile,
      transactionToWatch
    })
    // @ts-ignore
    FetchMock.postOnce({
      name: 'Broadcast',
      matcher: (url, opts) => (url === 'https://broadcast.blockstack.org/v1/broadcast/zone-file'
          && opts
          && opts.body === expectedBody),
      response: {
        body: JSON.stringify({}),
        status: 500
      }
    })

    network.defaults.MAINNET_DEFAULT.broadcastZoneFile(zoneFile, transactionToWatch)
      .catch((error) => {
        t.assert(FetchMock.done())
        t.assert(error.response)
        t.equal(error.code, 'remote_service_error')
      })
  })

  test('broadcastZoneFile: rejects with error if core endpoint error', (t) => {
    t.plan(3)
    FetchMock.restore()
    const zonefile = '$ORIGIN satoshi.id\n$TTL 3600\n_http._tcp	IN	URI	10	1	"https://example.com/satoshi.json"\n\n'
    const expectedBody = JSON.stringify({ zonefile })

    // @ts-ignore
    FetchMock.postOnce({
      name: 'Broadcast',
      matcher: (url, opts) => (url === 'https://core.blockstack.org/v1/zonefile/'
          && opts.body === expectedBody),
      response: {
        body: JSON.stringify({ error: 'core indicates an error like this' }),
        status: 200
      }
    })

    network.defaults.MAINNET_DEFAULT.broadcastZoneFile(zonefile)
      .catch((error) => {
        t.assert(FetchMock.done())
        t.assert(error.response)
        t.equal(error.code, 'remote_service_error')
      })
  })

  test('broadcastZoneFile: send immediately via core atlas endpoint', (t) => {
    t.plan(1)
    FetchMock.restore()
    const zonefile = '$ORIGIN satoshi.id\n$TTL 3600\n_http._tcp	IN	URI	10	1	"https://example.com/satoshi.json"\n\n'
    const expectedBody = JSON.stringify({ zonefile })

    // @ts-ignore
    FetchMock.postOnce({
      name: 'Broadcast',
      matcher: (url, opts) => (url === 'https://core.blockstack.org/v1/zonefile/'
          && opts
          && opts.body === expectedBody),
      response: {
        body: JSON.stringify({}),
        status: 202
      }
    })

    network.defaults.MAINNET_DEFAULT.broadcastZoneFile(zonefile).then(() => {
      t.assert(FetchMock.done())
    })
  })

  test(`broadcastZoneFile: rejects with missing parameter error when
     zone file not provided`, (t) => {
    t.plan(2)
    FetchMock.restore()

    network.defaults.MAINNET_DEFAULT.broadcastZoneFile()
      .catch((error) => {
        t.assert(error)
        t.equal(error.code, 'missing_parameter')
      })
  })

  test('broadcastNameRegistration', (t) => {
    t.plan(1)
    FetchMock.restore()
    const zoneFile = '$ORIGIN satoshi.id\n$TTL 3600\n_http._tcp	IN	URI	10	1	"https://example.com/satoshi.json"\n\n'
    const preorderTransaction = 'abc'
    const registerTransaction = '123'

    const expectedBody = JSON.stringify({
      preorderTransaction,
      registerTransaction,
      zoneFile
    })

    // @ts-ignore
    FetchMock.postOnce({
      name: 'Broadcast',
      matcher: (url, opts) => (url === 'https://broadcast.blockstack.org/v1/broadcast/registration'
          && opts
          && opts.body === expectedBody),
      response: {
        body: JSON.stringify({}),
        status: 202
      }
    })

    network.defaults.MAINNET_DEFAULT.broadcastNameRegistration(preorderTransaction,
                                                               registerTransaction, zoneFile)
      .then(() => {
        t.assert(FetchMock.done())
      })
  })

  test('broadcastNameRegistration: reject with error if service replies with error', (t) => {
    t.plan(4)
    FetchMock.restore()
    const zoneFile = '$ORIGIN satoshi.id\n$TTL 3600\n_http._tcp	IN	URI	10	1	"https://example.com/satoshi.json"\n\n'
    const preorderTransaction = 'abc'
    const registerTransaction = '123'

    const expectedBody = JSON.stringify({
      preorderTransaction,
      registerTransaction,
      zoneFile
    })

    // @ts-ignore
    FetchMock.postOnce({
      name: 'Broadcast',
      matcher: (url, opts) => (url === 'https://broadcast.blockstack.org/v1/broadcast/registration'
          && opts
          && opts.body === expectedBody),
      response: {
        body: JSON.stringify({}),
        status: 500
      }
    })

    network.defaults.MAINNET_DEFAULT.broadcastNameRegistration(preorderTransaction,
                                                               registerTransaction, zoneFile)
      .catch((error) => {
        t.assert(FetchMock.done())
        t.assert(error)
        t.assert(error.response)
        t.equal(error.code, 'remote_service_error')
      })
  })

  test(`broadcastNameRegistration: reject with error
    when transactions or zoneFile not provided`, (t) => {
    const zoneFile = '$ORIGIN satoshi.id\n$TTL 3600\n_http._tcp	IN	URI	10	1	"https://example.com/satoshi.json"\n\n'
    const preorderTransaction = 'abc'
    const registerTransaction = '123'
    t.plan(9)
    FetchMock.restore()

    network.defaults.MAINNET_DEFAULT.broadcastNameRegistration(undefined,
                                                               registerTransaction, zoneFile)
      .catch((error) => {
        t.assert(error)
        t.equal(error.code, 'missing_parameter')
        t.equal(error.parameter, 'preorderTransaction')
      })

    network.defaults.MAINNET_DEFAULT.broadcastNameRegistration(preorderTransaction,
                                                               undefined, zoneFile)
      .catch((error) => {
        t.assert(error)
        t.equal(error.code, 'missing_parameter')
        t.equal(error.parameter, 'registerTransaction')
      })

    network.defaults.MAINNET_DEFAULT.broadcastNameRegistration(preorderTransaction,
                                                               registerTransaction, undefined)
      .catch((error) => {
        t.assert(error)
        t.equal(error.code, 'missing_parameter')
        t.equal(error.parameter, 'zoneFile')
      })
  })

  test('getNamespaceBurnAddress: pay to namespace creator before year 1', (t) => {
    t.plan(1)
    FetchMock.restore()
    FetchMock.get('https://blockchain.info/latestblock?cors=true',
                  { height: 601 })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test',
                  { version: 2, address: BURN_ADDR, reveal_block: 600 })

    network.defaults.MAINNET_DEFAULT.getNamespaceBurnAddress('test')
      .then((baddr) => {
        t.equal(baddr, BURN_ADDR, 'Pay to namespace creator in year 1')
      })
  })

  test('getNamespaceBurnAddress: pay to burn address after year 1', (t) => {
    t.plan(1)
    FetchMock.restore()
    FetchMock.get('https://blockchain.info/latestblock?cors=true',
                  { height: 600 + 52595 })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test',
                  { version: 2, address: BURN_ADDR, reveal_block: 600 })

    network.defaults.MAINNET_DEFAULT.getNamespaceBurnAddress('test')
      .then((baddr) => {
        t.equal(baddr, BURN_ADDR, 'Pay to namespace creator exactly on year 1')
      })
  })

  test('getNamespaceBurnAddress: pay to burn address after year 1', (t) => {
    t.plan(1)
    FetchMock.restore()
    FetchMock.get('https://blockchain.info/latestblock?cors=true',
                  { height: 600 + 52595 + 1 })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test',
                  { version: 2, address: BURN_ADDR, reveal_block: 600 })

    network.defaults.MAINNET_DEFAULT.getNamespaceBurnAddress('test')
      .then((baddr) => {
        t.equal(baddr, NAMESPACE_BURN_ADDR, 'Pay to burn address after year 1')
      })
  })
}

function safetyTests() {
  test('addCanReceiveName', (t) => {
    t.plan(3)
    FetchMock.restore()
    FetchMock.get(`https://core.blockstack.org/v1/addresses/bitcoin/${testAddresses[1].address}`,
                  { names: ['dummy.id', 'dummy.id', 'dummy.id'] })
    const namesTooMany = new Array(25)
    namesTooMany.fill('dummy.id')
    FetchMock.get(`https://core.blockstack.org/v1/addresses/bitcoin/${testAddresses[0].address}`,
                  { names: namesTooMany })

    const namesWithSubdomains = new Array(25)
    namesWithSubdomains.fill('dummy.id')
    namesWithSubdomains[24] = 'dummy.dummy.id'
    FetchMock.get(`https://core.blockstack.org/v1/addresses/bitcoin/${testAddresses[2].address}`,
                  { names: namesWithSubdomains })

    Promise.all([safety.addressCanReceiveName(testAddresses[0].address),
                 safety.addressCanReceiveName(testAddresses[1].address),
                 safety.addressCanReceiveName(testAddresses[2].address)])
      .then(([t0, t1, t2]) => {
        t.ok(t1, `Test address ${testAddresses[1].address} should not have too many names.`)
        t.ok(!t0, `Test address ${testAddresses[0].address} should have too many names.`)
        t.ok(t2, `Test address ${testAddresses[2].address} should not have too many names.`)
      })
  })

  test('ownsName', (t) => {
    t.plan(2)
    FetchMock.restore()
    FetchMock.get('https://core.blockstack.org/v1/names/foo.test',
                  { address: testAddresses[0].address })

    Promise.all([safety.ownsName('foo.test', testAddresses[0].address),
                 safety.ownsName('foo.test', testAddresses[1].address)])
      .then(([t0, t1]) => {
        t.ok(t0, `Test address ${testAddresses[0].address} should own foo.test`)
        t.ok(!t1, `Test address ${testAddresses[1].address} should not own foo.test`)
      })
  })

  test('nameInGracePeriod', (t) => {
    t.plan(4)
    FetchMock.restore()

    FetchMock.get('https://core.blockstack.org/v1/names/bar.test',
                  { body: 'Name available', status: 404 })
    FetchMock.get('https://core.blockstack.org/v1/names/foo.test',
                  { expire_block: 50 })
    FetchMock.getOnce('https://blockchain.info/latestblock?cors=true',
                      { height: 49 })
    safety.isInGracePeriod('foo.test')
      .then((result) => {
        t.ok(!result, 'name should not be in grace period if it isnt expired')
        FetchMock.getOnce('https://blockchain.info/latestblock?cors=true',
                          { height: 50 })
        return safety.isInGracePeriod('foo.test')
      })
      .then((result) => {
        t.ok(result, 'name should be in grace period')
        FetchMock.get('https://blockchain.info/latestblock?cors=true',
                      { height: 5050 })
        return safety.isInGracePeriod('foo.test')
      })
      .then((result) => {
        t.ok(!result, 'grace period should have passed')
        return safety.isInGracePeriod('bar.test')
      })
      .then((result) => {
        t.ok(!result, 'bar.test isnt registered. not in grace period')
      })
      .catch(err => console.error(err.stack))
  })

  test('nameAvailable', (t) => {
    t.plan(2)
    FetchMock.restore()
    FetchMock.get('https://core.blockstack.org/v1/names/foo.test',
                  { body: 'Name available', status: 404 })
    FetchMock.get('https://core.blockstack.org/v1/names/bar.test',
                  { address: testAddresses[0].address })

    Promise.all([safety.isNameAvailable('foo.test'),
                 safety.isNameAvailable('bar.test')])
      .then(([t0, t1]) => {
        t.ok(t0, 'foo.test should be available')
        t.ok(!t1, 'bar.test isnt available')
      })
  })

  test('nameValid', (t) => {
    t.plan(11)

    const shouldFail = [
      {
        name: '123456789012345678901234567890.1234567',
        reason: 'is too long'
      },
      {
        name: '1234567890123456789012345678901234567',
        reason: 'has no namespace'
      },
      {
        name: '1.2.3',
        reason: 'is a subdomain'
      },
      {
        name: null,
        reason: 'is null'
      },
      {
        name: '.43',
        reason: 'has no name'
      },
      {
        name: '43#43.xyz',
        reason: 'illegal character'
      },
      {
        name: '43 43.xyz',
        reason: 'illegal character'
      }]
      .map(x => safety.isNameValid(x.name).then(
        passed => t.ok(!passed, `${x.name} should fail for: ${x.reason}`)
      ))

    const shouldPass = ['abc123.id', 'abcd123.1',
                        '123456789012345678901234567890.123456',
                        'abc_+-123.id']
      .map(x => safety.isNameValid(x).then(
        passed => t.ok(passed, `${x} should pass`)
      ))

    Promise.all(shouldPass)
      .then(() => Promise.all(shouldFail))
  })

  test('namespaceValid', (t) => {
    t.plan(8)

    const shouldFail = [
      {
        namespaceID: '',
        reason: 'empty string'
      },
      {
        namespaceID: '0123456789abcdefghij',
        reason: 'too long'
      },
      {
        namespaceID: '01234567.89',
        reason: 'has a period'
      },
      {
        namespaceID: '.123456789',
        reason: 'starts with a period'
      },
      {
        namespaceID: 'abcdef#ghi',
        reason: 'illegal character'
      }]
      .map(x => safety.isNamespaceValid(x.namespaceID).then(
        passed => t.ok(!passed, `${x.namespaceID} should fail for : ${x.reason}`)
      ))

    const shouldPass = ['0123456789abcdefghi', 'a-b-c', 'a_b_c']
      .map(x => safety.isNamespaceValid(x).then(
        passed => t.ok(passed, `${x} should pass`)
      ))

    Promise.all(shouldPass)
      .then(() => Promise.all(shouldFail))
  })

  test('namespaceAvailable', (t) => {
    t.plan(3)
    FetchMock.restore()
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test',
                  { body: 'Namespace available', status: 404 })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test2',
                  { address: testAddresses[0].address })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test3',
                  { body: 'Some error', status: 400 })

    const errorCheck = safety.isNamespaceAvailable('test3').then(() => false).catch(() => true)
    Promise.all([safety.isNamespaceAvailable('test'),
                 safety.isNamespaceAvailable('test2'),
                 errorCheck])
      .then(([t0, t1, t2]) => {
        t.ok(t0, 'test should be available')
        t.ok(!t1, 'test2 isn\'t available')
        t.ok(t2, 'test3 isn\'t available')
      })
  })

  test('revealedNamespace', (t) => {
    t.plan(4)
    FetchMock.restore()
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test',
                  { recipient_address: testAddresses[0].address })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test2',
                  { recipient_address: testAddresses[1].address })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test3',
                  { body: 'Namespace not found', status: 404 })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test4',
                  { body: 'Some error', status: 400 })

    const errorCheck = safety.revealedNamespace('test3', testAddresses[0].address)
      .then(() => false).catch(() => true)

    Promise.all([safety.revealedNamespace('test', testAddresses[0].address),
                 safety.revealedNamespace('test2', testAddresses[0].address),
                 safety.revealedNamespace('test3', testAddresses[0].address),
                 errorCheck])
      .then(([t0, t1, t2, t3]) => {
        t.ok(t0, `test should be revealed by ${testAddresses[0].address}`)
        t.ok(!t1, `test2 isn't revealed by ${testAddresses[0].address}`)
        t.ok(!t2, 'test3 isn\'t available')
        t.ok(!t3, 'test4 isn\'t resolvable')
      })
  })

  test('namespaceIsReady', (t) => {
    t.plan(4)
    FetchMock.restore()
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test', { ready: true })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test2', { ready: false })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test3',
                  { body: 'Namespace not found', status: 404 })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test4',
                  { body: 'Some other error', status: 400 })

    const errorCheck = Promise.resolve().then(() => false).catch(() => true)

    Promise.all([safety.namespaceIsReady('test'),
                 safety.namespaceIsReady('test2'),
                 safety.namespaceIsReady('test3'),
                 errorCheck])
      .then(([t0, t1, t2, t3]) => {
        t.ok(t0, 'test should be ready')
        t.ok(!t1, 'test2 should not be ready')
        t.ok(!t2, 'test3 should not be ready')
        t.ok(!t3, 'test4 should not be ready')
      })
  })

  test('namespaceIsRevealed', (t) => {
    t.plan(4)
    FetchMock.restore()
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test', { ready: false })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test2', { ready: true })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test3',
                  { body: 'Namespace not found', status: 404 })
    FetchMock.get('https://core.blockstack.org/v1/namespaces/test4',
                  { body: 'Some other error', status: 400 })

    const errorCheck = Promise.resolve().then(() => false).catch(() => true)

    Promise.all([safety.namespaceIsRevealed('test'),
                 safety.namespaceIsRevealed('test2'),
                 safety.namespaceIsRevealed('test3'),
                 errorCheck])
      .then(([t0, t1, t2, t3]) => {
        t.ok(t0, 'test should be revealed')
        t.ok(!t1, 'test2 should not be revealed')
        t.ok(!t2, 'test3 should not be revealed')
        t.ok(!t3, 'test4 should not be revealed')
      })
  })
}


export function runOperationsTests() {
  networkTests()
  utilsTests()
  transactionTests()
  safetyTests()
}
