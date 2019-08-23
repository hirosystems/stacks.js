import { TxOutput, address as bjsAddress, networks, crypto as bjsCrypto, Transaction, payments, Network } from 'bitcoinjs-lib'
import * as FormData from 'form-data'
// @ts-ignore
import * as BN from 'bn.js'
import * as RIPEMD160 from 'ripemd160'
import { MissingParameterError, RemoteServiceError } from './errors'
import { Logger } from './logger'
import { config } from './config'
import { fetchPrivate } from './fetchUtil'

/**
 * @ignore
 */
export type UTXO = {
  value?: number,
  confirmations?: number,
  tx_hash: string,
  tx_output_n: number
}

const SATOSHIS_PER_BTC = 1e8
const TX_BROADCAST_SERVICE_ZONE_FILE_ENDPOINT = 'zone-file'
const TX_BROADCAST_SERVICE_REGISTRATION_ENDPOINT = 'registration'
const TX_BROADCAST_SERVICE_TX_ENDPOINT = 'transaction'

/**
 * @private
 * @ignore
 */
export class BitcoinNetwork {
  broadcastTransaction(transaction: string): Promise<any> {
    return Promise.reject(new Error(`Not implemented, broadcastTransaction(${transaction})`))
  }

  getBlockHeight(): Promise<number> {
    return Promise.reject(new Error('Not implemented, getBlockHeight()'))
  }

  getTransactionInfo(txid: string): Promise<{block_height: number}> {
    return Promise.reject(new Error(`Not implemented, getTransactionInfo(${txid})`))
  }

  getNetworkedUTXOs(address: string): Promise<Array<UTXO>> {
    return Promise.reject(new Error(`Not implemented, getNetworkedUTXOs(${address})`))
  }
}

/**
 * @private
 * @ignore
 */
export class BlockstackNetwork {
  blockstackAPIUrl: string

  broadcastServiceUrl: string

  layer1: Network

  DUST_MINIMUM: number

  includeUtxoMap: {[address: string]: UTXO[]}

  excludeUtxoSet: Array<UTXO>

  btc: BitcoinNetwork

  MAGIC_BYTES: string

  constructor(apiUrl: string, broadcastServiceUrl: string,
              bitcoinAPI: BitcoinNetwork,
              network = networks.bitcoin) {
    this.blockstackAPIUrl = apiUrl
    this.broadcastServiceUrl = broadcastServiceUrl
    this.layer1 = network
    this.btc = bitcoinAPI

    this.DUST_MINIMUM = 5500
    this.includeUtxoMap = {}
    this.excludeUtxoSet = []
    this.MAGIC_BYTES = 'id'
  }

  coerceAddress(address: string) {
    const { hash, version } = bjsAddress.fromBase58Check(address)
    const scriptHashes = [networks.bitcoin.scriptHash,
                          networks.testnet.scriptHash]
    const pubKeyHashes = [networks.bitcoin.pubKeyHash,
                          networks.testnet.pubKeyHash]
    let coercedVersion
    if (scriptHashes.indexOf(version) >= 0) {
      coercedVersion = this.layer1.scriptHash
    } else if (pubKeyHashes.indexOf(version) >= 0) {
      coercedVersion = this.layer1.pubKeyHash
    } else {
      throw new Error(`Unrecognized address version number ${version} in ${address}`)
    }
    return bjsAddress.toBase58Check(hash, coercedVersion)
  }

  /**
  * @ignore
  */
  getDefaultBurnAddress() {
    return this.coerceAddress('1111111111111111111114oLvT2')
  }

  /**
   * Get the price of a name via the legacy /v1/prices API endpoint.
   * @param {String} fullyQualifiedName the name to query
   * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }
   * @private
   */
  getNamePriceV1(fullyQualifiedName: string): Promise<{units: string, amount: BN}> {
    // legacy code path
    return fetchPrivate(`${this.blockstackAPIUrl}/v1/prices/names/${fullyQualifiedName}`)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`Failed to query name price for ${fullyQualifiedName}`)
        }
        return resp
      })
      .then(resp => resp.json())
      .then(resp => resp.name_price)
      .then((namePrice) => {
        if (!namePrice || !namePrice.satoshis) {
          throw new Error(
            `Failed to get price for ${fullyQualifiedName}. Does the namespace exist?`
          )
        }
        if (namePrice.satoshis < this.DUST_MINIMUM) {
          namePrice.satoshis = this.DUST_MINIMUM
        }
        const result = {
          units: 'BTC',
          amount: new BN(String(namePrice.satoshis))
        }
        return result
      })
  }

  /**
   * Get the price of a namespace via the legacy /v1/prices API endpoint.
   * @param {String} namespaceID the namespace to query
   * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }
   * @private
   */
  getNamespacePriceV1(namespaceID: string): Promise<{units: string, amount: BN}> {
    // legacy code path
    return fetchPrivate(`${this.blockstackAPIUrl}/v1/prices/namespaces/${namespaceID}`)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`Failed to query name price for ${namespaceID}`)
        }
        return resp
      })
      .then(resp => resp.json())
      .then((namespacePrice) => {
        if (!namespacePrice || !namespacePrice.satoshis) {
          throw new Error(`Failed to get price for ${namespaceID}`)
        }
        if (namespacePrice.satoshis < this.DUST_MINIMUM) {
          namespacePrice.satoshis = this.DUST_MINIMUM
        }
        const result = {
          units: 'BTC',
          amount: new BN(String(namespacePrice.satoshis))
        }
        return result
      })
  }
  
  /**
   * Get the price of a name via the /v2/prices API endpoint.
   * @param {String} fullyQualifiedName the name to query
   * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }
   * @private
   */
  getNamePriceV2(fullyQualifiedName: string): Promise<{units: string, amount: BN}> {
    return fetchPrivate(`${this.blockstackAPIUrl}/v2/prices/names/${fullyQualifiedName}`)
      .then((resp) => {
        if (resp.status !== 200) {
          // old core node 
          throw new Error('The upstream node does not handle the /v2/ price namespace')
        }
        return resp
      })
      .then(resp => resp.json())
      .then(resp => resp.name_price)
      .then((namePrice) => {
        if (!namePrice) {
          throw new Error(
            `Failed to get price for ${fullyQualifiedName}. Does the namespace exist?`
          )
        }
        const result = {
          units: namePrice.units,
          amount: new BN(namePrice.amount)
        }
        if (namePrice.units === 'BTC') {
          // must be at least dust-minimum
          const dustMin = new BN(String(this.DUST_MINIMUM))
          if (result.amount.ucmp(dustMin) < 0) {
            result.amount = dustMin
          }
        }
        return result
      })
  }

  /**
   * Get the price of a namespace via the /v2/prices API endpoint.
   * @param {String} namespaceID the namespace to query
   * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }
   * @private
   */
  getNamespacePriceV2(namespaceID: string): Promise<{units: string, amount: BN}> {
    return fetchPrivate(`${this.blockstackAPIUrl}/v2/prices/namespaces/${namespaceID}`)
      .then((resp) => {
        if (resp.status !== 200) {
          // old core node 
          throw new Error('The upstream node does not handle the /v2/ price namespace')
        }
        return resp
      })
      .then(resp => resp.json())
      .then((namespacePrice) => {
        if (!namespacePrice) {
          throw new Error(`Failed to get price for ${namespaceID}`)
        }
        const result = {
          units: namespacePrice.units,
          amount: new BN(namespacePrice.amount)
        }
        if (namespacePrice.units === 'BTC') {
          // must be at least dust-minimum
          const dustMin = new BN(String(this.DUST_MINIMUM))
          if (result.amount.ucmp(dustMin) < 0) {
            result.amount = dustMin
          }
        }
        return result
      })
  }

  /**
   * Get the price of a name.
   * @param {String} fullyQualifiedName the name to query
   * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }, where
   *   .units encodes the cryptocurrency units to pay (e.g. BTC, STACKS), and
   *   .amount encodes the number of units, in the smallest denominiated amount
   *   (e.g. if .units is BTC, .amount will be satoshis; if .units is STACKS, 
   *   .amount will be microStacks)
   */
  getNamePrice(fullyQualifiedName: string): Promise<{units: string, amount: BN}> {
    // handle v1 or v2 
    return Promise.resolve().then(() => this.getNamePriceV2(fullyQualifiedName))
      .catch(() => this.getNamePriceV1(fullyQualifiedName))
  }

  /**
   * Get the price of a namespace
   * @param {String} namespaceID the namespace to query
   * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }, where
   *   .units encodes the cryptocurrency units to pay (e.g. BTC, STACKS), and
   *   .amount encodes the number of units, in the smallest denominiated amount
   *   (e.g. if .units is BTC, .amount will be satoshis; if .units is STACKS, 
   *   .amount will be microStacks)
   */
  getNamespacePrice(namespaceID: string): Promise<{units: string, amount: BN}> {
    // handle v1 or v2 
    return Promise.resolve().then(() => this.getNamespacePriceV2(namespaceID))
      .catch(() => this.getNamespacePriceV1(namespaceID))
  }

  /**
   * How many blocks can pass between a name expiring and the name being able to be
   * re-registered by a different owner?
   * @param {string} fullyQualifiedName unused
   * @return {Promise} a promise to the number of blocks
   */
  getGracePeriod(fullyQualifiedName?: string) {
    return Promise.resolve(5000)
  }

  /**
   * Get the names -- both on-chain and off-chain -- owned by an address.
   * @param {String} address the blockchain address (the hash of the owner public key)
   * @return {Promise} a promise that resolves to a list of names (Strings)
   */
  getNamesOwned(address: string): Promise<string[]> {
    const networkAddress = this.coerceAddress(address)
    return fetchPrivate(`${this.blockstackAPIUrl}/v1/addresses/bitcoin/${networkAddress}`)
      .then(resp => resp.json())
      .then(obj => obj.names)
  }

  /**
   * Get the blockchain address to which a name's registration fee must be sent
   * (the address will depend on the namespace in which it is registered.)
   * @param {String} namespace the namespace ID
   * @return {Promise} a promise that resolves to an address (String)
   */
  getNamespaceBurnAddress(namespace: string) {
    return Promise.all([
      fetchPrivate(`${this.blockstackAPIUrl}/v1/namespaces/${namespace}`),
      this.getBlockHeight()
    ])
      .then(([resp, blockHeight]) => {
        if (resp.status === 404) {
          throw new Error(`No such namespace '${namespace}'`)
        } else {
          return Promise.all([resp.json(), blockHeight])
        }
      })
      .then(([namespaceInfo, blockHeight]) => {
        let address = this.getDefaultBurnAddress()
        if (namespaceInfo.version === 2) {
          // pay-to-namespace-creator if this namespace is less than 1 year old
          if (namespaceInfo.reveal_block + 52595 >= blockHeight) {
            address = namespaceInfo.address
          }
        }
        return address
      })
      .then(address => this.coerceAddress(address))
  }

  /**
   * Get WHOIS-like information for a name, including the address that owns it,
   * the block at which it expires, and the zone file anchored to it (if available).
   * @param {String} fullyQualifiedName the name to query.  Can be on-chain of off-chain.
   * @return {Promise} a promise that resolves to the WHOIS-like information 
   */
  getNameInfo(fullyQualifiedName: string) {
    Logger.debug(this.blockstackAPIUrl)
    const nameLookupURL = `${this.blockstackAPIUrl}/v1/names/${fullyQualifiedName}`
    return fetchPrivate(nameLookupURL)
      .then((resp) => {
        if (resp.status === 404) {
          throw new Error('Name not found')
        } else if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`)
        } else {
          return resp.json()
        }
      })
      .then((nameInfo) => {
        Logger.debug(`nameInfo: ${JSON.stringify(nameInfo)}`)
        // the returned address _should_ be in the correct network ---
        //  blockstackd gets into trouble because it tries to coerce back to mainnet
        //  and the regtest transaction generation libraries want to use testnet addresses
        if (nameInfo.address) {
          return Object.assign({}, nameInfo, { address: this.coerceAddress(nameInfo.address) })
        } else {
          return nameInfo
        }
      })
  }

  /**
   * Get the pricing parameters and creation history of a namespace.
   * @param {String} namespaceID the namespace to query
   * @return {Promise} a promise that resolves to the namespace information.
   */
  getNamespaceInfo(namespaceID: string) {
    return fetchPrivate(`${this.blockstackAPIUrl}/v1/namespaces/${namespaceID}`)
      .then((resp) => {
        if (resp.status === 404) {
          throw new Error('Namespace not found')
        } else if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`)
        } else {
          return resp.json()
        }
      })
      .then((namespaceInfo) => {
        // the returned address _should_ be in the correct network ---
        //  blockstackd gets into trouble because it tries to coerce back to mainnet
        //  and the regtest transaction generation libraries want to use testnet addresses
        if (namespaceInfo.address && namespaceInfo.recipient_address) {
          return Object.assign({}, namespaceInfo, {
            address: this.coerceAddress(namespaceInfo.address),
            recipient_address: this.coerceAddress(namespaceInfo.recipient_address)
          })
        } else {
          return namespaceInfo
        }
      })
  }

  /**
   * Get a zone file, given its hash.  Throws an exception if the zone file
   * obtained does not match the hash.
   * @param {String} zonefileHash the ripemd160(sha256) hash of the zone file
   * @return {Promise} a promise that resolves to the zone file's text
   */
  getZonefile(zonefileHash: string) {
    return fetchPrivate(`${this.blockstackAPIUrl}/v1/zonefiles/${zonefileHash}`)
      .then((resp) => {
        if (resp.status === 200) {
          return resp.text()
            .then((body) => {
              const sha256 = bjsCrypto.sha256(Buffer.from(body))
              const h = (new RIPEMD160()).update(sha256).digest('hex')
              if (h !== zonefileHash) {
                throw new Error(`Zone file contents hash to ${h}, not ${zonefileHash}`)
              }
              return body
            })
        } else {
          throw new Error(`Bad response status: ${resp.status}`)
        }
      })
  }

  /**
   * Get the status of an account for a particular token holding.  This includes its total number of
   * expenditures and credits, lockup times, last txid, and so on.
   * @param {String} address the account
   * @param {String} tokenType the token type to query
   * @return {Promise} a promise that resolves to an object representing the state of the account
   *   for this token
   */
  getAccountStatus(address: string, tokenType: string) {
    return fetchPrivate(`${this.blockstackAPIUrl}/v1/accounts/${address}/${tokenType}/status`)
      .then((resp) => {
        if (resp.status === 404) {
          throw new Error('Account not found')
        } else if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`)
        } else {
          return resp.json()
        }
      }).then((accountStatus) => {
        // coerce all addresses, and convert credit/debit to biginteger
        const formattedStatus = Object.assign({}, accountStatus, {
          address: this.coerceAddress(accountStatus.address),
          debit_value: new BN(String(accountStatus.debit_value)),
          credit_value: new BN(String(accountStatus.credit_value))
        })
        return formattedStatus
      })
  }
  
  
  /**
   * Get a page of an account's transaction history.
   * @param {String} address the account's address
   * @param {number} page the page number.  Page 0 is the most recent transactions
   * @return {Promise} a promise that resolves to an Array of Objects, where each Object encodes
   *   states of the account at various block heights (e.g. prior balances, txids, etc)
   */
  getAccountHistoryPage(address: string,
                        page: number): Promise<any[]> {
    const url = `${this.blockstackAPIUrl}/v1/accounts/${address}/history?page=${page}`
    return fetchPrivate(url)
      .then((resp) => {
        if (resp.status === 404) {
          throw new Error('Account not found')
        } else if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`)
        } else {
          return resp.json()
        }
      })
      .then((historyList) => {
        if (historyList.error) {
          throw new Error(`Unable to get account history page: ${historyList.error}`)
        }
        // coerse all addresses and convert to bigint
        return historyList.map((histEntry: any) => {
          histEntry.address = this.coerceAddress(histEntry.address)
          histEntry.debit_value = new BN(String(histEntry.debit_value))
          histEntry.credit_value = new BN(String(histEntry.credit_value))
          return histEntry
        })
      })
  }

  /**
   * Get the state(s) of an account at a particular block height.  This includes the state of the
   * account beginning with this block's transactions, as well as all of the states the account
   * passed through when this block was processed (if any).
   * @param {String} address the account's address
   * @param {Integer} blockHeight the block to query
   * @return {Promise} a promise that resolves to an Array of Objects, where each Object encodes
   *   states of the account at this block.
   */
  getAccountAt(address: string, blockHeight: number): Promise<any[]> {
    const url = `${this.blockstackAPIUrl}/v1/accounts/${address}/history/${blockHeight}`
    return fetchPrivate(url)
      .then((resp) => {
        if (resp.status === 404) {
          throw new Error('Account not found')
        } else if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`)
        } else {
          return resp.json()
        }
      })
      .then((historyList) => {
        if (historyList.error) {
          throw new Error(`Unable to get historic account state: ${historyList.error}`)
        }
        // coerce all addresses 
        return historyList.map((histEntry: any) => {
          histEntry.address = this.coerceAddress(histEntry.address)
          histEntry.debit_value = new BN(String(histEntry.debit_value))
          histEntry.credit_value = new BN(String(histEntry.credit_value))
          return histEntry
        })
      })
  }

  /**
   * Get the set of token types that this account owns
   * @param {String} address the account's address
   * @return {Promise} a promise that resolves to an Array of Strings, where each item encodes the 
   *   type of token this account holds (excluding the underlying blockchain's tokens)
   */
  getAccountTokens(address: string): Promise<{tokens: string[]}> {
    return fetchPrivate(`${this.blockstackAPIUrl}/v1/accounts/${address}/tokens`)
      .then((resp) => {
        if (resp.status === 404) {
          throw new Error('Account not found')
        } else if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`)
        } else {
          return resp.json()
        }
      })
      .then((tokenList) => {
        if (tokenList.error) {
          throw new Error(`Unable to get token list: ${tokenList.error}`)
        }
        return tokenList
      })
  }

  /**
   * Get the number of tokens owned by an account.  If the account does not exist or has no
   * tokens of this type, then 0 will be returned.
   * @param {String} address the account's address
   * @param {String} tokenType the type of token to query.
   * @return {Promise} a promise that resolves to a BigInteger that encodes the number of tokens 
   *   held by this account.
   */
  getAccountBalance(address: string, tokenType: string): Promise<BN> {
    return fetchPrivate(`${this.blockstackAPIUrl}/v1/accounts/${address}/${tokenType}/balance`)
      .then((resp) => {
        if (resp.status === 404) {
          // talking to an older blockstack core node without the accounts API
          return Promise.resolve().then(() => new BN('0'))
        } else if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`)
        } else {
          return resp.json()
        }
      })
      .then((tokenBalance) => {
        if (tokenBalance.error) {
          throw new Error(`Unable to get account balance: ${tokenBalance.error}`)
        }
        let balance = '0'
        if (tokenBalance && tokenBalance.balance) {
          balance = tokenBalance.balance
        }
        return new BN(balance)
      })
  }


  /**
   * Performs a POST request to the given URL
   * @param  {String} endpoint  the name of
   * @param  {String} body [description]
   * @return {Promise<Object|Error>} Returns a `Promise` that resolves to the object requested.
   * In the event of an error, it rejects with:
   * * a `RemoteServiceError` if there is a problem
   * with the transaction broadcast service
   * * `MissingParameterError` if you call the function without a required
   * parameter
   *
   * @private
   */
  broadcastServiceFetchHelper(endpoint: string, body: any): Promise<any|Error> {
    const requestHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }

    const options = {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body)
    }

    const url = `${this.broadcastServiceUrl}/v1/broadcast/${endpoint}`
    return fetchPrivate(url, options)
      .then((response) => {
        if (response.ok) {
          return response.json()
        } else {
          throw new RemoteServiceError(response)
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
  * @return {Promise<Object|Error>} Returns a Promise that resolves to an object with a
  * `transaction_hash` key containing the transaction hash of the broadcasted transaction.
  *
  * In the event of an error, it rejects with:
  * * a `RemoteServiceError` if there is a problem
  *   with the transaction broadcast service
  * * `MissingParameterError` if you call the function without a required
  *   parameter
  * @private
  */
  broadcastTransaction(
    transaction: string,
    transactionToWatch: string = null,
    confirmations: number = 6
  ) {
    if (!transaction) {
      const error = new MissingParameterError('transaction')
      return Promise.reject(error)
    }

    if (!confirmations && confirmations !== 0) {
      const error = new MissingParameterError('confirmations')
      return Promise.reject(error)
    }

    if (transactionToWatch === null) {
      return this.btc.broadcastTransaction(transaction)
    } else {
      /*
       * POST /v1/broadcast/transaction
       * Request body:
       * JSON.stringify({
       *  transaction,
       *  transactionToWatch,
       *  confirmations
       * })
       */
      const endpoint = TX_BROADCAST_SERVICE_TX_ENDPOINT

      const requestBody = {
        transaction,
        transactionToWatch,
        confirmations
      }

      return this.broadcastServiceFetchHelper(endpoint, requestBody)
    }
  }

  /**
   * Broadcasts a zone file to the Atlas network via the transaction broadcast service.
   *
   * @param  {String} zoneFile the zone file to be broadcast to the Atlas network
   * @param  {String} transactionToWatch the hex transaction id of the transaction
   * to watch for confirmation before broadcasting the zone file to the Atlas network
   * @return {Promise<Object|Error>} Returns a Promise that resolves to an object with a
   * `transaction_hash` key containing the transaction hash of the broadcasted transaction.
   *
   * In the event of an error, it rejects with:
   * * a `RemoteServiceError` if there is a problem
   *   with the transaction broadcast service
   * * `MissingParameterError` if you call the function without a required
   *   parameter
   * @private
   */
  broadcastZoneFile(
    zoneFile?: string,
    transactionToWatch: string = null
  ) {
    if (!zoneFile) {
      return Promise.reject(new MissingParameterError('zoneFile'))
    }

    // TODO: validate zonefile

    if (transactionToWatch) {
      // broadcast via transaction broadcast service

      /*
       * POST /v1/broadcast/zone-file
       * Request body:
       * JSON.stringify({
       *  zoneFile,
       *  transactionToWatch
       * })
       */

      const requestBody = {
        zoneFile,
        transactionToWatch
      }

      const endpoint = TX_BROADCAST_SERVICE_ZONE_FILE_ENDPOINT

      return this.broadcastServiceFetchHelper(endpoint, requestBody)
    } else {
      // broadcast via core endpoint

      // zone file is two words but core's api treats it as one word 'zonefile'
      const requestBody = { zonefile: zoneFile }

      return fetchPrivate(`${this.blockstackAPIUrl}/v1/zonefile/`,
                          {
                            method: 'POST',
                            body: JSON.stringify(requestBody),
                            headers: {
                              'Content-Type': 'application/json'
                            }
                          })
        .then((resp) => {
          const json = resp.json()
          return json
            .then((respObj) => {
              if (respObj.hasOwnProperty('error')) {
                throw new RemoteServiceError(resp)
              }
              return respObj.servers
            })
        })
    }
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
   * @return {Promise<Object|Error>} Returns a Promise that resolves to an object with a
   * `transaction_hash` key containing the transaction hash of the broadcasted transaction.
   *
   * In the event of an error, it rejects with:
   * * a `RemoteServiceError` if there is a problem
   *   with the transaction broadcast service
   * * `MissingParameterError` if you call the function without a required
   *   parameter
   * @private
   */
  broadcastNameRegistration(
    preorderTransaction: string,
    registerTransaction: string,
    zoneFile: string
  ) {
    /*
       * POST /v1/broadcast/registration
       * Request body:
       * JSON.stringify({
       * preorderTransaction,
       * registerTransaction,
       * zoneFile
       * })
       */

    if (!preorderTransaction) {
      const error = new MissingParameterError('preorderTransaction')
      return Promise.reject(error)
    }

    if (!registerTransaction) {
      const error = new MissingParameterError('registerTransaction')
      return Promise.reject(error)
    }

    if (!zoneFile) {
      const error = new MissingParameterError('zoneFile')
      return Promise.reject(error)
    }

    const requestBody = {
      preorderTransaction,
      registerTransaction,
      zoneFile
    }

    const endpoint = TX_BROADCAST_SERVICE_REGISTRATION_ENDPOINT

    return this.broadcastServiceFetchHelper(endpoint, requestBody)
  }

  /**
   * @ignore
   */
  getFeeRate(): Promise<number> {
    return fetchPrivate('https://bitcoinfees.earn.com/api/v1/fees/recommended')
      .then(resp => resp.json())
      .then(rates => Math.floor(rates.fastestFee))
  }

  /**
   * @ignore
   */
  countDustOutputs() {
    throw new Error('Not implemented.')
  }

  /**
   * @ignore
   */
  getUTXOs(address: string): Promise<Array<UTXO>> {
    return this.getNetworkedUTXOs(address)
      .then((networkedUTXOs) => {
        let returnSet = networkedUTXOs.concat()
        if (this.includeUtxoMap.hasOwnProperty(address)) {
          returnSet = networkedUTXOs.concat(this.includeUtxoMap[address])
        }

        // aaron: I am *well* aware this is O(n)*O(m) runtime
        //    however, clients should clear the exclude set periodically
        const excludeSet = this.excludeUtxoSet
        returnSet = returnSet.filter(
          (utxo) => {
            const inExcludeSet = excludeSet.reduce(
              (inSet, utxoToCheck) => inSet || (utxoToCheck.tx_hash === utxo.tx_hash
                          && utxoToCheck.tx_output_n === utxo.tx_output_n), false
            )
            return !inExcludeSet
          }
        )

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
   * @ignore
   */
  modifyUTXOSetFrom(txHex: string) {
    const tx = Transaction.fromHex(txHex)

    const excludeSet: Array<UTXO> = this.excludeUtxoSet.concat()

    tx.ins.forEach((utxoUsed) => {
      const reverseHash = Buffer.from(utxoUsed.hash)
      reverseHash.reverse()
      excludeSet.push({
        tx_hash: reverseHash.toString('hex'),
        tx_output_n: utxoUsed.index
      })
    })

    this.excludeUtxoSet = excludeSet

    const txHash = Buffer.from(tx.getHash().reverse()).toString('hex')
    tx.outs.forEach((utxoCreated, txOutputN) => {
      const isNullData = function isNullData(script: Buffer) {
        try {
          payments.embed({ output: script }, { validate: true })
          return true
        } catch (_) {
          return false
        }
      }
      if (isNullData(utxoCreated.script)) {
        return
      }
      const address = bjsAddress.fromOutputScript(
        utxoCreated.script, this.layer1
      )

      let includeSet: UTXO[] = []
      if (this.includeUtxoMap.hasOwnProperty(address)) {
        includeSet = includeSet.concat(this.includeUtxoMap[address])
      }

      includeSet.push({
        tx_hash: txHash,
        confirmations: 0,
        value: (utxoCreated as TxOutput).value,
        tx_output_n: txOutputN
      })
      this.includeUtxoMap[address] = includeSet
    })
  }

  resetUTXOs(address: string) {
    delete this.includeUtxoMap[address]
    this.excludeUtxoSet = []
  }

  /**
  * @ignore
  */
  getConsensusHash() {
    return fetchPrivate(`${this.blockstackAPIUrl}/v1/blockchains/bitcoin/consensus`)
      .then(resp => resp.json())
      .then(x => x.consensus_hash)
  }

  getTransactionInfo(txHash: string): Promise<{block_height: number}> {
    return this.btc.getTransactionInfo(txHash)
  }

  /**
   * @ignore
   */
  getBlockHeight() {
    return this.btc.getBlockHeight()
  }

  getNetworkedUTXOs(address: string): Promise<Array<UTXO>> {
    return this.btc.getNetworkedUTXOs(address)
  }
}

/**
 * @ignore
 */
export class LocalRegtest extends BlockstackNetwork {
  constructor(apiUrl: string, broadcastServiceUrl: string,
              bitcoinAPI: BitcoinNetwork) {
    super(apiUrl, broadcastServiceUrl, bitcoinAPI, networks.testnet)
  }

  getFeeRate(): Promise<number> {
    return Promise.resolve(Math.floor(0.00001000 * SATOSHIS_PER_BTC))
  }
}

/**
 * @ignore
 */
export class BitcoindAPI extends BitcoinNetwork {
  bitcoindUrl: string

  bitcoindCredentials: {username: string, password: string}

  importedBefore: any

  constructor(bitcoindUrl: string, bitcoindCredentials: {username: string, password: string}) {
    super()
    this.bitcoindUrl = bitcoindUrl
    this.bitcoindCredentials = bitcoindCredentials
    this.importedBefore = {}
  }

  broadcastTransaction(transaction: string) {
    const jsonRPC = {
      jsonrpc: '1.0',
      method: 'sendrawtransaction',
      params: [transaction]
    }
    const authString =      Buffer.from(`${this.bitcoindCredentials.username}:${this.bitcoindCredentials.password}`)
      .toString('base64')
    const headers = { Authorization: `Basic ${authString}` }
    return fetchPrivate(this.bitcoindUrl, {
      method: 'POST',
      body: JSON.stringify(jsonRPC),
      headers
    })
      .then(resp => resp.json())
      .then(respObj => respObj.result)
  }

  getBlockHeight() {
    const jsonRPC = {
      jsonrpc: '1.0',
      method: 'getblockcount'
    }
    const authString =      Buffer.from(`${this.bitcoindCredentials.username}:${this.bitcoindCredentials.password}`)
      .toString('base64')
    const headers = { Authorization: `Basic ${authString}` }
    return fetchPrivate(this.bitcoindUrl, {
      method: 'POST',
      body: JSON.stringify(jsonRPC),
      headers
    })
      .then(resp => resp.json())
      .then(respObj => respObj.result)
  }

  getTransactionInfo(txHash: string): Promise<{block_height: number}> {
    const jsonRPC = {
      jsonrpc: '1.0',
      method: 'gettransaction',
      params: [txHash]
    }
    const authString =      Buffer.from(`${this.bitcoindCredentials.username}:${this.bitcoindCredentials.password}`)
      .toString('base64')
    const headers = { Authorization: `Basic ${authString}` }
    return fetchPrivate(this.bitcoindUrl, {
      method: 'POST',
      body: JSON.stringify(jsonRPC),
      headers
    })
      .then(resp => resp.json())
      .then(respObj => respObj.result)
      .then(txInfo => txInfo.blockhash)
      .then((blockhash) => {
        const jsonRPCBlock = {
          jsonrpc: '1.0',
          method: 'getblockheader',
          params: [blockhash]
        }
        headers.Authorization = `Basic ${authString}`
        return fetchPrivate(this.bitcoindUrl, {
          method: 'POST',
          body: JSON.stringify(jsonRPCBlock),
          headers
        })
      })
      .then(resp => resp.json())
      .then((respObj) => {
        if (!respObj || !respObj.result) {
          // unconfirmed 
          throw new Error('Unconfirmed transaction')
        } else {
          return { block_height: respObj.result.height }
        }
      })
  }

  getNetworkedUTXOs(address: string): Promise<Array<UTXO>> {
    const jsonRPCImport = {
      jsonrpc: '1.0',
      method: 'importaddress',
      params: [address]
    }
    const jsonRPCUnspent = {
      jsonrpc: '1.0',
      method: 'listunspent',
      params: [0, 9999999, [address]]
    }
    const authString = Buffer.from(`${this.bitcoindCredentials.username}:${this.bitcoindCredentials.password}`)
      .toString('base64')
    const headers = { Authorization: `Basic ${authString}` }

    const importPromise = (this.importedBefore[address])
      ? Promise.resolve()
      : fetchPrivate(this.bitcoindUrl, {
        method: 'POST',
        body: JSON.stringify(jsonRPCImport),
        headers
      })
        .then(() => { this.importedBefore[address] = true })

    return importPromise
      .then(() => fetchPrivate(this.bitcoindUrl, {
        method: 'POST',
        body: JSON.stringify(jsonRPCUnspent),
        headers
      }))
      .then(resp => resp.json())
      .then(x => x.result)
      .then(utxos => utxos.map(
        (x: any) => ({
          value: Math.round(x.amount * SATOSHIS_PER_BTC),
          confirmations: x.confirmations,
          tx_hash: x.txid,
          tx_output_n: x.vout
        })
      ))
  }
}

/**
 * @ignore
 */
export class InsightClient extends BitcoinNetwork {
  apiUrl: string

  constructor(insightUrl: string = 'https://utxo.technofractal.com/') {
    super()
    this.apiUrl = insightUrl
  }

  broadcastTransaction(transaction: string) {
    const jsonData = { rawtx: transaction }
    return fetchPrivate(`${this.apiUrl}/tx/send`,
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(jsonData)
                        })
      .then(resp => resp.json())
  }

  getBlockHeight() {
    return fetchPrivate(`${this.apiUrl}/status`)
      .then(resp => resp.json())
      .then(status => status.blocks)
  }

  getTransactionInfo(txHash: string): Promise<{block_height: number}> {
    return fetchPrivate(`${this.apiUrl}/tx/${txHash}`)
      .then(resp => resp.json())
      .then((transactionInfo) => {
        if (transactionInfo.error) {
          throw new Error(`Error finding transaction: ${transactionInfo.error}`)
        }
        return fetchPrivate(`${this.apiUrl}/block/${transactionInfo.blockHash}`)
      })
      .then(resp => resp.json())
      .then(blockInfo => ({ block_height: blockInfo.height }))
  }

  getNetworkedUTXOs(address: string): Promise<Array<UTXO>> {
    return fetchPrivate(`${this.apiUrl}/addr/${address}/utxo`)
      .then(resp => resp.json())
      .then(utxos => utxos.map(
        (x: any) => ({
          value: x.satoshis,
          confirmations: x.confirmations,
          tx_hash: x.txid,
          tx_output_n: x.vout
        })
      ))
  }
}


/**
 * @ignore
 */
export class BlockchainInfoApi extends BitcoinNetwork {
  utxoProviderUrl: string

  constructor(blockchainInfoUrl: string = 'https://blockchain.info') {
    super()
    this.utxoProviderUrl = blockchainInfoUrl
  }

  getBlockHeight() {
    return fetchPrivate(`${this.utxoProviderUrl}/latestblock?cors=true`)
      .then(resp => resp.json())
      .then(blockObj => blockObj.height)
  }

  getNetworkedUTXOs(address: string): Promise<Array<UTXO>> {
    return fetchPrivate(`${this.utxoProviderUrl}/unspent?format=json&active=${address}&cors=true`)
      .then((resp) => {
        if (resp.status === 500) {
          Logger.debug('UTXO provider 500 usually means no UTXOs: returning []')
          return {
            unspent_outputs: []
          }
        } else {
          return resp.json()
        }
      })
      .then(utxoJSON => utxoJSON.unspent_outputs)
      .then(utxoList => utxoList.map(
        (utxo: any) => {
          const utxoOut = {
            value: utxo.value,
            tx_output_n: utxo.tx_output_n,
            confirmations: utxo.confirmations,
            tx_hash: utxo.tx_hash_big_endian
          }
          return utxoOut
        }
      ))
  }

  getTransactionInfo(txHash: string): Promise<{block_height: number}> {
    return fetchPrivate(`${this.utxoProviderUrl}/rawtx/${txHash}?cors=true`)
      .then((resp) => {
        if (resp.status === 200) {
          return resp.json()
        } else {
          throw new Error(`Could not lookup transaction info for '${txHash}'. Server error.`)
        }
      })
      .then(respObj => ({ block_height: respObj.block_height }))
  }

  broadcastTransaction(transaction: string) {
    const form = new FormData()
    form.append('tx', transaction)
    return fetchPrivate(`${this.utxoProviderUrl}/pushtx?cors=true`,
                        {
                          method: 'POST',
                          body: <any>form
                        })
      .then((resp) => {
        const text = resp.text()
        return text
          .then((respText) => {
            if (respText.toLowerCase().indexOf('transaction submitted') >= 0) {
              const txHash = Buffer.from(
                Transaction.fromHex(transaction)
                  .getHash()
                  .reverse()).toString('hex') // big_endian
              return txHash
            } else {
              throw new RemoteServiceError(resp,
                                           `Broadcast transaction failed with message: ${respText}`)
            }
          })
      })
  }
}


/**
* @ignore
*/
const LOCAL_REGTEST = new LocalRegtest(
  'http://localhost:16268',
  'http://localhost:16269',
  new BitcoindAPI('http://localhost:18332/',
                  { username: 'blockstack', password: 'blockstacksystem' })
)

/**
* @ignore
*/
const MAINNET_DEFAULT = new BlockstackNetwork(
  'https://core.blockstack.org',
  'https://broadcast.blockstack.org',
  new BlockchainInfoApi()
)

/**
 * Get WHOIS-like information for a name, including the address that owns it,
 * the block at which it expires, and the zone file anchored to it (if available).
 * @param {String} fullyQualifiedName the name to query.  Can be on-chain of off-chain.
 * @return {Promise} a promise that resolves to the WHOIS-like information 
 */
export function getNameInfo(fullyQualifiedName: string) {
  return config.network.getNameInfo(fullyQualifiedName)
}

/**
* @ignore
*/
export const network = {
  BlockstackNetwork,
  LocalRegtest,
  BlockchainInfoApi,
  BitcoindAPI,
  InsightClient,
  defaults: { LOCAL_REGTEST, MAINNET_DEFAULT }
}
