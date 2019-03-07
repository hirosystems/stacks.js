import { exec } from 'child_process'
import { promisify } from 'util'
import test from 'tape'

import {
  transactions, config, network, hexStringToECPair, ecPairToAddress
} from '../../../src'
import { hash160 } from '../../../src/operations/utils'

const BLOCKSTACK_TEST = !!process.env.BLOCKSTACK_TEST

async function pExec(cmd: string) {
  try {
    const { stdout } = await promisify(exec)(cmd)
    return stdout
  } catch (error) {
    console.error(`Failed to run "${cmd}": ${error}`)
    throw error
  }
}

function initializeBlockstackCore(): Promise<any> {
  if (BLOCKSTACK_TEST) {
    // running with an external test suite
    return Promise.resolve()
  } else {
    return pExec('docker pull quay.io/blockstack/integrationtests:master')
      .then(() => {
        console.log('Pulled latest docker image')
        return pExec(`docker stop test-bsk-core ;
          docker rm test-bsk-core ;
          rm -rf /tmp/.blockstack_int_test`)
          .catch(() => true)
      })
      .then(() => pExec('docker run --name test-bsk-core -dt '
                        + '-p 16268:16268 -p 18332:18332 -p 30001:30001 '
                        + '-e BLOCKSTACK_TEST_CLIENT_RPC_PORT=16268 '
                        + '-e BLOCKSTACK_TEST_CLIENT_BIND=0.0.0.0 '
                        + '-e BLOCKSTACK_TEST_BITCOIND_ALLOWIP=172.17.0.0/16 '
                        + '-e BLOCKSTACK_WEB_TEST_BIND=0.0.0.0 '
                        + 'quay.io/blockstack/integrationtests:master '
                        + 'blockstack-test-scenario --interactive 2 '
                        + 'blockstack_integration_tests.scenarios.portal_test_env'))
      .then(() => {
        console.log('Started regtest container, waiting until initialized')
        return pExec('docker logs -f test-bsk-core | grep -q \'Test finished\'')
      })
      .then(() => {
        // try to avoid race with nextBlock()
        console.log('Wait 10 seconds for test server to bind')
        return new Promise(resolve => setTimeout(resolve, 10000))
      })
  }
}

function nextBlock(numBlocks?: number): Promise<any> {
  if (BLOCKSTACK_TEST) {
    const options: {method: string, body?: string} = {
      method: 'POST'
    }

    if (!!numBlocks) {
      options.body = `numblocks=${numBlocks}`
    }

    const url = 'http://localhost:30001/nextblock'
    return fetch(url, options)
      .then((resp) => {
        if (resp.status >= 400) {
          throw new Error(`Bad test framework status: ${resp.status}`)
        } else {
          return true
        }
      })
  } else {
    return new Promise(resolve => setTimeout(resolve, 30000))
  }
}

function shutdownBlockstackCore(): Promise<any> {
  if (BLOCKSTACK_TEST) {
    return Promise.resolve()
  } else {
    return pExec('docker stop test-bsk-core')
  }
}

export function runIntegrationTests() {
  test('registerIdName', (t) => {
    t.plan(8)

    config.network = network.defaults.LOCAL_REGTEST
    const myNet = config.network

    const dest = '19238846ac60fa62f8f8bb8898b03df79bc6112600181f36061835ad8934086001'
    const destAddress = ecPairToAddress(hexStringToECPair(dest))


    const btcDest = '897f1b92041b798580f96b8be379053f6276f04eb7590a9042a62059d46d6fc301'
    const btcDestAddress = ecPairToAddress(hexStringToECPair(btcDest))

    const payer = 'bb68eda988e768132bc6c7ca73a87fb9b0918e9a38d3618b74099be25f7cab7d01'

    const secondOwner = '54164693e3803223f7fa9a004997bfbf1475f5c44f65593fa45c6783086dafec01'
    const transferDestination = ecPairToAddress(hexStringToECPair(secondOwner))

    const renewalDestination = 'myPgwEX2ddQxPPqWBRkXNqL3TwuWbY29DJ'

    const zfTest = '$ORIGIN aaron.id\n$TTL 3600\n_http._tcp URI 10 1 '
          + `"https://gaia.blockstacktest.org/hub/${destAddress}/0/profile.json"`
    const zfTest2 = '$ORIGIN aaron.id\n$TTL 3600\n_http._tcp URI 10 1 '
          + `"https://gaia.blockstacktest.org/hub/${destAddress}/3/profile.json"`
    const renewalZF = '$ORIGIN aaron.id\n$TTL 3600\n_http._tcp URI 10 1 '
          + `"https://gaia.blockstacktest.org/hub/${destAddress}/4/profile.json"`

    initializeBlockstackCore()
      .then(() => {
        console.log('Blockstack Core initialized.')
        return transactions.makePreorder('aaron.id', destAddress, payer)
      })
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('PREORDER broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => transactions.makeRegister('aaron.id', destAddress, payer, zfTest))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('REGISTER broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => myNet.broadcastZoneFile(zfTest))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then((nameInfo) => {
        t.equal(myNet.coerceAddress(nameInfo.address), destAddress,
                `aaron.id should be owned by ${destAddress}`)
        t.equal(nameInfo.zonefile, zfTest, 'zonefile should be properly set')
      })
      .then(() => transactions.makeUpdate('aaron.id', dest, payer, zfTest2))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('UPDATE broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => myNet.broadcastZoneFile(zfTest2))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then((nameInfo) => {
        t.equal(nameInfo.zonefile, zfTest2, 'zonefile should be updated')
      })
      .then(() => transactions.makeTransfer('aaron.id', transferDestination, dest, payer))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('TRANSFER broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then((nameInfo) => {
        t.equal(myNet.coerceAddress(nameInfo.address), transferDestination,
                `aaron.id should be owned by ${transferDestination}`)
      })
      .then(() => transactions.makeRenewal('aaron.id', renewalDestination,
                                           secondOwner, payer, renewalZF))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('RENEWAL broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => myNet.broadcastZoneFile(renewalZF))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then((nameInfo) => {
        t.equal(nameInfo.zonefile, renewalZF, 'zonefile should be updated')
        t.equal(myNet.coerceAddress(nameInfo.address), renewalDestination,
                `aaron.id should be owned by ${renewalDestination}`)
      })
      .then(() => transactions.makeBitcoinSpend(btcDestAddress, payer, 500000))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('broadcasted SPEND, waiting 10 seconds.')
        return nextBlock()
      })
      .then(() => myNet.getUTXOs(btcDestAddress))
      .then((utxos) => {
        t.equal(utxos.length, 1, `Destination address ${btcDestAddress} should have 1 UTXO`)
        const satoshis = utxos.reduce((agg, utxo) => agg + utxo.value, 0)
        console.log(`${btcDestAddress} has ${satoshis} satoshis`)
      })
      .then(() => shutdownBlockstackCore())
      .then(() => t.pass('Finished test'))
  })

  test('helloNamespace', (t) => {
    t.plan(11)

    config.network = network.defaults.LOCAL_REGTEST
    const myNet = config.network

    const nsPay = '6e50431b955fe73f079469b24f06480aee44e4519282686433195b3c4b5336ef01'
    const nsReveal = 'c244642ce0b4eb68da8e098facfcad889e3063c36a68b7951fb4c085de49df1b01'

    const nsRevealAddress = ecPairToAddress(hexStringToECPair(nsReveal))

    const dest = '19238846ac60fa62f8f8bb8898b03df79bc6112600181f36061835ad8934086001'
    const destAddress = ecPairToAddress(hexStringToECPair(dest))

    const btcDest = '3ad9f690cc7694572fe7574526ad260ff2e711d608d3224895efd932b1d47c7201'
    const btcDestAddress = ecPairToAddress(hexStringToECPair(btcDest))

    const payer = 'bb68eda988e768132bc6c7ca73a87fb9b0918e9a38d3618b74099be25f7cab7d01'

    const secondOwner = '54164693e3803223f7fa9a004997bfbf1475f5c44f65593fa45c6783086dafec01'
    const transferDestination = ecPairToAddress(hexStringToECPair(secondOwner))

    const renewalKey = 'bb68eda988e768132bc6c7ca73a87fb9b0918e9a38d3618b74099be25f7cab7d'
    const renewalDestination = ecPairToAddress(hexStringToECPair(renewalKey))

    const zfTest = '$ORIGIN aaron.hello\n$TTL 3600\n_http._tcp URI 10 1 '
          + `"https://gaia.blockstacktest.org/hub/${destAddress}/0/profile.json"`
    const zfTest2 = '$ORIGIN aaron.hello\n$TTL 3600\n_http._tcp URI 10 1 '
          + `"https://gaia.blockstacktest.org/hub/${destAddress}/3/profile.json"`
    const renewalZF = '$ORIGIN aaron.hello\n$TTL 3600\n_http._tcp URI 10 1 '
          + `"https://gaia.blockstacktest.org/hub/${destAddress}/4/profile.json"`
    const importZF = '$ORIGIN import.hello\n$TTL 3600\n_http._tcp URI 10 1 '
          + `"https://gaia.blockstacktest.org/hub/${destAddress}/0/profile.json"`

    initializeBlockstackCore()
      .then(() => {
        console.log('Blockstack Core initialized.')
        console.log(`Preorder namespace "hello" to ${nsRevealAddress}`)
        return transactions.makeNamespacePreorder('hello', nsRevealAddress, nsPay)
      })
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('NAMESPACE_PREORDER broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => {
        const ns = new transactions.BlockstackNamespace('hello')
        ns.setVersion(1)
        ns.setLifetime(52595)
        ns.setCoeff(4)
        ns.setBase(4)
        ns.setBuckets([6, 5, 4, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
        ns.setNonalphaDiscount(10)
        ns.setNoVowelDiscount(10)
        console.log(`Reveal namespace "hello" to ${nsRevealAddress}`)
        return transactions.makeNamespaceReveal(ns, nsRevealAddress, nsPay)
      })
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('NAMESPACE_REVEAL broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => {
        console.log('NAME_IMPORT import.hello')
        const zfHash = hash160(Buffer.from(importZF)).toString('hex')
        return transactions.makeNameImport(
          'import.hello', renewalDestination, zfHash, nsReveal
        )
      })
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('NAME_IMPORT broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => myNet.broadcastZoneFile(importZF))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/import.hello`))
      .then(resp => resp.json())
      .then((nameInfo) => {
        t.equal(myNet.coerceAddress(nameInfo.address), renewalDestination,
                `import.hello should be owned by ${renewalDestination}`)
        t.equal(nameInfo.zonefile, importZF, 'zonefile should be properly set for import.hello')
      })
      .then(() => {
        console.log('Launch namespace "hello"')
        return transactions.makeNamespaceReady('hello', nsReveal)
      })
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('NAMESPACE_READY broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => {
        console.log('Namespace initialized.  Preordering aaron.hello')
        return transactions.makePreorder('aaron.hello', destAddress, payer)
      })
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('PREORDER broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => transactions.makeRegister('aaron.hello', destAddress, payer, zfTest))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('REGISTER broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => myNet.broadcastZoneFile(zfTest))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.hello`))
      .then(resp => resp.json())
      .then((nameInfo) => {
        t.equal(myNet.coerceAddress(nameInfo.address), destAddress,
                `aaron.hello should be owned by ${destAddress}`)
        t.equal(nameInfo.zonefile, zfTest, 'zonefile should be properly set')
      })
      .then(() => nextBlock())
      .then(() => nextBlock())
      .then(() => nextBlock())
      .then(() => transactions.makeUpdate('aaron.hello', dest, payer, zfTest2))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('UPDATE broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => myNet.broadcastZoneFile(zfTest2))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.hello`))
      .then(resp => resp.json())
      .then((nameInfo) => {
        t.equal(nameInfo.zonefile, zfTest2, 'zonefile should be updated')
      })
      .then(() => transactions.makeTransfer('aaron.hello', transferDestination, dest, payer))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('TRANSFER broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.hello`))
      .then(resp => resp.json())
      .then((nameInfo) => {
        t.equal(myNet.coerceAddress(nameInfo.address), transferDestination,
                `aaron.hello should be owned by ${transferDestination}`)
      })
      .then(() => nextBlock())
      .then(() => nextBlock())
      .then(() => transactions.makeRenewal('aaron.hello', renewalDestination,
                                           secondOwner, payer, renewalZF))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('RENEWAL broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => myNet.broadcastZoneFile(renewalZF))
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.hello`))
      .then(resp => resp.json())
      .then((nameInfo) => {
        t.equal(nameInfo.zonefile, renewalZF, 'zonefile should be updated')
        t.equal(myNet.coerceAddress(nameInfo.address), renewalDestination,
                `aaron.hello should be owned by ${renewalDestination}`)
      })
      .then(() => nextBlock())
      .then(() => nextBlock())
      .then(() => transactions.makeRevoke('aaron.hello', renewalKey, payer))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('REVOKE broadcasted, waiting 30 seconds.')
        return nextBlock()
      })
      .then(() => fetch(`${myNet.blockstackAPIUrl}/v1/names/aaron.hello`))
      .then(resp => resp.json())
      .then((nameInfo) => {
        t.equal(nameInfo.status, 'revoked', 'Name should be revoked')
      })
      .then(() => nextBlock())
      .then(() => nextBlock())
      .then(() => transactions.makeBitcoinSpend(btcDestAddress, payer, 500000))
      .then(rawtx => myNet.broadcastTransaction(rawtx))
      .then(() => {
        console.log('broadcasted SPEND, waiting 10 seconds.')
        return nextBlock(6)
      })
      .then(() => nextBlock())
      .then(() => myNet.getUTXOs(btcDestAddress))
      .then((utxos) => {
        t.equal(utxos.length, 1, `Destination address ${btcDestAddress} should have 1 UTXO`)
        const satoshis = utxos.reduce((agg, utxo) => agg + utxo.value, 0)
        console.log(`${btcDestAddress} has ${satoshis} satoshis`)
      })
      .then(() => shutdownBlockstackCore())
      .then(() => t.pass('Finished test'))
      .catch((err) => {
        console.log(err.stack)
        console.log(err)
      })
  })
}
