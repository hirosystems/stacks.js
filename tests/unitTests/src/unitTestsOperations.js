import test from 'tape'
import FetchMock from 'fetch-mock'
import btc from 'bitcoinjs-lib'

import { addUTXOsToFund, sumOutputValues } from '../../../lib/operations/utils'

import { transactions } from '../../../lib/'

const testAddresses = [
  { skHex: '85b33fdfa5efeca980806c6ad3c8a55d67a850bd987237e7d49c967566346fbd01',
    address: '1br553PVnK6F5nyBtb4ju1owwBKdsep5c' },
  { skHex: '744196d67ed78fe39009c71fbfd53e6ecca98353fbfe81ccba21b0703a69be9c01',
    address: '16xVjkJ3nY62B9t9q3N9wY6hx1duAfwRZR' }
]

function runAddUTXOsToFundTests() {
  test('addUTXOsToFundSingleUTXO', (t) => {
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
  runAddUTXOsToFundTests()
  transactionTests()
}
