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

    const nsPay = '6e50431b955fe73f079469b24f06480aee44e4519282686433195b3c4b5336ef01'
    const nsReveal = 'c244642ce0b4eb68da8e098facfcad889e3063c36a68b7951fb4c085de49df1b'

    const nsRevealAddress = hexStringToECPair(nsPay).getAddress()

    const dest = '19238846ac60fa62f8f8bb8898b03df79bc6112600181f36061835ad8934086001'
    const destAddress = hexStringToECPair(dest).getAddress()

    const btcDest = '897f1b92041b798580f96b8be379053f6276f04eb7590a9042a62059d46d6fc301'
    const btcDestAddress = hexStringToECPair(btcDest).getAddress()

    const payer = 'bb68eda988e768132bc6c7ca73a87fb9b0918e9a38d3618b74099be25f7cab7d01'

    const secondOwner = '54164693e3803223f7fa9a004997bfbf1475f5c44f65593fa45c6783086dafec01'
    const transferDestination = hexStringToECPair(secondOwner).getAddress()

    const renewalDestination = 'myPgwEX2ddQxPPqWBRkXNqL3TwuWbY29DJ'

    const zfTest = '$ORIGIN aaron.hello\n$TTL 3600\n_http._tcp URI 10 1 ' +
          `"https://gaia.blockstacktest.org/hub/${destAddress}/0/profile.json"`
    const zfTest2 = '$ORIGIN aaron.hello\n$TTL 3600\n_http._tcp URI 10 1 ' +
          `"https://gaia.blockstacktest.org/hub/${destAddress}/3/profile.json"`
    const renewalZF = '$ORIGIN aaron.hello\n$TTL 3600\n_http._tcp URI 10 1 ' +
          `"https://gaia.blockstacktest.org/hub/${destAddress}/4/profile.json"`

    initializeBlockstackCore()
      .then(() => {
        console.log('Blockstack Core initialized.')
        console.log('Preorder namespace "hello"')
        return transactions.makeNamespacePreorder('hello', nsRevealAddress, nsPay)
      })
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('NAMESPACE_PREORDER broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => {
        const ns = transactions.BlockstackNamespace('test')
        ns.setVersion(1)
        ns.setLifetime(52595)
        ns.setCoeff(4)
        ns.setBase(4)
        ns.setBuckets([6, 5, 4, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
        ns.setNonalphaDiscount(10)
        ns.setNoVowelDiscount(10)
        console.log('Reveal namespace "hello"')
        return transactions.makeNamespaceReveal(ns, nsRevealAddress, nsPay)
      })
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('NAMESPACE_REVEAL broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => {
        console.log('Launch namespace "hello"')
        return transactions.makeNamespaceReady('hello', nsReveal)
      })
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('NAMESPACE_READY broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => {
        console.log('Namespace initialized.  Preordering aaron.hello')
        return transactions.makePreorder('aaron.hello', destAddress, payer)
      })
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('PREORDER broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => transactions.makeRegister('aaron.hello', destAddress, payer, zfTest))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('REGISTER broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => myNet.broadcastZoneFile(zfTest))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.hello`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(myNet.coerceAddress(nameInfo.address), destAddress,
                `aaron.hello should be owned by ${destAddress}`)
        t.equal(nameInfo.zonefile, zfTest, 'zonefile should be properly set')
      })
      .then(() => transactions.makeUpdate('aaron.hello', dest, payer, zfTest2))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('UPDATE broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => myNet.broadcastZoneFile(zfTest2))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.hello`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(nameInfo.zonefile, zfTest2, 'zonefile should be updated')
      })
      .then(() => transactions.makeTransfer('aaron.hello', transferDestination, dest, payer))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('TRANSFER broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.hello`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(myNet.coerceAddress(nameInfo.address), transferDestination,
                `aaron.hello should be owned by ${transferDestination}`)
      })
      .then(() => transactions.makeRenewal('aaron.hello', renewalDestination,
                                           secondOwner, payer, renewalZF))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('RENEWAL broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => myNet.broadcastZoneFile(renewalZF))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.hello`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(nameInfo.zonefile, renewalZF, 'zonefile should be updated')
        t.equal(myNet.coerceAddress(nameInfo.address), renewalDestination,
                `aaron.hello should be owned by ${renewalDestination}`)
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
