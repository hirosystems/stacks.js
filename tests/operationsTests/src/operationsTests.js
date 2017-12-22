import { exec } from 'child_process'
import util from 'util'
import test from 'tape'
import btc from 'bitcoinjs-lib'

import { makePreorder, makeRegister, LOCAL_REGTEST } from '../../../lib/'

const pExec = util.promisify(exec)


let dest = btc.ECPair.fromWIF('cNRZucCsNZR3HGFtW4nMEqME38RH3xWXrRgn74hnaBdEqMxeMUKj', btc.networks.testnet)
let payer = btc.ECPair.fromWIF('cTs14pEWitbXXQF7qN4jRvJGwgeEU4FCcJNTwXYdSngBYkmCkBpi', btc.networks.testnet)


async function initializeBlockstackCore() {

  await pExec('docker pull quay.io/blockstack/integrationtests:feature_set-bitcoind-rpcbind')

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

  await pExec('docker logs -f test-bsk-core | grep -q inished')

}

function shutdownBlockstackCore() {
  return pExec('docker stop test-bsk-core')
}

export function runIntegrationTests() {
  test('registerName', (t) => {
    t.plan(3)

    t.ok(makePreorder)
    t.ok(makeRegister)

    const zfTest = 'foo the \n bar'

    const network = LOCAL_REGTEST

    initializeBlockstackCore()
      .then(() => {
        console.log('Blockstack Core initialized.')
        return makePreorder('aaron.id', dest.getAddress(), payer, network)
      })
      .then(resolved => resolved.toHex())
      .then(rawtx => network.broadcastTransaction(rawtx))
      .then(() => {
        console.log('PREORDER broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => {
        return makeRegister('aaron.id', dest.getAddress(), payer, zfTest, network)
      })
      .then(resolved => resolved.toHex())
      .then(rawtx => network.broadcastTransaction(rawtx))
      .then(() => {
        console.log('REGISTER broadcasted, waiting 30 seconds.')
        return new Promise((resolve) => setTimeout(resolve, 30000))
      })
      .then(() => network.publishZonefile(zfTest))
      .then((zfResp) => console.log(zfResp))
      .then(() => fetch(`${network.blockstackAPIUrl}/v1/names/aaron.id`))
      .then(resp => resp.json())
      .then(nameInfo => {
        t.equal(network.coerceAddress(nameInfo.address), dest.getAddress())
      })
      .then(() => shutdownBlockstackCore())
  })

}

