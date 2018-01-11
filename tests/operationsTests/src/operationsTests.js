import { exec } from 'child_process'
import util from 'util'
import test from 'tape'
import btc from 'bitcoinjs-lib'

import { transactions, LOCAL_REGTEST } from '../../../lib/'

const pExec = util.promisify(exec)

async function initializeBlockstackCore() {

  await pExec('docker pull quay.io/blockstack/integrationtests:feature_set-bitcoind-rpcbind')

  console.log('Pulled latest docker image')

  try {
    await pExec('docker stop test-bsk-core ; docker rm test-bsk-core ; rm -rf /tmp/.blockstack_int_test')
  } catch (err) {
  }

  await pExec('docker run --name test-bsk-core -dt -p 16268:16268 -p 18332:18332 ' +
              '-e BLOCKSTACK_TEST_CLIENT_RPC_PORT=16268 ' +
              '-e BLOCKSTACK_TEST_CLIENT_BIND=0.0.0.0 ' +
              '-e BLOCKSTACK_TEST_BITCOIND_ALLOWIP=172.17.0.0/16 ' +
              'quay.io/blockstack/integrationtests:feature_set-bitcoind-rpcbind ' +
              'blockstack-test-scenario --interactive 2 ' +
              'blockstack_integration_tests.scenarios.portal_test_env')

  console.log('Started regtest container, waiting until initialized')

  await pExec('docker logs -f test-bsk-core | grep -q inished')

}

function shutdownBlockstackCore() {
  return pExec('docker stop test-bsk-core')
}

export function runIntegrationTests() {
  test('registerName', (t) => {
    t.plan(6)

    const dest = btc.ECPair.fromWIF('cNRZucCsNZR3HGFtW4nMEqME38RH3xWXrRgn74hnaBdEqMxeMUKj',
                                    btc.networks.testnet)
    const payer = btc.ECPair.fromWIF('cTs14pEWitbXXQF7qN4jRvJGwgeEU4FCcJNTwXYdSngBYkmCkBpi',
                                     btc.networks.testnet)

    const secondOwner = btc.ECPair.fromWIF('cQQ9zPkp2FegjLL7EZxawPBU3XaNaHxnaYeNvBX3vLXAHwWEbsnk',
                                           btc.networks.testnet)
    const transferDestination = secondOwner.getAddress()
    const renewalDestination = 'myPgwEX2ddQxPPqWBRkXNqL3TwuWbY29DJ'

    const zfTest = '$ORIGIN aaron.id\n$TTL 3600\n_http._tcp URI 10 1 ' +
          `"https://gaia.blockstacktest.org/hub/${dest.getAddress()}/0/profile.json"`
    const zfTest2 = '$ORIGIN aaron.id\n$TTL 3600\n_http._tcp URI 10 1 ' +
          `"https://gaia.blockstacktest.org/hub/${dest.getAddress()}/3/profile.json"`
    const renewalZF = '$ORIGIN aaron.id\n$TTL 3600\n_http._tcp URI 10 1 ' +
          `"https://gaia.blockstacktest.org/hub/${dest.getAddress()}/4/profile.json"`

    const network = LOCAL_REGTEST

    initializeBlockstackCore()
      .then(() => {
        console.log('Blockstack Core initialized.')
        return transactions.makePreorder('aaron.id', dest.getAddress(), payer, network)
      })
      .then(resolved => resolved.toHex())
      .then(rawtx => network.broadcastTransaction(rawtx))
      .then(() => {
        console.log('PREORDER broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => transactions.makeRegister('aaron.id', dest.getAddress(), payer, zfTest, network))
      .then(resolved => resolved.toHex())
      .then(rawtx => network.broadcastTransaction(rawtx))
      .then(() => {
        console.log('REGISTER broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => network.publishZonefile(zfTest))
      .then(() => fetch(`${network.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(network.coerceAddress(nameInfo.address), dest.getAddress(),
                `aaron.id should be owned by ${dest.getAddress()}`)
        t.equal(nameInfo.zonefile, zfTest, 'zonefile should be properly set')
      })
      .then(() => transactions.makeUpdate('aaron.id', dest, payer,
                             zfTest2, network))
      .then(resolved => resolved.toHex())
      .then(rawtx => network.broadcastTransaction(rawtx))
      .then(() => {
        console.log('UPDATE broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => network.publishZonefile(zfTest2))
      .then(() => fetch(`${network.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(nameInfo.zonefile, zfTest2, 'zonefile should be updated')
      })
      .then(() => transactions.makeTransfer('aaron.id', transferDestination,
                               dest, payer, network))
      .then(resolved => resolved.toHex())
      .then(rawtx => network.broadcastTransaction(rawtx))
      .then(() => {
        console.log('TRANSFER broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => fetch(`${network.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(network.coerceAddress(nameInfo.address), transferDestination,
                `aaron.id should be owned by ${transferDestination}`)
      })
      .then(() => transactions.makeRenewal('aaron.id', renewalDestination, secondOwner,
                              payer, network, renewalZF))
      .then(resolved => resolved.toHex())
      .then(rawtx => network.broadcastTransaction(rawtx))
      .then(() => {
        console.log('RENEWAL broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => network.publishZonefile(renewalZF))
      .then(() => fetch(`${network.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(nameInfo.zonefile, renewalZF, 'zonefile should be updated')
        t.equal(network.coerceAddress(nameInfo.address), renewalDestination,
                `aaron.id should be owned by ${renewalDestination}`)

      })
      .then(() => shutdownBlockstackCore())
  })

}

