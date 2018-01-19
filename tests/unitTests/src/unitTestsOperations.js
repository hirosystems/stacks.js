import test from 'tape'
import FetchMock from 'fetch-mock'
import btc from 'bitcoinjs-lib'

import { addUTXOsToFund } from '../../../lib/operations/utils'

const testAddresses = [
  { skHex: '85b33fdfa5efeca980806c6ad3c8a55d67a850bd987237e7d49c967566346fbd01',
    address: '1br553PVnK6F5nyBtb4ju1owwBKdsep5c' },
  { skHex: '744196d67ed78fe39009c71fbfd53e6ecca98353fbfe81ccba21b0703a69be9c01',
    address: '16xVjkJ3nY62B9t9q3N9wY6hx1duAfwRZR' }
]

export function runOperationsTests() {

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
