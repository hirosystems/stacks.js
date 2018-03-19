import { exec } from 'child_process'
import test from 'tape'

import { transactions, config, network, hexStringToECPair } from '../../../lib'

function pExec(cmd) {
  return new Promise(
    (resolve, reject) => {
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          reject(err)
        } else {
          resolve(stdout, stderr)
        }
      })
    })
}

function initializeBlockstackCore() {
  return pExec('docker pull quay.io/blockstack/integrationtests:develop')
    .then(() => {
      console.log('Pulled latest docker image')
      return pExec(`docker stop test-bsk-core ;
        docker rm test-bsk-core ;
        rm -rf /tmp/.blockstack_int_test`)
        .catch(() => true)
    })
    .then(() => pExec('docker run --name test-bsk-core -dt -p 16268:16268 -p 18332:18332 ' +
                      '-e BLOCKSTACK_TEST_CLIENT_RPC_PORT=16268 ' +
                      '-e BLOCKSTACK_TEST_CLIENT_BIND=0.0.0.0 ' +
                      '-e BLOCKSTACK_TEST_BITCOIND_ALLOWIP=172.17.0.0/16 ' +
                      'quay.io/blockstack/integrationtests:develop ' +
                      'blockstack-test-scenario --interactive 2 ' +
                      'blockstack_integration_tests.scenarios.portal_test_env'))
    .then(() => {
      console.log('Started regtest container, waiting until initialized')
      return pExec('docker logs -f test-bsk-core | grep -q \'Test finished\'')
    })
}

function shutdownBlockstackCore() {
  return pExec('docker stop test-bsk-core')
}

export function runIntegrationTests() {
  test('registerName', (t) => {
    t.plan(7)

    config.network = network.defaults.LOCAL_REGTEST
    const myNet = config.network

    const dest = '19238846ac60fa62f8f8bb8898b03df79bc6112600181f36061835ad8934086001'
    const destAddress = hexStringToECPair(dest).getAddress()


    const btcDest = '897f1b92041b798580f96b8be379053f6276f04eb7590a9042a62059d46d6fc301'
    const btcDestAddress = hexStringToECPair(btcDest).getAddress()

    const payer = 'bb68eda988e768132bc6c7ca73a87fb9b0918e9a38d3618b74099be25f7cab7d01'

    const secondOwner = '54164693e3803223f7fa9a004997bfbf1475f5c44f65593fa45c6783086dafec01'
    const transferDestination = hexStringToECPair(secondOwner).getAddress()

    const renewalDestination = 'myPgwEX2ddQxPPqWBRkXNqL3TwuWbY29DJ'

    const zfTest = '$ORIGIN aaron.id\n$TTL 3600\n_http._tcp URI 10 1 ' +
          `"https://gaia.blockstacktest.org/hub/${destAddress}/0/profile.json"`
    const zfTest2 = '$ORIGIN aaron.id\n$TTL 3600\n_http._tcp URI 10 1 ' +
          `"https://gaia.blockstacktest.org/hub/${destAddress}/3/profile.json"`
    const renewalZF = '$ORIGIN aaron.id\n$TTL 3600\n_http._tcp URI 10 1 ' +
          `"https://gaia.blockstacktest.org/hub/${destAddress}/4/profile.json"`

    initializeBlockstackCore()
      .then(() => {
        console.log('Blockstack Core initialized.')
        return transactions.makePreorder('aaron.id', destAddress, payer)
      })
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('PREORDER broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => transactions.makeRegister('aaron.id', destAddress, payer, zfTest))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('REGISTER broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => myNet.broadcastZoneFile(zfTest))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(myNet.coerceAddress(nameInfo.address), destAddress,
                `aaron.id should be owned by ${destAddress}`)
        t.equal(nameInfo.zonefile, zfTest, 'zonefile should be properly set')
      })
      .then(() => transactions.makeUpdate('aaron.id', dest, payer, zfTest2))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('UPDATE broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => myNet.broadcastZoneFile(zfTest2))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(nameInfo.zonefile, zfTest2, 'zonefile should be updated')
      })
      .then(() => transactions.makeTransfer('aaron.id', transferDestination, dest, payer))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('TRANSFER broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(myNet.coerceAddress(nameInfo.address), transferDestination,
                `aaron.id should be owned by ${transferDestination}`)
      })
      .then(() => transactions.makeRenewal('aaron.id', renewalDestination,
                                           secondOwner, payer, renewalZF))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('RENEWAL broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => myNet.broadcastZoneFile(renewalZF))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(nameInfo.zonefile, renewalZF, 'zonefile should be updated')
        t.equal(myNet.coerceAddress(nameInfo.address), renewalDestination,
                `aaron.id should be owned by ${renewalDestination}`)
      })
      .then(() => transactions.makeBitcoinSpend(btcDestAddress, payer, 500000))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('broadcasted SPEND, waiting 10 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => myNet.getUTXOs(btcDestAddress))
      .then((utxos) => {
        t.equal(utxos.length, 1, `Destination address ${btcDestAddress} should have 1 UTXO`)
        const satoshis = utxos.reduce((agg, utxo) => agg + utxo.value, 0)
        console.log(`${btcDestAddress} has ${satoshis} satoshis`)
      })
      .then(() => shutdownBlockstackCore())
  })
}
