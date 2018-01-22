import bitcoinjs from 'bitcoinjs-lib'

const SATOSHIS_PER_BTC = 1e8

class BlockstackNetwork {
  constructor(apiUrl: string, utxoProviderUrl: string,
              network: ?Object = bitcoinjs.networks.bitcoin) {
    this.blockstackAPIUrl = apiUrl
    this.utxoProviderUrl = utxoProviderUrl
    this.layer1 = network
  }

  coerceAddress(address: string) {
    const addressHash = bitcoinjs.address.fromBase58Check(address).hash
    return bitcoinjs.address.toBase58Check(addressHash, this.layer1.pubKeyHash)
  }

  getNamePrice(fullyQualifiedName: string) {
    return fetch(`${this.blockstackAPIUrl}/v1/prices/names/${fullyQualifiedName}`)
      .then(resp => resp.json())
      .then(x => x.name_price.satoshis)
  }

  getBlockHeight() {
    throw new Error('Not implemented')
  }

  getGracePeriod() {
    return new Promise((resolve) => resolve(5000))
  }

  getNamesOwned(address: string) {
    const networkAddress = this.coerceAddress(address)
    return fetch(`${this.blockstackAPIUrl}/v1/addresses/bitcoin/${networkAddress}`)
      .then(resp => resp.json())
  }

  getNamespaceBurnAddress(namespace: string) {
    return fetch(`${this.blockstackAPIUrl}/v1/namespaces/${namespace}`)
      .then(resp => {
        if (resp.status === 404) {
          throw new Error(`No such namespace '${namespace}'`)
        } else {
          return resp.json()
        }
      })
      .then(namespaceInfo => {
        let address = '1111111111111111111114oLvT2' // default burn address
        const blockHeights = Object.keys(namespaceInfo.history)
        blockHeights.sort((x, y) => (parseInt(x, 10) - parseInt(y, 10)))
        blockHeights.forEach(blockHeight => {
          const infoAtBlock = namespaceInfo.history[blockHeight][0]
          if (infoAtBlock.hasOwnProperty('burn_address')) {
            address = infoAtBlock.burn_address
          }
        })
        return address
      })
      .then(address => this.coerceAddress(address))
  }

  getNameInfo(fullyQualifiedName: string) {
    return fetch(`${this.blockstackAPIUrl}/v1/names/${fullyQualifiedName}`)
      .then(resp => {
        if (resp.status === 404) {
          throw new Error('Name not found')
        } else if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`)
        } else {
          return resp.json()
        }
      })
  }

  broadcastTransaction(transaction: string) {
    throw new Error(`Cannot broadcast ${transaction}: not implemented.`)
  }

  getFeeRate() {
    throw new Error('Not implemented.')
  }

  countDustOutputs() {
    throw new Error('Not implemented.')
  }

  getUTXOs(address: string) {
    return fetch(`${this.utxoProviderUrl}${address}`)
      .then(resp => resp.json())
  }

  publishZonefile(zonefile: string) {
    const arg = { zonefile }
    return fetch(`${this.blockstackAPIUrl}/v1/zonefile/`,
                 { method: 'POST',
                   body: JSON.stringify(arg),
                   headers: {
                     'Content-Type': 'application/json'
                   }
                 })
      .then(resp => resp.json())
      .then(respObj => {
        if (respObj.hasOwnProperty('error')) {
          throw new Error(respObj.error)
        }
        return respObj.servers
      })
  }

  getConsensusHash() {
    return fetch(`${this.blockstackAPIUrl}/v1/blockchains/bitcoin/consensus`)
      .then(resp => resp.json())
      .then(x => x.consensus_hash)
  }
}

class LocalRegtest extends BlockstackNetwork {
  constructor(apiUrl: string, bitcoindUrl: string) {
    super(apiUrl, '', bitcoinjs.networks.testnet)
    this.bitcoindUrl = bitcoindUrl
  }

  getFeeRate() {
    return 0.00001000 * SATOSHIS_PER_BTC
  }

  broadcastTransaction(transaction: string) {
    const jsonRPC = { jsonrpc: '1.0',
                      method: 'sendrawtransaction',
                      params: [transaction] }
    return fetch(this.bitcoindUrl, { method: 'POST', body: JSON.stringify(jsonRPC) })
  }

  getUTXOs(address: string) {
    const jsonRPCImport = { jsonrpc: '1.0',
                            method: 'importaddress',
                            params: [address] }
    const jsonRPCUnspent = { jsonrpc: '1.0',
                             method: 'listunspent',
                             params: [1, 9999999, [address]] }

    return fetch(this.bitcoindUrl, { method: 'POST', body: JSON.stringify(jsonRPCImport) })
      .then(() => fetch(this.bitcoindUrl, { method: 'POST', body: JSON.stringify(jsonRPCUnspent) }))
      .then(resp => resp.json())
      .then(x => x.result)
      .then(utxos => utxos.map(
        x => Object({ value: x.amount * SATOSHIS_PER_BTC,
                      confirmations: x.confirmations,
                      tx_hash: x.txid,
                      tx_output_n: x.vout })))
  }


}

const LOCAL_REGTEST = new LocalRegtest(
  'http://localhost:16268', 'http://blockstack:blockstacksystem@127.0.0.1:18332/')

const MAINNET_DEFAULT = new BlockstackNetwork(
  'https://core.blockstack.org', 'https://blockchain.info/unspent?format=json&active=')


export const network = { BlockstackNetwork, LocalRegtest,
                         defaults: { LOCAL_REGTEST, MAINNET_DEFAULT } }
