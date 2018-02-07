/* @flow */
import bitcoinjs from 'bitcoinjs-lib'
import FormData from 'form-data'

const SATOSHIS_PER_BTC = 1e8

type UTXO = { value?: number,
              confirmations?: number,
              tx_hash: string,
              tx_output_n: number }

class BlockstackNetwork {
  blockstackAPIUrl: string
  utxoProviderUrl: string
  layer1: Object
  DUST_MINIMUM: number
  includeUtxoMap: Object
  excludeUtxoSet: Array<UTXO>

  constructor(apiUrl: string, utxoProviderUrl: string,
              network: Object = bitcoinjs.networks.bitcoin) {
    this.blockstackAPIUrl = apiUrl
    this.utxoProviderUrl = utxoProviderUrl
    this.layer1 = network

    this.DUST_MINIMUM = 5500
    this.includeUtxoMap = {}
    this.excludeUtxoSet = []
  }

  coerceAddress(address: string) {
    const addressHash = bitcoinjs.address.fromBase58Check(address).hash
    return bitcoinjs.address.toBase58Check(addressHash, this.layer1.pubKeyHash)
  }

  getNamePrice(fullyQualifiedName: string) {
    return fetch(`${this.blockstackAPIUrl}/v1/prices/names/${fullyQualifiedName}`)
      .then(resp => resp.json())
      .then(x => x.name_price.satoshis)
      .then(satoshis => {
        if (satoshis) {
          if (satoshis < this.DUST_MINIMUM) {
            return this.DUST_MINIMUM
          } else {
            return satoshis
          }
        } else {
          throw new Error('Failed to parse price of name')
        }
      })
  }

  getBlockHeight() {
    return fetch(`${this.utxoProviderUrl}/latestblock`)
      .then(resp => resp.json())
      .then(blockObj => blockObj.height)
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

  /**
   * Broadcasts a signed bitcoin transaction to the network optionally waiting to broadcast the
   * transaction until a second transaction has a certain number of confirmations.
   *
   * @param  {string} transaction the hex-encoded transaction to broadcast
   * @param  {string} transactionToWatch the hex transaction id of the transaction to watch for
   * the specified number of confirmations before broadcasting the `transaction`
   * @param  {number} confirmations the number of confirmations `transactionToWatch` must have
   * before broadcasting `transaction`.
   * @return {Promise} returns a Promise that resolves if the request
   * is accepted by the transaction broadcast service and rejects
   * if the service responds with an error or is unreachable
   */
  broadcastTransaction(transaction: string,
    transactionToWatch: ?string = null,
    confirmations: number = 6) {

    if (transactionToWatch === null) {
      const form = new FormData()
      form.append('tx', transaction)
      return fetch(`${this.utxoProviderUrl}/pushtx?cors=true`,
                   { method: 'POST',
                     body: form })
        .then(resp => resp.text())
        .then(respText => {
          if (respText.toLowerCase().indexOf('transaction submitted') >= 0) {
            const txHash = bitcoinjs.Transaction.fromHex(transaction)
                  .getHash()
                  .reverse()
                  .toString('hex') // big_endian
            return txHash
          } else {
            throw new Error(`Broadcast transaction failed with message: ${respText}`)
          }
        })
    } else {
      /*
       * POST /v1/broadcast
       * Request body:
       * JSON.stringify({
       *  transaction,
       *  transactionToWatch,
       *  confirmations
       * })
       */
    }
  }

  /**
   * Broadcasts a zone file to the Atlas network via the transaction broadcast service.
   *
   * @param  {String} zoneFile the zone file to be broadcast to the Atlas network
   * @param  {String} transactionToWatch the hex transaction id of the transaction to watch for confirmation
   * before broadcasting the zone file to the Atlas network
   * @return {Promise} returns a Promise that resolves if the request
   * is accepted by the transaction broadcast service and rejects
   * if the service responds with an error or is unreachable
   */
  broadcastZoneFile(zoneFile: string,
    transactionToWatch: ?string = null) {
    /*
     * POST /v1/broadcastZoneFile
     * Request body:
     * JSON.stringify({
     *  zoneFile,
     *  transactionToWatch
     * })
     */
  }

  /**
   * Sends the preorder and registration transactions and zone file
   * for a Blockstack name registration
   * along with the to the transaction broadcast service.
   *
   * The transaction broadcast:
   *
   * * immediately broadcasts the preorder transaction
   * * broadcasts the register transactions after the preorder transaction
   * has an appropriate number of confirmations
   * * broadcasts the zone file to the Atlas network after the register transaction
   * has an appropriate number of confirmations
   *
   * @param  {String} preorderTransaction the hex-encoded, signed preorder transaction generated
   * using the `makePreorder` function
   * @param  {String} registerTransaction the hex-encoded, signed register transaction generated
   * using the `makeRegister` function
   * @param  {String} zoneFile the zone file to be broadcast to the Atlas network
   * @return {Promise} returns a Promise that resolves if the request
   * is accepted by the transaction broadcast service and rejects if the service
   * responds with an error or is unreachable
   */
  broadcastNameRegistration(preorderTransaction: string,
      registerTransaction: string,
      zoneFile: string) {

      /*
       * POST /v1/broadcastNameRegistration
       * Request body:
       * JSON.stringify({
       * preorderTransaction,
       * registerTransaction,
       * zoneFile
       * })
       */
  }


  getTransactionInfo(txHash: string) : Promise<{block_height: Number}> {
    return fetch(`${this.utxoProviderUrl}/rawtx/${txHash}`)
      .then(resp => {
        if (resp.status === 200) {
          return resp.json()
        } else {
          throw new Error(`Could not lookup transaction info for '${txHash}'. Server error.`)
        }
      })
      .then(respObj => ({ block_height: respObj.block_height }))
  }

  getFeeRate() : Promise<number> {
    return fetch('https://bitcoinfees.earn.com/api/v1/fees/recommended')
      .then(resp => resp.json())
      .then(rates => Math.floor(rates.fastestFee))
  }

  countDustOutputs() {
    throw new Error('Not implemented.')
  }

  getNetworkedUTXOs(address: string) : Promise<Array<UTXO>> {
    return fetch(`${this.utxoProviderUrl}/unspent?format=json&active=${address}`)
      .then(resp => {
        if (resp.status === 500) {
          console.log('DEBUG: UTXO provider 500 usually means no UTXOs: returning []')
          return {
            unspent_outputs: []
          }
        } else {
          return resp.json()
        }
      })
      .then(utxoJSON => utxoJSON.unspent_outputs)
      .then(utxoList => utxoList.map(
        utxo => {
          const utxoOut = { value: utxo.value,
                            tx_output_n: utxo.tx_output_n,
                            confirmations: utxo.confirmations,
                            tx_hash: utxo.tx_hash_big_endian }
          return utxoOut
        }))
  }

  getUTXOs(address: string) : Promise<Array<UTXO>> {
    return this.getNetworkedUTXOs(address)
      .then(networkedUTXOs => {
        let returnSet = networkedUTXOs.concat()
        if (this.includeUtxoMap.hasOwnProperty(address)) {
          returnSet = networkedUTXOs.concat(this.includeUtxoMap[address])
        }

        // aaron: I am *well* aware this is O(n)*O(m) runtime
        //    however, clients should clear the exclude set periodically
        const excludeSet = this.excludeUtxoSet
        returnSet = returnSet.filter(
          utxo => {
            const inExcludeSet = excludeSet.reduce(
              (inSet, utxoToCheck) =>
                inSet || (utxoToCheck.tx_hash === utxo.tx_hash &&
                          utxoToCheck.tx_output_n === utxo.tx_output_n), false)
            return !inExcludeSet
          })

        return returnSet
      })
  }

  /**
   * This will modify the network's utxo set to include UTXOs
   *  from the given transaction and exclude UTXOs *spent* in
   *  that transaction
   * @param {String} txHex - the hex-encoded transaction to use
   * @return {void} no return value, this modifies the UTXO config state
   * @private
   */
  modifyUTXOSetFrom(txHex: string) {
    const tx = bitcoinjs.Transaction.fromHex(txHex)

    const excludeSet: Array<UTXO> = this.excludeUtxoSet.concat()

    tx.ins.forEach((utxoUsed) => {
      const reverseHash = Buffer.from(utxoUsed.hash)
      reverseHash.reverse()
      excludeSet.push({ tx_hash: reverseHash.toString('hex'),
                        tx_output_n: utxoUsed.index })
    })

    this.excludeUtxoSet = excludeSet

    const txHash = tx.getHash().reverse().toString('hex')
    tx.outs.forEach((utxoCreated, txOutputN) => {
      if (bitcoinjs.script.classifyOutput(utxoCreated.script) === 'nulldata') {
        return
      }
      const address = bitcoinjs.address.fromOutputScript(
        utxoCreated.script, this.layer1)

      let includeSet = []
      if (this.includeUtxoMap.hasOwnProperty(address)) {
        includeSet = includeSet.concat(this.includeUtxoMap[address])
      }

      includeSet.push({ tx_hash: txHash,
                        confirmations: 0,
                        value: utxoCreated.value,
                        tx_output_n: txOutputN })
      this.includeUtxoMap[address] = includeSet
    })
  }

  resetUTXOs(address: string) {
    delete this.includeUtxoMap[address]
    this.excludeUtxoSet = []
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
  bitcoindUrl: string

  constructor(apiUrl: string, bitcoindUrl: string) {
    super(apiUrl, '', bitcoinjs.networks.testnet)
    this.bitcoindUrl = bitcoindUrl
  }

  getFeeRate() : Promise<number> {
    return Promise.resolve(Math.floor(0.00001000 * SATOSHIS_PER_BTC))
  }

  broadcastTransaction(transaction: string) {
    const jsonRPC = { jsonrpc: '1.0',
                      method: 'sendrawtransaction',
                      params: [transaction] }
    return fetch(this.bitcoindUrl, { method: 'POST', body: JSON.stringify(jsonRPC) })
      .then(resp => resp.json())
      .then(respObj => respObj.result)
  }

  getBlockHeight() {
    const jsonRPC = { jsonrpc: '1.0',
                      method: 'getblockcount' }
    return fetch(this.bitcoindUrl, { method: 'POST', body: JSON.stringify(jsonRPC) })
      .then(resp => resp.json())
      .then(respObj => respObj.result)
  }

  getTransactionInfo(txHash: string) : Promise<{block_height: Number}> {
    const jsonRPC = { jsonrpc: '1.0',
                      method: 'gettransaction',
                      params: [txHash] }
    return fetch(this.bitcoindUrl, { method: 'POST', body: JSON.stringify(jsonRPC) })
      .then(resp => resp.json())
      .then(respObj => respObj.result)
      .then(txInfo => txInfo.blockhash)
      .then(blockhash => {
        const jsonRPCBlock = { jsonrpc: '1.0',
                               method: 'getblockheader',
                               params: [blockhash] }
        return fetch(this.bitcoindUrl, { method: 'POST',
                                         body: JSON.stringify(jsonRPCBlock) })
      })
      .then(resp => resp.json())
      .then(respObj => ({ block_height: respObj.result.height }))
  }

  getNetworkedUTXOs(address: string) : Promise<Array<UTXO>> {
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
  'https://core.blockstack.org', 'https://blockchain.info')

export const network = { BlockstackNetwork, LocalRegtest,
                         defaults: { LOCAL_REGTEST, MAINNET_DEFAULT } }
