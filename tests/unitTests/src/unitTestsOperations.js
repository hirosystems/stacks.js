import test from 'tape'
import FetchMock from 'fetch-mock'
import btc from 'bitcoinjs-lib'

import { estimateTXBytes, addUTXOsToFund, sumOutputValues,
         hash160, hash128, decodeB40 } from '../../../lib/operations/utils'

import { transactions } from '../../../lib/'

const testAddresses = [
  { skHex: '85b33fdfa5efeca980806c6ad3c8a55d67a850bd987237e7d49c967566346fbd01',
    address: '1br553PVnK6F5nyBtb4ju1owwBKdsep5c' },
  { skHex: '744196d67ed78fe39009c71fbfd53e6ecca98353fbfe81ccba21b0703a69be9c01',
    address: '16xVjkJ3nY62B9t9q3N9wY6hx1duAfwRZR' }
]

function utilsTests() {
  test('estimateTXBytes', (t) => {
    t.plan(2)
    let txHex = '010000000288e68977fab8038af07746e5d687652a44aa15f532509c202749d' +
        'bad8a418733000000006b483045022100813ef3534b5030b544e5a5bd1db93f85dc89e2' +
        'a565197a14784edff5564bd65b022008005213c6aa4c7ebe06cfd86bdaf3e662ae58371' +
        '896a0a841e81106fbe1507401210236b07942707a86ab666bb300b58d295d988ce9c3a3' +
        '38a0e08380dd98732fd4faffffffff3ba3edfd7a7b12b27ac72c3e67768f617fc81bc38' +
        '88a51323a9fb8aa4b1e5e4a000000006b483045022100d0c9b1594137186a1dc6c0b3a6' +
        'cbe08399b57e2b8c953584f2ce20bef5642eb902206b9c88b8d2d311db26601acf3068d' +
        'd118649ead4a1f93d029a52c0c61cb2cd2901210236b07942707a86ab666bb300b58d29' +
        '5d988ce9c3a338a0e08380dd98732fd4faffffffff030000000000000000296a2769643' +
        'f363da95bc8d5203d1c07bd87c564a1e6395826cfdfe87cfd31ffa2a3b8101e3e93096f' +
        '2b7c150000000000001976a91441577ec99314a293acbc17d8152137cf4862f7f188ace' +
        '8030000000000001976a9142ebe7b4729185f68c7185c3c6af60fad1b6eeebf88ac00000000'
    let tx = btc.Transaction.fromHex(txHex)
    tx.ins.forEach(x => x.script = null)

    let actualLength = txHex.length / 2
    let estimatedLength = estimateTXBytes(tx, 0, 0)

    let tx2 = new btc.TransactionBuilder()
    tx2.addOutput(tx.outs[0].script, 0)
    let estimatedLength2 = estimateTXBytes(tx2, 2, 2)

    t.ok(estimatedLength >= actualLength - 5 && estimatedLength <= actualLength + 5,
         `TX size estimate is roughly accurate? (estimated: ${estimatedLength}, actual: ${actualLength})`)
    t.ok(estimatedLength2 >= actualLength - 5 && estimatedLength2 <= actualLength + 5,
         `TX size estimate is roughly accurate? (estimated: ${estimatedLength2}, actual: ${actualLength})`)
  })

  test('encoding routines', (t) => {
    t.plan(5)

    t.equal(hash160(Buffer.from(
      '99999566ahjhqwuywqehpzlzlzlzl09189128921jkjlqjosq')).toString('hex'),
            '7ea1fa0f2003c31b015a72af9f4a5f104b5c2840')

    t.equal(hash160(Buffer.from('1234')).toString('hex'),
            'fd7a0d80999bedd76c9a0828057817fc6049a507')

    t.equal(hash128(Buffer.from('999')).toString('hex'),
            '83cf8b609de60036a8277bd0e9613575')

    t.equal(hash128(Buffer.from('99999566ahjhqwuywqehpzlzlzlzl09189128921jkjlqjosqaaa')).toString('hex'),
            '740ae7f18c939cf5e7c189a2c77a012f')

    t.equal(decodeB40('0123456789abcdefghijklmnopqrstuvwxyz-_.+0123456789abcdefghi' +
                      'jklmnopqrstuvwxyz-_.+0123456789abcdefghijklmnopqrstuvwxyz-_' +
                      '.+0123456789abcdefghijklmnopqrstuvwxyz-_.+0123456789abcdefg' +
                      'hijklmnopqrstuvwxyz-_.+'),
            '384a516059e707615a1992d3101f6f346df3326d03ea7b673e3754078895db48da2d0' +
            'fcb1bd89d618b0863bd8bac6db43a2d9cff5cc307310922d3cb8cf9c159d31c6a9c91' +
            '03197263a4e88f52d1b77dfc610e1b8dc9616ba6c2d0a1b792f0d73784c698c69f34a' +
            'e5e7900753627a3ac87529035fb1a6cba7ce2e1df590941cf30a44557')
  })

  test('not enough UTXOs to fund', (t) => {
    t.plan(1)

    let txB = new btc.TransactionBuilder()
    txB.addOutput(testAddresses[0].address, 10000)
    txB.addOutput(testAddresses[1].address, 0)

    const utxos = [{ value: 50000, tx_hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
                    tx_output_n: 0 }]

    t.throws(() => addUTXOsToFund(txB, 1, utxos, 60000, 10),
             /^Error: Not enough UTXOs to fund/,
             'Errors when not enough value to fund')

  })


  test('addUTXOsToFundSingleUTXO', (t) => {
    t.plan(2)

    let txB = new btc.TransactionBuilder()
    txB.addOutput(testAddresses[0].address, 10000)
    txB.addOutput(testAddresses[1].address, 0)

    const utxos = [{ value: 50000, tx_hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
                    tx_output_n: 0 }]

    txB = addUTXOsToFund(txB, 1, utxos, 10000, 10)

    t.equal(txB.tx.outs[1].value, 40000)
    t.equal(txB.tx.ins[0].hash.toString('hex'),
            Buffer.from(utxos[0].tx_hash, 'hex').reverse().toString('hex'))

  })

  test('addUTXOsToFundTwoUTXOs', (t) => {
    t.plan(3)

    let txB = new btc.TransactionBuilder()
    txB.addOutput(testAddresses[0].address, 10000)
    txB.addOutput(testAddresses[1].address, 0)

    const utxos = [{ value: 50000, tx_hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
                    tx_output_n: 0 },
                   { value: 10000, tx_hash: '3387418aaddb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e688',
                    tx_output_n: 0 }]

    txB = addUTXOsToFund(txB, 1, utxos, 55000, 10)

    t.ok(txB.tx.outs[1].value <= 5000, `${txB.tx.outs[1].value} should be less than 5k`)
    t.equal(txB.tx.ins[0].hash.toString('hex'),
            Buffer.from(utxos[0].tx_hash, 'hex').reverse().toString('hex'))
    t.equal(txB.tx.ins[1].hash.toString('hex'),
            Buffer.from(utxos[1].tx_hash, 'hex').reverse().toString('hex'))

  })
}

function transactionTests() {
  test('build and fund preorder', (t) => {
    t.plan(5)

    let utxoValues = [287825]
    let BURN_AMT = 1337
    let BURN_ADDR = '15GAGiT2j2F1EzZrvjk3B8vBCfwVEzQaZx'

    FetchMock.get(`https://blockchain.info/unspent?format=json&active=${testAddresses[1].address}`,
                  [{ value: utxoValues[0],
                     tx_hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
                     tx_output_n: 0 },
                   { value: utxoValues[1],
                     tx_hash: '3387418aaddb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e688',
                     tx_output_n: 0 }])
    FetchMock.get(`https://core.blockstack.org/v1/prices/names/foo.test`,
                  { name_price: { satoshis: BURN_AMT }})
    FetchMock.get(`https://core.blockstack.org/v1/namespaces/test`,
                  { history: { 10: [{burn_address : BURN_ADDR}] } })
    FetchMock.get(`https://core.blockstack.org/v1/blockchains/bitcoin/consensus`,
                  { consensus_hash: 'dfe87cfd31ffa2a3b8101e3e93096f2b' })

    transactions.makePreorder('foo.test',
                              testAddresses[0].address,
                              testAddresses[1].skHex)
      .then(hexTX => {
        t.ok(hexTX)
        let tx = btc.Transaction.fromHex(hexTX)
        let txLen = hexTX.length / 2
        let outputVals = sumOutputValues(tx)
        let inputVals = utxoValues.reduce((agg, x) => agg + x, 0)
        let fee = inputVals - outputVals
        let burnAddress = btc.address.fromOutputScript(tx.outs[2].script)

        t.equal(burnAddress, BURN_ADDR, `Burn address should be ${BURN_ADDR}`)
        t.equal(tx.outs[2].value, BURN_AMT, `Output should have funded name price ${BURN_AMT}`)
        t.equal(tx.ins.length, utxoValues.length, 'Should use all of the utxos for the payer')
        t.equal(Math.floor(fee / txLen), 1000,
                `Paid fee of ${fee} for tx of length ${txLen} should equal 1k satoshi/byte`)
      })
      .catch((err) => { console.log(err.stack); throw err })
  })
}

export function runOperationsTests() {
  utilsTests()
  transactionTests()
}
