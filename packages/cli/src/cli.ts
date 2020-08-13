import * as blockstack from 'blockstack';
import * as bitcoin from 'bitcoinjs-lib';
import * as process from 'process';
import * as fs from 'fs';
import * as winston from 'winston';
import * as logger from 'winston';
import * as cors from 'cors';
import * as RIPEMD160 from 'ripemd160';
const BN = require('bn.js');
import * as crypto from 'crypto';
import * as bip39 from 'bip39';
import * as express from 'express';
import * as path from 'path';
import * as inquirer from 'inquirer';
import fetch from 'node-fetch';
import { 
  makeSTXTokenTransfer,
  makeContractDeploy,
  makeContractCall,
  callReadOnlyFunction,
  broadcastTransaction,
  estimateTransfer,
  estimateContractDeploy,
  estimateContractFunctionCall,
  StacksMainnet,
  StacksTestnet,
  TokenTransferOptions,
  ContractDeployOptions,
  ContractCallOptions,
  ReadOnlyFunctionOptions,
  ContractCallPayload,
  ClarityValue,
  ClarityAbi,
  getAbi,
  validateContractCall,
  PostConditionMode,
  cvToString,
} from '@blockstack/stacks-transactions';

const c32check = require('c32check');

import {
  UserData
} from 'blockstack/lib/auth/authApp';

import {
  GaiaHubConfig
} from 'blockstack/lib/storage/hub';

import {
  getOwnerKeyInfo,
  getPaymentKeyInfo,
  getStacksWalletKeyInfo,
  getApplicationKeyInfo,
  extractAppKey,
  STRENGTH,
  STX_WALLET_COMPATIBLE_SEED_STRENGTH,
  PaymentKeyInfoType,
  OwnerKeyInfoType,
  StacksKeyInfoType
} from './keys';

import {
  CLI_ARGS,
  getCLIOpts,
  CLIOptAsString,
  CLIOptAsStringArray,
  CLIOptAsBool,
  checkArgs,
  loadConfig,
  makeCommandUsageString,
  makeAllCommandsList,
  USAGE,
  DEFAULT_CONFIG_PATH,
  DEFAULT_CONFIG_REGTEST_PATH,
  DEFAULT_CONFIG_TESTNET_PATH,
  ID_ADDRESS_PATTERN,
  STACKS_ADDRESS_PATTERN,
  DEFAULT_MAX_ID_SEARCH_INDEX
} from './argparse';

import {
  encryptBackupPhrase,
  decryptBackupPhrase
} from './encrypt';

import {
  CLINetworkAdapter,
  CLI_NETWORK_OPTS,
  getNetwork,
  NameInfoType,
  PriceType
} from './network';

import {
  gaiaAuth,
  gaiaConnect,
  gaiaUploadProfileAll,
  makeZoneFileFromGaiaUrl,
  getGaiaAddressFromProfile
} from './data';

import {
  SafetyError,
  JSONStringify,
  getPrivateKeyAddress,
  canonicalPrivateKey,
  sumUTXOs,
  hash160,
  checkUrl,
  decodePrivateKey,
  makeProfileJWT,
  broadcastTransactionAndZoneFile,
  getNameInfoEasy,
  nameLookup,
  getpass,
  getBackupPhrase,
  mkdirs,
  getIDAddress,
  IDAppKeys,
  getIDAppKeys,
  hasKeys,
  UTXO,
  makeDIDConfiguration,
  makePromptsFromArgList,
  parseClarityFunctionArgAnswers,
  ClarityFunctionArg,
  generateExplorerTxPageUrl
} from './utils';

import {
  handleAuth,
  handleSignIn
} from './auth';

// global CLI options
let txOnly = false;
let estimateOnly = false;
let safetyChecks = true;
let receiveFeesPeriod = 52595;
let gracePeriod = 5000;
let noExit = false;
let maxIDSearchIndex = DEFAULT_MAX_ID_SEARCH_INDEX;

let BLOCKSTACK_TEST = process.env.BLOCKSTACK_TEST ? true : false;

export function getMaxIDSearchIndex() {
  return maxIDSearchIndex;
}

export interface WhoisInfoType {
  address: string;
  blockchain: string;
  block_renewed_at: number;
  did: string;
  expire_block: number;
  grace_period: number;
  last_transaction_height: number;
  last_txid: string;
  owner_address: string;
  owner_script: string;
  renewal_deadline: number;
  resolver: string | null;
  status: string;
  zonefile: string | null;
  zonefile_hash: string | null;
}

/*
 * Get a name's record information
 * args:
 * @name (string) the name to query
 */
function whois(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  return network.getNameInfo(name)
    .then((nameInfo : NameInfoType) => {
      if (BLOCKSTACK_TEST) {
        // the test framework expects a few more fields.
        // these are for compatibility with the old CLI.
        // you are not required to understand them.
        return Promise.all([network.getNameHistory(name, 0), network.getBlockHeight()])
          .then(([nameHistory, blockHeight] : [any, number]) => {
            if (nameInfo.renewal_deadline > 0 && nameInfo.renewal_deadline <= blockHeight) {
              return {'error': 'Name expired'};
            }

            const blocks : string[] = Object.keys(nameHistory);
            const lastBlock : number = parseInt(blocks.sort().slice(-1)[0]);
            const blockRenewedAt : number = parseInt(nameHistory[lastBlock].slice(-1)[0].last_renewed);
            const ownerScript = bitcoin.address.toOutputScript(
              network.coerceMainnetAddress(nameInfo.address)).toString('hex');

            const whois : WhoisInfoType = {
              address: nameInfo.address,
              blockchain: nameInfo.blockchain,
              block_renewed_at: blockRenewedAt,
              did: nameInfo.did,
              expire_block: nameInfo.expire_block,
              grace_period: nameInfo.grace_period,
              last_transaction_height: lastBlock,
              last_txid: nameInfo.last_txid,
              owner_address: nameInfo.address,
              owner_script: ownerScript,
              renewal_deadline: nameInfo.renewal_deadline,
              resolver: nameInfo.resolver,
              status: nameInfo.status,
              zonefile: nameInfo.zonefile,
              zonefile_hash: nameInfo.zonefile_hash
            };
            return whois;
          })
          .then((whoisInfo : any) => JSONStringify(whoisInfo, true));
      }
      else {
        return Promise.resolve().then(() => JSONStringify(nameInfo, true));
      }
    })
    .catch((error : Error) => {
      if (error.message === 'Name not found') {
        return JSONStringify({'error': 'Name not found'}, true);
      }
      else {
        throw error;
      }
    });
}

/*
 * Get a name's price information
 * args:
 * @name (string) the name to query
 */
function price(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  return network.getNamePrice(name)
    .then((priceInfo : PriceType) => JSONStringify(
      { units: priceInfo.units, amount: priceInfo.amount.toString() }));
}

/*
 * Get a namespace's price information 
 * args:
 * @namespaceID (string) the namespace to query
 */
function priceNamespace(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const namespaceID = args[0];
  return network.getNamespacePrice(namespaceID)
    .then((priceInfo : PriceType) => JSONStringify(
      { units: priceInfo.units, amount: priceInfo.amount.toString() }));
}

/*
 * Get names owned by an address
 * args:
 * @address (string) the address to query
 */
function names(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const IDaddress = args[0];
  if (!IDaddress.startsWith('ID-')) {
    throw new Error('Must be an ID-address');
  }

  const address = IDaddress.slice(3);
  return network.getNamesOwned(address)
    .then((namesList : string[]) => JSONStringify(namesList));
}

/*
 * Look up a name's profile and zonefile
 * args:
 * @name (string) the name to look up
 */
function lookup(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  network.setCoerceMainnetAddress(true);

  const name = args[0];
  return nameLookup(network, name)
    .then((nameLookupInfo) => JSONStringify(nameLookupInfo))
    .catch((e : Error) => JSONStringify({ error: e.message }));
}

/*
 * Get a name's blockchain record
 * args:
 * @name (string) the name to query
 */
function getNameBlockchainRecord(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  return Promise.resolve().then(() => {
    return network.getBlockchainNameRecord(name);
  })
    .then((nameInfo : any) => {
      return JSONStringify(nameInfo);
    })
    .catch((e : Error) => {
      if (e.message === 'Bad response status: 404') {
        return JSONStringify({ 'error': 'Name not found'}, true);
      }
      else {
        throw e;
      }
    });
}

/*
 * Get all of a name's history
 */
async function getAllNameHistoryPages(network: CLINetworkAdapter, name: string, page: number) {
  let history = {};
  try {
    const results = await network.getNameHistory(name, page);
    if (Object.keys(results).length == 0) {
      return history;
    }
    else {
      history = Object.assign(history, results);
      const rest = await getAllNameHistoryPages(network, name, page + 1);
      history = Object.assign(history, rest);
      return history;
    }
  }
  catch (_e) {
    return history;
  }
}

/*
 * Get a name's history entry or entries
 * args:
 * @name (string) the name to query
 * @page (string) the page to query (OPTIONAL)
 */
function getNameHistoryRecord(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  let page : number;

  if (args.length >= 2 && args[1] !== null && args[1] !== undefined) {
    page = parseInt(args[1]);
    return Promise.resolve().then(() => {
      return network.getNameHistory(name, page);
    })
      .then((nameHistory : any) => {
        return JSONStringify(nameHistory);
      });
  }
  else {
    // all pages 
    return getAllNameHistoryPages(network, name, 0)
      .then((history : any) => JSONStringify(history));
  }
}

/*
 * Get a namespace's blockchain record
 * args:
 * @namespaceID (string) the namespace to query
 */
function getNamespaceBlockchainRecord(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const namespaceID = args[0];
  return Promise.resolve().then(() => {
    return network.getNamespaceInfo(namespaceID);
  })
    .then((namespaceInfo : any) => {
      return JSONStringify(namespaceInfo);
    })
    .catch((e : Error) => {
      if (e.message === 'Namespace not found') {
        return JSONStringify({'error': 'Namespace not found'}, true);
      }
      else {
        throw e;
      }
    });
}

/*
 * Get a zone file by hash.
 * args:
 * @zonefile_hash (string) the hash of the zone file to query
 */
function getZonefile(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const zonefileHash = args[0];
  return network.getZonefile(zonefileHash);
}

/*
 * Generate and optionally send a name-preorder
 * args:
 * @name (string) the name to preorder
 * @IDaddress (string) the address to own the name
 * @paymentKey (string) the payment private key
 * @preorderTxOnly (boolean) OPTIONAL: used internally to only return a tx (overrides CLI)
 */
function txPreorder(network: CLINetworkAdapter, args: string[], preorderTxOnly: boolean = false) : Promise<string> {
  const name = args[0];
  const IDaddress = args[1];
  const paymentKey = decodePrivateKey(args[2]);
  const paymentAddress = getPrivateKeyAddress(network, paymentKey);

  if (!IDaddress.startsWith('ID-')) {
    throw new Error('Recipient ID-address must start with ID-');
  }
  const address = IDaddress.slice(3);

  const namespaceID = name.split('.').slice(-1)[0];

  const txPromise = blockstack.transactions.makePreorder(
    name, address, paymentKey, !hasKeys(paymentKey));

  const paymentUTXOsPromise = network.getUTXOs(paymentAddress);

  const estimatePromise = paymentUTXOsPromise.then((utxos : UTXO[]) => {
    const numUTXOs = utxos.length;
    return blockstack.transactions.estimatePreorder(
      name, network.coerceAddress(address), 
      network.coerceAddress(paymentAddress), numUTXOs);
  });

  if (estimateOnly) {
    return estimatePromise
      .then((cost: number) => JSONStringify({cost: cost}));
  }
  
  if (!safetyChecks) {
    if (txOnly || preorderTxOnly) {
      return txPromise;
    }
    else {
      return txPromise
        .then((tx) => {
          return network.broadcastTransaction(tx);
        });
    }
  }

  const paymentBalance = paymentUTXOsPromise.then((utxos : UTXO[]) => {
    return sumUTXOs(utxos);
  });

  const nameInfoPromise = getNameInfoEasy(network, name);
  const blockHeightPromise = network.getBlockHeight();

  const safetyChecksPromise = Promise.all([
    nameInfoPromise,
    blockHeightPromise,
    blockstack.safety.isNameValid(name),
    blockstack.safety.isNameAvailable(name),
    blockstack.safety.addressCanReceiveName(network.coerceAddress(address)),
    blockstack.safety.isInGracePeriod(name),
    network.getNamespaceBurnAddress(namespaceID, true, receiveFeesPeriod),
    network.getNamespaceBurnAddress(namespaceID, false, receiveFeesPeriod),
    paymentBalance,
    estimatePromise,
    blockstack.safety.namespaceIsReady(namespaceID),
    network.getNamePrice(name),
    network.getAccountBalance(paymentAddress, 'STACKS')
  ])
    .then(([nameInfo,
      _blockHeight,
      isNameValid,
      isNameAvailable,
      addressCanReceiveName, 
      isInGracePeriod,
      givenNamespaceBurnAddress,
      trueNamespaceBurnAddress,
      paymentBalance,
      estimate,
      isNamespaceReady,
      namePrice,
      STACKSBalance]) => {
      if (isNameValid && isNamespaceReady &&
          (isNameAvailable || !nameInfo) &&
          addressCanReceiveName && !isInGracePeriod && paymentBalance >= estimate &&
          trueNamespaceBurnAddress === givenNamespaceBurnAddress &&
          (namePrice.units === 'BTC' || (namePrice.units == 'STACKS'
           && namePrice.amount.cmp(STACKSBalance) <= 0))) {
        return {'status': true};
      }
      else {
        return {
          'status': false,
          'error': 'Name cannot be safely preordered',
          'isNameValid': isNameValid,
          'isNameAvailable': isNameAvailable,
          'addressCanReceiveName': addressCanReceiveName,
          'isInGracePeriod': isInGracePeriod,
          'paymentBalanceBTC': paymentBalance,
          'paymentBalanceStacks': STACKSBalance.toString(),
          'nameCostUnits': namePrice.units,
          'nameCostAmount': namePrice.amount.toString(),
          'estimateCostBTC': estimate,
          'isNamespaceReady': isNamespaceReady,
          'namespaceBurnAddress': givenNamespaceBurnAddress,
          'trueNamespaceBurnAddress': trueNamespaceBurnAddress
        };
      }
    });

  return safetyChecksPromise
    .then((safetyChecksResult : any) => {
      if (!safetyChecksResult.status) {
        return new Promise((resolve : any) => resolve(JSONStringify(safetyChecksResult, true)));
      }

      if (txOnly || preorderTxOnly) {
        return txPromise;
      }

      return txPromise.then((tx : string) => {
        return network.broadcastTransaction(tx);
      })
        .then((txidHex : string) => {
          return txidHex;
        });
    });
}


/*
 * Generate and optionally send a name-register
 * args:
 * @name (string) the name to register
 * @IDaddress (string) the address that owns this name
 * @paymentKey (string) the payment private key
 * @zonefile (string) if given, the raw zone file or the path to the zone file data to use
 * @zonefileHash (string) if given, this is the raw zone file hash to use
 *  (in which case, @zonefile will be ignored)
 * @registerTxOnly (boolean) OPTIONAL: used internally to coerce returning only the tx
 */
function txRegister(network: CLINetworkAdapter, args: string[], registerTxOnly: boolean = false) : Promise<string> {
  const name = args[0];
  const IDaddress = args[1];
  const paymentKey = decodePrivateKey(args[2]);

  if (!IDaddress.startsWith('ID-')) {
    throw new Error('Recipient ID-address must start with ID-');
  }
  const address = IDaddress.slice(3);
  const namespaceID = name.split('.').slice(-1)[0];

  let zonefilePath = null;
  let zonefileHash = null;
  let zonefile = null;

  if (args.length > 3 && !!args[3]) {
    zonefilePath = args[3];
  }

  if (args.length > 4 && !!args[4]) {
    zonefileHash = args[4];
    zonefilePath = null;

    logger.debug(`Using zone file hash ${zonefileHash} instead of zone file`);
  }

  if (!!zonefilePath) {
    try {
      zonefile = fs.readFileSync(zonefilePath).toString();
    }
    catch(e) {
      // zone file path as raw zone file
      zonefile = zonefilePath;
    }
  }

  const paymentAddress = getPrivateKeyAddress(network, paymentKey);
  const paymentUTXOsPromise = network.getUTXOs(paymentAddress);

  const estimatePromise = paymentUTXOsPromise.then((utxos : UTXO[]) => {
    const numUTXOs = utxos.length;
    return blockstack.transactions.estimateRegister(
      name, network.coerceAddress(address),
      network.coerceAddress(paymentAddress), true, numUTXOs);
  });

  const txPromise = blockstack.transactions.makeRegister(
    name, address, paymentKey, zonefile, zonefileHash, !hasKeys(paymentKey));

  if (estimateOnly) {
    return estimatePromise
      .then((cost: number) => JSONStringify({cost: cost}));
  }
 
  if (!safetyChecks) {
    if (txOnly || registerTxOnly) {
      return txPromise;
    }
    else {
      return txPromise
        .then((tx: string) => {
          return network.broadcastTransaction(tx);
        });
    }
  }

  const paymentBalancePromise = paymentUTXOsPromise.then((utxos : UTXO[]) => {
    return sumUTXOs(utxos);
  });
 
  const nameInfoPromise = getNameInfoEasy(network, name);
  const blockHeightPromise = network.getBlockHeight();

  const safetyChecksPromise = Promise.all([
    nameInfoPromise,
    blockHeightPromise,
    blockstack.safety.isNameValid(name),
    blockstack.safety.isNameAvailable(name),
    blockstack.safety.addressCanReceiveName(
      network.coerceAddress(address)),
    blockstack.safety.isInGracePeriod(name),
    blockstack.safety.namespaceIsReady(namespaceID),
    paymentBalancePromise,
    estimatePromise
  ])
    .then(([nameInfo, 
      _blockHeight,
      isNameValid,
      isNameAvailable, 
      addressCanReceiveName,
      isInGracePeriod,
      isNamespaceReady,
      paymentBalance,
      estimateCost]) => {
      if (isNameValid && isNamespaceReady &&
         (isNameAvailable || !nameInfo) &&
          addressCanReceiveName && !isInGracePeriod && estimateCost < paymentBalance) {
        return {'status': true};
      }
      else {
        return {
          'status': false,
          'error': 'Name cannot be safely registered',
          'isNameValid': isNameValid,
          'isNameAvailable': isNameAvailable,
          'addressCanReceiveName': addressCanReceiveName,
          'isInGracePeriod': isInGracePeriod,
          'isNamespaceReady': isNamespaceReady,
          'paymentBalanceBTC': paymentBalance,
          'estimateCostBTC': estimateCost
        };
      }
    });
  
  return safetyChecksPromise
    .then((safetyChecksResult : any) => {
      if (!safetyChecksResult.status) {
        if (registerTxOnly) {
          return new Promise((resolve : any) => resolve(JSONStringify(safetyChecksResult, true)));
        }
      }

      if (txOnly || registerTxOnly) {
        return txPromise;
      }

      return txPromise.then((tx : string) => {
        return network.broadcastTransaction(tx);
      })
        .then((txidHex : string) => {
          return txidHex;
        });
    });
}


// helper to be used with txPreorder and txRegister to determine whether or not the operation failed
function checkTxStatus(txOrJson: string) : boolean {
  try {
    const json = JSON.parse(txOrJson);
    return !!json.status;
  }
  catch(e) {
    return true;
  }
}

/*
 * Generate a zone file for a name, given its Gaia hub URL
 * Optionally includes a _resolver entry 
 * args:
 * @name (string) the blockstack ID
 * @idAddress (string) the ID address that owns the name
 * @gaiaHub (string) the URL to the write endpoint to store the name's profile
 */
function makeZonefile(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  const idAddress = args[1];
  const gaiaHub = args[2];
  let resolver  = '';

  if (!idAddress.startsWith('ID-')) {
    throw new Error('ID-address must start with ID-');
  }

  if (args.length > 3 && !!args[3]) {
    resolver = args[3];
  }

  const address = idAddress.slice(3);
  const mainnetAddress = network.coerceMainnetAddress(address);
  const profileUrl = `${gaiaHub.replace(/\/+$/g, '')}/${mainnetAddress}/profile.json`;
  try {
    checkUrl(profileUrl);
  }
  catch(e) {
    return Promise.resolve().then(() => JSONStringify({
      'status': false,
      'error': e.message,
      'hints': [
        'Make sure the Gaia hub URL does not have any trailing /\'s',
        'Make sure the Gaia hub URL scheme is present and well-formed'
      ]
    }, true));
  }

  const zonefile = blockstack.makeProfileZoneFile(name, profileUrl);
  return Promise.resolve().then(() => {
    if (!resolver) {
      return zonefile;
    }

    // append _resolver record
    // TODO: zone-file doesn't do this right, so we have to append manually 
    return `${zonefile.replace(/\n+$/, '')}\n_resolver\tIN\tURI\t10\t1\t"${resolver}"`;
  });
}

/*
 * Generate and optionally send a name-update
 * args:
 * @name (string) the name to update
 * @zonefile (string) the path to the zonefile to use
 * @ownerKey (string) the owner private key
 * @paymentKey (string) the payment private key
 * @zonefileHash (string) the zone file hash to use, if given
 *   (will be used instead of the zonefile)
 */
function update(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  let zonefilePath = args[1];
  const ownerKey = decodePrivateKey(args[2]);
  const paymentKey = decodePrivateKey(args[3]);

  let zonefile = null;
  let zonefileHash = '';

  if (args.length > 4 && !!args[4]) {
    zonefileHash = args[4];
    zonefilePath = null;
    logger.debug(`Using zone file hash ${zonefileHash} instead of zone file`);
  }

  if (zonefilePath) {
    zonefile = fs.readFileSync(zonefilePath).toString();
  }

  const ownerAddress = getPrivateKeyAddress(network, ownerKey);
  const paymentAddress = getPrivateKeyAddress(network, paymentKey);

  const ownerUTXOsPromise = network.getUTXOs(ownerAddress);
  const paymentUTXOsPromise = network.getUTXOs(paymentAddress);

  const estimatePromise = Promise.all([
    ownerUTXOsPromise, paymentUTXOsPromise])
    .then(([ownerUTXOs, paymentUTXOs] : [UTXO[], UTXO[]]) => {
      const numOwnerUTXOs = ownerUTXOs.length;
      const numPaymentUTXOs = paymentUTXOs.length;
      return blockstack.transactions.estimateUpdate(
        name, network.coerceAddress(ownerAddress),
        network.coerceAddress(paymentAddress),
        numOwnerUTXOs + numPaymentUTXOs - 1);
    });

  const txPromise = blockstack.transactions.makeUpdate(
    name, ownerKey, paymentKey, zonefile, zonefileHash, !hasKeys(ownerKey) || !hasKeys(paymentKey));

  if (estimateOnly) {
    return estimatePromise
      .then((cost: number) => String(cost));
  }
 
  if (!safetyChecks) {
    if (txOnly) {
      return txPromise;
    }
    else {
      return txPromise
        .then((tx : string) => {
          return network.broadcastTransaction(tx);
        });
    }
  }

  const paymentBalancePromise = paymentUTXOsPromise.then((utxos : UTXO[]) => {
    return sumUTXOs(utxos);
  });

  const safetyChecksPromise = Promise.all([
    blockstack.safety.isNameValid(name),
    blockstack.safety.ownsName(name, network.coerceAddress(ownerAddress)),
    blockstack.safety.isInGracePeriod(name),
    estimatePromise,
    paymentBalancePromise
  ])
    .then(([isNameValid, ownsName, isInGracePeriod, estimateCost, paymentBalance]) => {
      if (isNameValid && ownsName && !isInGracePeriod && estimateCost < paymentBalance) {
        return {'status': true};
      }
      else {
        return {
          'status': false,
          'error': 'Name cannot be safely updated',
          'isNameValid': isNameValid,
          'ownsName': ownsName,
          'isInGracePeriod': isInGracePeriod,
          'estimateCostBTC': estimateCost,
          'paymentBalanceBTC': paymentBalance
        };
      }
    });

  return safetyChecksPromise
    .then((safetyChecksResult) => {
      if (!safetyChecksResult.status) {
        return new Promise((resolve) => resolve(JSONStringify(safetyChecksResult, true)));
      }

      if (txOnly) {
        return txPromise;
      }

      return txPromise.then((tx : string) => {
        return network.broadcastTransaction(tx);
      })
        .then((txidHex : string) => {
          return txidHex;
        });
    });
}

/*
 * Generate and optionally send a name-transfer
 * args:
 * @name (string) the name to transfer
 * @IDaddress (string) the new owner address
 * @keepZoneFile (boolean) keep the zone file or not
 * @ownerKey (string) the owner private key
 * @paymentKey (string) the payment private key
 */
function transfer(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  const IDaddress = args[1];
  const keepZoneFile = (args[2].toLowerCase() === 'true');
  const ownerKey = decodePrivateKey(args[3]);
  const paymentKey = decodePrivateKey(args[4]);
  const ownerAddress = getPrivateKeyAddress(network, ownerKey);
  const paymentAddress = getPrivateKeyAddress(network, paymentKey);

  if (!IDaddress.startsWith('ID-')) {
    throw new Error('Recipient ID-address must start with ID-');
  }
  const address = IDaddress.slice(3);

  const ownerUTXOsPromise = network.getUTXOs(ownerAddress);
  const paymentUTXOsPromise = network.getUTXOs(paymentAddress);

  const estimatePromise = Promise.all([
    ownerUTXOsPromise, paymentUTXOsPromise])
    .then(([ownerUTXOs, paymentUTXOs] : [UTXO[], UTXO[]]) => {
      const numOwnerUTXOs = ownerUTXOs.length;
      const numPaymentUTXOs = paymentUTXOs.length;
      return blockstack.transactions.estimateTransfer(
        name, network.coerceAddress(address),
        network.coerceAddress(ownerAddress), 
        network.coerceAddress(paymentAddress),
        numOwnerUTXOs + numPaymentUTXOs - 1);
    });

  const txPromise = blockstack.transactions.makeTransfer(
    name, address, ownerKey, paymentKey, keepZoneFile, !hasKeys(ownerKey) || !hasKeys(paymentKey));

  if (estimateOnly) {
    return estimatePromise
      .then((cost: number) => String(cost));
  }
 
  if (!safetyChecks) {
    if (txOnly) {
      return txPromise;
    }
    else {
      return txPromise
        .then((tx : string) => {
          return network.broadcastTransaction(tx);
        });
    }
  }

  const paymentBalancePromise = paymentUTXOsPromise.then((utxos : UTXO[]) => {
    return sumUTXOs(utxos);
  });
  
  const safetyChecksPromise = Promise.all([
    blockstack.safety.isNameValid(name),
    blockstack.safety.ownsName(name, network.coerceAddress(ownerAddress)),
    blockstack.safety.addressCanReceiveName(network.coerceAddress(address)),
    blockstack.safety.isInGracePeriod(name),
    paymentBalancePromise,
    estimatePromise
  ])
    .then(([isNameValid, ownsName, addressCanReceiveName, 
      isInGracePeriod, paymentBalance, estimateCost]) => {
      if (isNameValid && ownsName && addressCanReceiveName &&
          !isInGracePeriod && estimateCost < paymentBalance) {
        return {'status': true};
      }
      else {
        return {
          'status': false,
          'error': 'Name cannot be safely transferred',
          'isNameValid': isNameValid,
          'ownsName': ownsName,
          'addressCanReceiveName': addressCanReceiveName,
          'isInGracePeriod': isInGracePeriod,
          'estimateCostBTC': estimateCost,
          'paymentBalanceBTC': paymentBalance
        };
      }
    });

  return safetyChecksPromise
    .then((safetyChecksResult) => {
      if (!safetyChecksResult.status) {
        return new Promise((resolve) => resolve(JSONStringify(safetyChecksResult, true)));
      }

      if (txOnly) {
        return txPromise;
      }

      return txPromise.then((tx : string) => {
        return network.broadcastTransaction(tx);
      })
        .then((txidHex : string) => {
          return txidHex;
        });
    });
}

/*
 * Get the last zone file hash
 */
function getLastZonefileHash(network: CLINetworkAdapter, name: string): Promise<string> {
  return getAllNameHistoryPages(network, name, 0)
    .then((nameHistory : any) => {
      let zfh  = '';
      const blockHeights = Object.keys(nameHistory).sort().reverse();
      for (let i = 0; i < blockHeights.length; i++) {
        const blockHeight = blockHeights[i];
        for (let j = nameHistory[blockHeight].length - 1; j >= 0; j--) {
          const entry = nameHistory[blockHeight][j];
          if (!!entry.value_hash) {
            zfh = entry.value_hash;
            break;
          }
        }
        if (!!zfh) {
          break;
        }
      }
      
      if (!!zfh) {
        return zfh;
      }
      else {
        throw new Error(`Failed to find a zone file hash for ${name}`);
      }
    });
}

/*
 * Generate and optionally send a name-renewal
 * args:
 * @name (string) the name to renew
 * @ownerKey (string) the owner private key
 * @paymentKey (string) the payment private key 
 * @address (string) OPTIONAL: the new owner address
 * @zonefilePath (string) OPTIONAL: the path to the new zone file
 * @zonefileHash (string) OPTINOAL: use the given zonefile hash.  Supercedes zonefile.
 */
async function renew(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  const ownerKey = decodePrivateKey(args[1]);
  const paymentKey = decodePrivateKey(args[2]);
  const ownerAddress = getPrivateKeyAddress(network, ownerKey);
  const paymentAddress = getPrivateKeyAddress(network, paymentKey);
  const namespaceID = name.split('.').slice(-1)[0];

  let newAddress  = '';
  let zonefilePath  = '';
  let zonefileHash  = '';
  let zonefile  = '';
  let blankZonefileHash  = true;

  if (args.length >= 4 && !!args[3]) {
    // ID-address
    newAddress = args[3].slice(3);
  }
  else {
    newAddress = getPrivateKeyAddress(network, ownerKey);
  }

  if (args.length >= 5 && !!args[4]) {
    blankZonefileHash = false;
    zonefilePath = args[4];
  }

  if (args.length >= 6 && !!args[5]) {
    blankZonefileHash = false;
    zonefileHash = args[5];
    zonefilePath = null;
    logger.debug(`Using zone file hash ${zonefileHash} instead of zone file`);
  }

  if (zonefilePath) {
    zonefile = fs.readFileSync(zonefilePath).toString();
  }

  const ownerUTXOsPromise = network.getUTXOs(ownerAddress);
  const paymentUTXOsPromise = network.getUTXOs(paymentAddress);

  const estimatePromise = Promise.all([
    ownerUTXOsPromise, paymentUTXOsPromise])
    .then(([ownerUTXOs, paymentUTXOs] : [UTXO[], UTXO[]]) => {
      const numOwnerUTXOs = ownerUTXOs.length;
      const numPaymentUTXOs = paymentUTXOs.length;
      return blockstack.transactions.estimateRenewal(
        name, network.coerceAddress(newAddress), 
        network.coerceAddress(ownerAddress),
        network.coerceAddress(paymentAddress), true, 
        numOwnerUTXOs + numPaymentUTXOs - 1);
    });

  let zfh: string;
  if (!!zonefile) {
    const sha256 = bitcoin.crypto.sha256(new Buffer(zonefile));
    zfh = (new RIPEMD160()).update(sha256).digest('hex');
  } else if (!!zonefileHash || blankZonefileHash) {
    // already have the hash 
    zfh = zonefileHash;
  } else {
    zfh = await getLastZonefileHash(network, name);
  }

  const txPromise = blockstack.transactions.makeRenewal(
    name, newAddress, ownerKey, paymentKey, zonefile, zfh, !hasKeys(ownerKey) || !hasKeys(paymentKey));

  if (estimateOnly) {
    return estimatePromise
      .then((cost: number) => String(cost));
  }
 
  if (!safetyChecks) {
    if (txOnly) {
      return txPromise;
    }
    else {
      return txPromise
        .then((tx : string) => {
          return network.broadcastTransaction(tx);
        });
    }
  }

  const paymentBalancePromise = paymentUTXOsPromise.then((utxos) => {
    return sumUTXOs(utxos);
  });

  const canReceiveNamePromise = Promise.resolve().then(() => {
    if (newAddress) {
      return blockstack.safety.addressCanReceiveName(network.coerceAddress(newAddress));
    }
    else {
      return true;
    }
  });

  const safetyChecksPromise = Promise.all([
    blockstack.safety.isNameValid(name),
    blockstack.safety.ownsName(name, network.coerceAddress(ownerAddress)),
    network.getNamespaceBurnAddress(namespaceID, true, receiveFeesPeriod),
    network.getNamespaceBurnAddress(namespaceID, false, receiveFeesPeriod),
    canReceiveNamePromise,
    network.getNamePrice(name),
    network.getAccountBalance(paymentAddress, 'STACKS'),
    estimatePromise,
    paymentBalancePromise
  ])
    .then(([isNameValid, ownsName, givenNSBurnAddr, trueNSBurnAddr, 
      addressCanReceiveName, nameCost, 
      accountBalance, estimateCost, paymentBalance]) => {
      if (isNameValid && ownsName && addressCanReceiveName && 
          trueNSBurnAddr === givenNSBurnAddr &&
          (nameCost.units === 'BTC' || (nameCost.units == 'STACKS' &&
           nameCost.amount.cmp(accountBalance) <= 0)) &&
          estimateCost < paymentBalance) {
        return {'status': true};
      }
      else {
        return {
          'status': false,
          'error': 'Name cannot be safely renewed',
          'isNameValid': isNameValid,
          'ownsName': ownsName,
          'addressCanReceiveName': addressCanReceiveName,
          'estimateCostBTC': estimateCost,
          'nameCostUnits': nameCost.units,
          'nameCostAmount': nameCost.amount.toString(),
          'paymentBalanceBTC': paymentBalance,
          'paymentBalanceStacks': accountBalance.toString(),
          'namespaceBurnAddress': givenNSBurnAddr,
          'trueNamespaceBurnAddress': trueNSBurnAddr
        };
      }
    });

  return safetyChecksPromise
    .then((safetyChecksResult) => {
      if (!safetyChecksResult.status) {
        return new Promise((resolve) => resolve(JSONStringify(safetyChecksResult, true)));
      }

      if (txOnly) {
        return txPromise;
      }

      return txPromise.then((tx : string) => {
        return network.broadcastTransaction(tx);
      })
        .then((txidHex : string) => {
          return txidHex;
        });
    });
}

/*
 * Generate and optionally send a name-revoke
 * args:
 * @name (string) the name to revoke
 * @ownerKey (string) the owner private key
 * @paymentKey (string) the payment private key
 */
function revoke(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  const ownerKey = decodePrivateKey(args[1]);
  const paymentKey = decodePrivateKey(args[2]);
  const paymentAddress = getPrivateKeyAddress(network, paymentKey);
  const ownerAddress = getPrivateKeyAddress(network, ownerKey);

  const ownerUTXOsPromise = network.getUTXOs(ownerAddress);
  const paymentUTXOsPromise = network.getUTXOs(paymentAddress);

  const estimatePromise = Promise.all([
    ownerUTXOsPromise, paymentUTXOsPromise])
    .then(([ownerUTXOs, paymentUTXOs]) => {
      const numOwnerUTXOs = ownerUTXOs.length;
      const numPaymentUTXOs = paymentUTXOs.length;
      return blockstack.transactions.estimateRevoke(
        name, network.coerceAddress(ownerAddress),
        network.coerceAddress(paymentAddress),
        numOwnerUTXOs + numPaymentUTXOs - 1);
    });

  const txPromise =  blockstack.transactions.makeRevoke(
    name, ownerKey, paymentKey, !hasKeys(ownerKey) || !hasKeys(paymentKey));

  if (estimateOnly) {
    return estimatePromise
      .then((cost: number) => String(cost));
  }
 
  if (!safetyChecks) {
    if (txOnly) {
      return txPromise;
    }
    else {
      return txPromise
        .then((tx) => {
          return network.broadcastTransaction(tx);
        });
    }
  }

  const paymentBalancePromise = paymentUTXOsPromise.then((utxos : UTXO[]) => {
    return sumUTXOs(utxos);
  });
 
  const safetyChecksPromise = Promise.all([
    blockstack.safety.isNameValid(name),
    blockstack.safety.ownsName(name, network.coerceAddress(ownerAddress)),
    blockstack.safety.isInGracePeriod(name),
    estimatePromise,
    paymentBalancePromise
  ])
    .then(([isNameValid, ownsName, isInGracePeriod, estimateCost, paymentBalance]) => {
      if (isNameValid && ownsName && !isInGracePeriod && estimateCost < paymentBalance) {
        return {'status': true};
      }
      else {
        return {
          'status': false,
          'error': 'Name cannot be safely revoked',
          'isNameValid': isNameValid,
          'ownsName': ownsName,
          'isInGracePeriod': isInGracePeriod,
          'estimateCostBTC': estimateCost,
          'paymentBalanceBTC': paymentBalance
        };
      }
    });

  return safetyChecksPromise
    .then((safetyChecksResult) => {
      if (!safetyChecksResult.status) {
        return new Promise((resolve : any) => resolve(JSONStringify(safetyChecksResult, true)));
      }

      if (txOnly) {
        return txPromise;
      }

      return txPromise.then((tx : string) => {
        return network.broadcastTransaction(tx);
      })
        .then((txidHex : string) => {
          return txidHex;
        });
    });
}

/*
 * Generate and optionally send a namespace-preorder
 * args:
 * @namespace (string) the namespace to preorder
 * @address (string) the address to reveal the namespace
 * @paymentKey (string) the payment private key
 */
function namespacePreorder(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const namespaceID = args[0];
  const address = args[1];
  const paymentKey = decodePrivateKey(args[2]);
  const paymentAddress = getPrivateKeyAddress(network, paymentKey);

  const txPromise = blockstack.transactions.makeNamespacePreorder(
    namespaceID, address, paymentKey, !hasKeys(paymentKey));

  const paymentUTXOsPromise = network.getUTXOs(paymentAddress);

  const estimatePromise = paymentUTXOsPromise.then((utxos : UTXO[]) => {
    const numUTXOs = utxos.length;
    return blockstack.transactions.estimateNamespacePreorder(
      namespaceID, network.coerceAddress(address), 
      network.coerceAddress(paymentAddress), numUTXOs);
  });

  if (estimateOnly) {
    return estimatePromise
      .then((cost: number) => String(cost));
  }
  
  if (!safetyChecks) {
    if (txOnly) {
      return txPromise;
    }
    else {
      return txPromise
        .then((tx : string) => {
          return network.broadcastTransaction(tx);
        });
    }
  }

  const paymentBalance = paymentUTXOsPromise.then((utxos : UTXO[]) => {
    return sumUTXOs(utxos);
  });

  const safetyChecksPromise = Promise.all([
    blockstack.safety.isNamespaceValid(namespaceID),
    blockstack.safety.isNamespaceAvailable(namespaceID),
    network.getNamespacePrice(namespaceID),
    network.getAccountBalance(paymentAddress, 'STACKS'),
    paymentBalance,
    estimatePromise
  ])
    .then(([isNamespaceValid, isNamespaceAvailable, namespacePrice,
      STACKSBalance, paymentBalance, estimate]) => {
      if (isNamespaceValid && isNamespaceAvailable && 
          (namespacePrice.units === 'BTC' || 
            (namespacePrice.units === 'STACKS' && 
             namespacePrice.amount.cmp(STACKSBalance) <= 0)) &&
          paymentBalance >= estimate) {
        return {'status': true};
      }
      else {
        return {
          'status': false,
          'error': 'Namespace cannot be safely preordered',
          'isNamespaceValid': isNamespaceValid,
          'isNamespaceAvailable': isNamespaceAvailable,
          'paymentBalanceBTC': paymentBalance,
          'paymentBalanceStacks': STACKSBalance.toString(),
          'namespaceCostUnits': namespacePrice.units,
          'namespaceCostAmount': namespacePrice.amount.toString(),
          'estimateCostBTC': estimate
        };
      }
    });

  return safetyChecksPromise
    .then((safetyChecksResult : any) => {
      if (!safetyChecksResult.status) {
        return new Promise((resolve : any) => resolve(JSONStringify(safetyChecksResult)));
      }

      if (txOnly) {
        return txPromise;
      }

      return txPromise.then((tx : string) => {
        return network.broadcastTransaction(tx);
      })
        .then((txidHex : string) => {
          return txidHex;
        });
    });
}

/*
 * Generate and optionally send a namespace-reveal
 * args:
 * @name (string) the namespace to reveal
 * @revealAddr (string) the reveal address
 * @version (int) the namespace version bits
 * @lifetime (int) the name lifetime
 * @coeff (int) the multiplicative price coefficient
 * @base (int) the price base
 * @bucketString (string) the serialized bucket exponents
 * @nonalphaDiscount (int) the non-alpha price discount
 * @noVowelDiscount (int) the no-vowel price discount
 * @paymentKey (string) the payment private key
 */
function namespaceReveal(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const namespaceID = args[0];
  const revealAddr = args[1];
  const version = parseInt(args[2]);
  let lifetime = parseInt(args[3]);
  const coeff = parseInt(args[4]);
  const base = parseInt(args[5]);
  const bucketString = args[6];
  const nonalphaDiscount = parseInt(args[7]);
  const noVowelDiscount = parseInt(args[8]);
  const paymentKey = decodePrivateKey(args[9]);

  const buckets = bucketString.split(',')
    .map((x) => {return parseInt(x);});

  if (lifetime < 0) {
    lifetime = 2**32 - 1;
  }

  if (nonalphaDiscount === 0) {
    throw new Error('Cannot have a 0 non-alpha discount (pass 1 for no discount)');
  }

  if (noVowelDiscount === 0) {
    throw new Error('Cannot have a 0 no-vowel discount (pass 1 for no discount)');
  }

  const namespace = new blockstack.transactions.BlockstackNamespace(namespaceID);

  namespace.setVersion(version);
  namespace.setLifetime(lifetime);
  namespace.setCoeff(coeff);
  namespace.setBase(base);
  namespace.setBuckets(buckets);
  namespace.setNonalphaDiscount(nonalphaDiscount);
  namespace.setNoVowelDiscount(noVowelDiscount);

  const paymentAddress = getPrivateKeyAddress(network, paymentKey);
  const paymentUTXOsPromise = network.getUTXOs(paymentAddress);

  const estimatePromise = paymentUTXOsPromise.then((utxos : UTXO[]) => {
    const numUTXOs = utxos.length;
    return blockstack.transactions.estimateNamespaceReveal(
      namespace, network.coerceAddress(revealAddr),
      network.coerceAddress(paymentAddress), numUTXOs);
  });

  const txPromise = blockstack.transactions.makeNamespaceReveal(
    namespace, revealAddr, paymentKey, !hasKeys(paymentKey));

  if (estimateOnly) {
    return estimatePromise
      .then((cost: number) => String(cost));
  }
 
  if (!safetyChecks) {
    if (txOnly) {
      return txPromise;
    }
    else {
      return txPromise
        .then((tx : string) => {
          return network.broadcastTransaction(tx);
        });
    }
  }

  const paymentBalancePromise = paymentUTXOsPromise.then((utxos : UTXO[]) => {
    return sumUTXOs(utxos);
  });
 
  const safetyChecksPromise = Promise.all([
    blockstack.safety.isNamespaceValid(namespaceID),
    blockstack.safety.isNamespaceAvailable(namespaceID),
    paymentBalancePromise,
    estimatePromise
  ])
    .then(([isNamespaceValid, isNamespaceAvailable,
      paymentBalance, estimate]) => {

      if (isNamespaceValid && isNamespaceAvailable && 
          paymentBalance >= estimate) {
        return {'status': true};
      }
      else {
        return {
          'status': false,
          'error': 'Namespace cannot be safely revealed',
          'isNamespaceValid': isNamespaceValid,
          'isNamespaceAvailable': isNamespaceAvailable,
          'paymentBalanceBTC': paymentBalance,
          'estimateCostBTC': estimate
        };
      }
    });
  
  return safetyChecksPromise
    .then((safetyChecksResult : any) => {
      if (!safetyChecksResult.status) {
        return new Promise((resolve : any) => resolve(JSONStringify(safetyChecksResult, true)));
      }

      if (txOnly) {
        return txPromise;
      }

      return txPromise.then((tx : string) => {
        return network.broadcastTransaction(tx);
      })
        .then((txidHex : string) => {
          return txidHex;
        });
    });
}

/*
 * Generate and optionally send a namespace-ready
 * args:
 * @namespaceID (string) the namespace ID
 * @revealKey (string) the hex-encoded reveal key
 */
function namespaceReady(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const namespaceID = args[0];
  const revealKey = decodePrivateKey(args[1]);
  const revealAddress = getPrivateKeyAddress(network, revealKey);

  const txPromise = blockstack.transactions.makeNamespaceReady(
    namespaceID, revealKey, !hasKeys(revealKey));

  const revealUTXOsPromise = network.getUTXOs(revealAddress);

  const estimatePromise = revealUTXOsPromise.then((utxos) => {
    const numUTXOs = utxos.length;
    return blockstack.transactions.estimateNamespaceReady(
      namespaceID, numUTXOs);
  });

  if (estimateOnly) {
    return estimatePromise
      .then((cost: number) => String(cost));
  }
  
  if (!safetyChecks) {
    if (txOnly) {
      return txPromise;
    }
    else {
      return txPromise
        .then((tx : string) => {
          return network.broadcastTransaction(tx);
        });
    }
  }

  const revealBalancePromise = revealUTXOsPromise.then((utxos : UTXO[]) => {
    return sumUTXOs(utxos);
  });

  const safetyChecksPromise = Promise.all([
    blockstack.safety.isNamespaceValid(namespaceID),
    blockstack.safety.namespaceIsReady(namespaceID),
    blockstack.safety.revealedNamespace(namespaceID, revealAddress),
    revealBalancePromise,
    estimatePromise
  ])
    .then(([isNamespaceValid, isNamespaceReady, isRevealer,
      revealerBalance, estimate]) => {
      if (isNamespaceValid && !isNamespaceReady && isRevealer &&
          revealerBalance >= estimate) {
        return {'status': true};
      }
      else {
        return {
          'status': false,
          'error': 'Namespace cannot be safely launched',
          'isNamespaceValid': isNamespaceValid,
          'isNamespaceReady': isNamespaceReady,
          'isPrivateKeyRevealer': isRevealer,
          'revealerBalanceBTC': revealerBalance,
          'estimateCostBTC': estimate
        };
      }
    });

  return safetyChecksPromise
    .then((safetyChecksResult : any) => {
      if (!safetyChecksResult.status) {
        return new Promise((resolve : any) => resolve(JSONStringify(safetyChecksResult, true)));
      }

      if (txOnly) {
        return txPromise;
      }

      return txPromise.then((tx : string) => {
        return network.broadcastTransaction(tx);
      })
        .then((txidHex : string) => {
          return txidHex;
        });
    });
}


/*
 * Generate and send a name-import transaction
 * @name (string) the name to import
 * @IDrecipientAddr (string) the recipient of the name
 * @gaiaHubURL (string) the URL to the name's gaia hub
 * @importKey (string) the key to pay for the import
 * @zonefile (string) OPTIONAL: the path to the zone file to use (supercedes gaiaHubUrl)
 * @zonefileHash (string) OPTIONAL: the hash of the zone file (supercedes gaiaHubUrl and zonefile)
 */
function nameImport(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  const IDrecipientAddr = args[1];
  const gaiaHubUrl = args[2];
  const importKey = decodePrivateKey(args[3]);
  const zonefilePath = args[4];
  let zonefileHash = args[5];
  let zonefile  = '';

  if (safetyChecks && (typeof importKey !== 'string')) {
    // multisig import not supported, unless we're testing 
    throw new Error('Invalid argument: multisig is not supported at this time');
  }

  if (!IDrecipientAddr.startsWith('ID-')) {
    throw new Error('Recipient ID-address must start with ID-');
  }

  const recipientAddr = IDrecipientAddr.slice(3);

  if (zonefilePath && !zonefileHash) {
    zonefile = fs.readFileSync(zonefilePath).toString();
  }

  else if (!zonefileHash && !zonefilePath) {
    // make zone file and hash from gaia hub url
    const mainnetAddress = network.coerceMainnetAddress(recipientAddr);
    const profileUrl = `${gaiaHubUrl}/${mainnetAddress}/profile.json`;
    try {
      checkUrl(profileUrl);
    }
    catch(e) {
      return Promise.resolve().then(() => JSONStringify({
        'status': false,
        'error': e.message,
        'hints': [
          'Make sure the Gaia hub URL does not have any trailing /\'s',
          'Make sure the Gaia hub URL scheme is present and well-formed'
        ]
      }, true));
    }

    zonefile = blockstack.makeProfileZoneFile(name, profileUrl);
    zonefileHash = hash160(Buffer.from(zonefile)).toString('hex');
  }

  const namespaceID = name.split('.').slice(-1)[0];
  const importAddress = getPrivateKeyAddress(network, importKey);

  const txPromise = blockstack.transactions.makeNameImport(
    name, recipientAddr, zonefileHash, importKey, !hasKeys(importKey));

  const importUTXOsPromise = network.getUTXOs(importAddress);

  const estimatePromise = importUTXOsPromise.then((utxos : UTXO[]) => {
    const numUTXOs = utxos.length;
    return blockstack.transactions.estimateNameImport(
      name, recipientAddr, zonefileHash, numUTXOs);
  });

  if (estimateOnly) {
    return estimatePromise
      .then((cost: number) => String(cost));
  }
 
  if (!safetyChecks) {
    if (txOnly) {
      return txPromise;
    }
    else {
      return txPromise
        .then((tx : string) => {
          return broadcastTransactionAndZoneFile(network, tx, zonefile);
        })
        .then((resp : any) => {
          if (resp.status && resp.hasOwnProperty('txid')) {
            // just return txid 
            return resp.txid;
          }
          else {
            // some error 
            return JSONStringify(resp, true);
          }
        });
    }
  }

  const importBalancePromise = importUTXOsPromise.then((utxos) => {
    return sumUTXOs(utxos);
  });

  const safetyChecksPromise = Promise.all([
    blockstack.safety.namespaceIsReady(namespaceID),
    blockstack.safety.namespaceIsRevealed(namespaceID),
    blockstack.safety.addressCanReceiveName(recipientAddr),
    importBalancePromise,
    estimatePromise
  ])
    .then(([isNamespaceReady, isNamespaceRevealed, addressCanReceive,
      importBalance, estimate]) => {
      if (!isNamespaceReady && isNamespaceRevealed && addressCanReceive &&
          importBalance >= estimate) {
        return {'status': true};
      }
      else {
        return {
          'status': false,
          'error': 'Name cannot be safetly imported',
          'isNamespaceReady': isNamespaceReady,
          'isNamespaceRevealed': isNamespaceRevealed,
          'addressCanReceiveName': addressCanReceive,
          'importBalanceBTC': importBalance,
          'estimateCostBTC': estimate
        };
      }
    });

  return safetyChecksPromise
    .then((safetyChecksResult : any) => {
      if (!safetyChecksResult.status) {
        return new Promise((resolve : any) => resolve(JSONStringify(safetyChecksResult, true)));
      }

      if (txOnly) {
        return txPromise;
      }

      return txPromise
        .then((tx : string) => {
          return broadcastTransactionAndZoneFile(network, tx, zonefile);
        })
        .then((resp : any) => {
          if (resp.status && resp.hasOwnProperty('txid')) {
            // just return txid 
            return resp.txid;
          }
          else {
            // some error 
            return JSONStringify(resp, true);
          }
        });
    });
}


/*
 * Announce a message to subscribed peers by means of an Atlas zone file
 * @messageHash (string) the hash of the already-sent message
 * @senderKey (string) the key that owns the name that the peers have subscribed to
 */
function announce(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const messageHash = args[0];
  const senderKey = decodePrivateKey(args[1]);

  const senderAddress = getPrivateKeyAddress(network, senderKey);

  const txPromise = blockstack.transactions.makeAnnounce(
    messageHash, senderKey, !hasKeys(senderKey));

  const senderUTXOsPromise = network.getUTXOs(senderAddress);

  const estimatePromise = senderUTXOsPromise.then((utxos : UTXO[]) => {
    const numUTXOs = utxos.length;
    return blockstack.transactions.estimateAnnounce(messageHash, numUTXOs);
  });

  if (estimateOnly) {
    return estimatePromise
      .then((cost: number) => String(cost));
  }
  
  if (!safetyChecks) {
    if (txOnly) {
      return txPromise;
    }
    else {
      return txPromise
        .then((tx) => {
          return network.broadcastTransaction(tx);
        });
    }
  }

  const senderBalancePromise = senderUTXOsPromise.then((utxos : UTXO[]) => {
    return sumUTXOs(utxos);
  });

  const safetyChecksPromise = Promise.all(
    [senderBalancePromise, estimatePromise])
    .then(([senderBalance, estimate]) => {
      if (senderBalance >= estimate) {
        return {'status': true};
      }
      else {
        return {
          'status': false,
          'error': 'Announcement cannot be safely sent',
          'senderBalanceBTC': senderBalance,
          'estimateCostBTC': estimate
        };
      }
    });

  return safetyChecksPromise
    .then((safetyChecksResult : any) => {
      if (!safetyChecksResult.status) {
        return new Promise((resolve : any) => resolve(JSONStringify(safetyChecksResult, true)));
      }

      if (txOnly) {
        return txPromise;
      }

      return txPromise.then((tx : string) => {
        return network.broadcastTransaction(tx);
      })
        .then((txidHex : string) => {
          return txidHex;
        });
    });
}


/*
 * Register a name the easy way.  Send the preorder
 * and register transactions to the broadcaster, as 
 * well as the zone file.  Also create and replicate
 * the profile to the Gaia hub.
 * @arg name (string) the name to register
 * @arg ownerKey (string) the hex-encoded owner private key (must be singlesig)
 * @arg paymentKey (string) the hex-encoded payment key to purchase this name
 * @arg gaiaHubUrl (string) the write endpoint of the gaia hub URL to use
 * @arg zonefile (string) OPTIONAL the path to the zone file to give this name.
 *  supercedes gaiaHubUrl
 */
function register(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  const ownerKey = args[1];
  const paymentKey = decodePrivateKey(args[2]);
  const gaiaHubUrl = args[3];

  const address = getPrivateKeyAddress(network, ownerKey);
  const emptyProfile : any = {type: '@Person', account: []};

  let zonefilePromise : Promise<string>;

  if (args.length > 4 && !!args[4]) {
    const zonefilePath = args[4];
    zonefilePromise = Promise.resolve().then(() => fs.readFileSync(zonefilePath).toString());
  }
  else {
    // generate one
    zonefilePromise = makeZoneFileFromGaiaUrl(network, name, gaiaHubUrl, ownerKey);
  }

  let preorderTx = '';
  let registerTx = '';
  let broadcastResult : any = null;
  let zonefile  = '';

  return zonefilePromise.then((zf : string) => {
    zonefile = zf;

    // carry out safety checks for preorder and register
    const preorderSafetyCheckPromise = txPreorder(
      network, [name, `ID-${address}`, args[2]], true);

    const registerSafetyCheckPromise = txRegister(
      network, [name, `ID-${address}`, args[2], zf], true);

    return Promise.all([preorderSafetyCheckPromise, registerSafetyCheckPromise]);
  })
    .then(([preorderSafetyChecks, registerSafetyChecks]) => {
      if (!checkTxStatus(preorderSafetyChecks) || !checkTxStatus(registerSafetyChecks)) {
        try {
          preorderSafetyChecks = JSON.parse(preorderSafetyChecks);
        }
        catch (e) {
        }

        try {
          registerSafetyChecks = JSON.parse(registerSafetyChecks);
        }
        catch (e) {
        }

        // one or both safety checks failed 
        throw new SafetyError({
          'status': false,
          'error': 'Failed to generate one or more transactions',
          'preorderSafetyChecks': preorderSafetyChecks,
          'registerSafetyChecks': registerSafetyChecks
        });
      }

      // will have only gotten back the raw tx (which we'll discard anyway,
      // since we have to use the right UTXOs)
      return blockstack.transactions.makePreorder(name, address, paymentKey, !hasKeys(paymentKey));
    })
    .then((rawTx : string) => {
      preorderTx = rawTx;
      return rawTx;
    })
    .then((rawTx : string) => {
    // make it so that when we generate the NAME_REGISTRATION operation,
    // we consume the change output from the NAME_PREORDER.
      network.modifyUTXOSetFrom(rawTx);
      return rawTx;
    })
    .then(() => {
    // now we can make the NAME_REGISTRATION 
      return blockstack.transactions.makeRegister(name, address, paymentKey, zonefile, null, !hasKeys(paymentKey));
    })
    .then((rawTx : string) => {
      registerTx = rawTx;
      return rawTx;
    })
    .then((rawTx : string) => {
    // make sure we don't double-spend the NAME_REGISTRATION before it is broadcasted
      network.modifyUTXOSetFrom(rawTx);
    })
    .then(() => {
      if (txOnly) {
        return Promise.resolve().then(() => { 
          const txData = {
            preorder: preorderTx,
            register: registerTx,
            zonefile: zonefile
          };
          return txData;   
        });
      }
      else {
        return network.broadcastNameRegistration(preorderTx, registerTx, zonefile);
      }
    })
    .then((txResult : any) => {
    // sign and upload profile
      broadcastResult = txResult;
      const signedProfileData = makeProfileJWT(emptyProfile, ownerKey);
      return gaiaUploadProfileAll(
        network, [gaiaHubUrl], signedProfileData, ownerKey);
    })
    .then((gaiaUrls) => {
      if (gaiaUrls.hasOwnProperty('error')) {
        return JSONStringify({
          'profileUrls': gaiaUrls,
          'txInfo': broadcastResult
        }, true);
      }
      return JSONStringify({
        'profileUrls': gaiaUrls.dataUrls, 
        'txInfo': broadcastResult
      });
    })
    .catch((e : Error) => {
      if (e.hasOwnProperty('safetyErrors')) {
      // safety error; return as JSON 
        return e.message;
      }
      else {
        throw e;
      }
    });
}

/*
 * Register a name the easy way to an ID-address.  Send the preorder
 * and register transactions to the broadcaster, as 
 * well as the zone file.
 * @arg name (string) the name to register
 * @arg ownerAddress (string) the ID-address of the owner
 * @arg paymentKey (string) the hex-encoded payment key to purchase this name
 * @arg gaiaHubUrl (string) the gaia hub URL to use
 * @arg zonefile (string) OPTIONAL the path to the zone file to give this name.
 *  supercedes gaiaHubUrl
 */
function registerAddr(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  const IDaddress = args[1];
  const paymentKey = decodePrivateKey(args[2]);
  const gaiaHubUrl = args[3];

  const address = IDaddress.slice(3);
  const mainnetAddress = network.coerceMainnetAddress(address);

  let zonefile = '';
  if (args.length > 4 && !!args[4]) {
    const zonefilePath = args[4];
    zonefile = fs.readFileSync(zonefilePath).toString();
  }
  else {
    // generate one 
    const profileUrl = `${gaiaHubUrl.replace(/\/+$/g, '')}/${mainnetAddress}/profile.json`;
    try {
      checkUrl(profileUrl);
    }
    catch(e) {
      return Promise.resolve().then(() => JSONStringify({
        'status': false,
        'error': e.message,
        'hints': [
          'Make sure the Gaia hub URL does not have any trailing /\'s',
          'Make sure the Gaia hub URL scheme is present and well-formed'
        ]
      }));
    }

    zonefile = blockstack.makeProfileZoneFile(name, profileUrl);
  }

  let preorderTx = '';
  let registerTx = '';

  // carry out safety checks for preorder and register 
  const preorderSafetyCheckPromise = txPreorder(
    network, [name, `ID-${address}`, args[2]], true);

  const registerSafetyCheckPromise = txRegister(
    network, [name, `ID-${address}`, args[2], zonefile], true);

  return Promise.all([preorderSafetyCheckPromise, registerSafetyCheckPromise])
    .then(([preorderSafetyChecks, registerSafetyChecks]) => {
      if (!checkTxStatus(preorderSafetyChecks) || !checkTxStatus(registerSafetyChecks)) {
        // one or both safety checks failed 
        throw new SafetyError({
          'status': false,
          'error': 'Failed to generate one or more transactions',
          'preorderSafetyChecks': preorderSafetyChecks,
          'registerSafetyChecks': registerSafetyChecks
        });
      }

      // will have only gotten back the raw tx (which we'll discard anyway,
      // since we have to use the right UTXOs)
      return blockstack.transactions.makePreorder(name, address, paymentKey, !hasKeys(paymentKey));
    })
    .then((rawTx : string) => {
      preorderTx = rawTx;
      return rawTx;
    })
    .then((rawTx : string) => {
      // make it so that when we generate the NAME_REGISTRATION operation,
      // we consume the change output from the NAME_PREORDER.
      network.modifyUTXOSetFrom(rawTx);
      return rawTx;
    })
    .then(() => {
      // now we can make the NAME_REGISTRATION 
      return blockstack.transactions.makeRegister(name, address, paymentKey, zonefile, null, !hasKeys(paymentKey));
    })
    .then((rawTx : string) => {
      registerTx = rawTx;
      return rawTx;
    })
    .then((rawTx : string) => {
      // make sure we don't double-spend the NAME_REGISTRATION before it is broadcasted
      network.modifyUTXOSetFrom(rawTx);
    })
    .then(() => {
      if (txOnly) {
        return Promise.resolve().then(() => { 
          const txData = {
            preorder: preorderTx,
            register: registerTx,
            zonefile: zonefile
          };
          return txData;   
        });
      }
      else {
        return network.broadcastNameRegistration(preorderTx, registerTx, zonefile);
      }
    })
    .then((txResult : any) => {
      // succcess! 
      return JSONStringify({
        'txInfo': txResult
      });
    })
    .catch((e : Error) => {
      if (e.hasOwnProperty('safetyErrors')) {
        // safety error; return as JSON 
        return e.message;
      }
      else {
        throw e;
      }
    });
}


/*
 * Register a subdomain name the easy way.  Send the
 * zone file and signed subdomain records to the subdomain registrar.
 * @arg name (string) the name to register
 * @arg ownerKey (string) the hex-encoded owner private key (must be single-sig)
 * @arg gaiaHubUrl (string) the write endpoint of the gaia hub URL to use
 * @arg registrarUrl (string) OPTIONAL the registrar URL
 * @arg zonefile (string) OPTIONAL the path to the zone file to give this name.
 *  supercedes gaiaHubUrl
 */
function registerSubdomain(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const name = args[0];
  const ownerKey = decodePrivateKey(args[1]);
  const gaiaHubUrl = args[2];
  const registrarUrl = args[3];

  const address = getPrivateKeyAddress(network, ownerKey);
  const mainnetAddress = network.coerceMainnetAddress(address);
  const emptyProfile : any = {type: '@Person', account: []};
  const onChainName = name.split('.').slice(-2).join('.');
  const subName = name.split('.')[0];

  let zonefilePromise : Promise<string>;
   
  if (args.length > 4 && !!args[4]) {
    const zonefilePath = args[4];
    zonefilePromise = Promise.resolve().then(() => fs.readFileSync(zonefilePath).toString());
  }
  else {
    // generate one 
    zonefilePromise = makeZoneFileFromGaiaUrl(network, name, gaiaHubUrl, args[1]);
  }

  const api_key = process.env.API_KEY || null;

  const onChainNamePromise = getNameInfoEasy(network, onChainName);
  const registrarStatusPromise = fetch(`${registrarUrl}/index`)
    .then((resp : any) => resp.json());

  const profileUploadPromise = Promise.resolve().then(() => {
    // sign and upload profile
    const signedProfileData = makeProfileJWT(emptyProfile, args[1]);
    return gaiaUploadProfileAll(
      network, [gaiaHubUrl], signedProfileData, args[1]);
  })
    .then((gaiaUrls : {dataUrls?: string[], error?: string}) => {
      if (!!gaiaUrls.error) {
        return { profileUrls: null, error: gaiaUrls.error };
      }
      else {
        return { profileUrls: gaiaUrls.dataUrls };
      }
    });

  let safetyChecksPromise = null;
  if (safetyChecks) {
    safetyChecksPromise = Promise.all([
      onChainNamePromise,
      blockstack.safety.isNameAvailable(name),
      registrarStatusPromise
    ])
      .then(([onChainNameInfo, isNameAvailable, registrarStatus]) => {
        if (safetyChecks) {
          const registrarName =
            (!!registrarStatus && registrarStatus.hasOwnProperty('domainName')) ?
              registrarStatus.domainName :
              '<unknown>';

          if (!onChainNameInfo || !isNameAvailable || 
              (registrarName !== '<unknown>' && registrarName !== onChainName)) {
            return {
              'status': false,
              'error': 'Subdomain cannot be safely registered',
              'onChainNameInfo': onChainNameInfo,
              'isNameAvailable': isNameAvailable,
              'onChainName': onChainName,
              'registrarName': registrarName
            };
          }
        }
        return { 'status': true };
      });
  }
  else {
    safetyChecksPromise = Promise.resolve().then(() => {
      return {
        'status': true
      };
    });
  }

  return Promise.all([safetyChecksPromise, zonefilePromise])
    .then(([safetyChecks, zonefile] : [any, string]) => {
      if (safetyChecks.status) {
        const request = {
          'zonefile': zonefile,
          'name': subName,
          'owner_address': mainnetAddress
        };

        const options = {
          method: 'POST',
          headers: {
            'Content-type': 'application/json',
            'Authorization': ''
          },
          body: JSON.stringify(request)
        };

        if (!!api_key) {
          options.headers.Authorization = `bearer ${api_key}`;
        }

        const registerPromise = fetch(`${registrarUrl}/register`, options)
          .then(resp => resp.json());

        return Promise.all([registerPromise, profileUploadPromise])
          .then(([registerInfo, profileUploadInfo] : [any, any]) => {
            if (!profileUploadInfo.error) {
              return JSONStringify({
                'txInfo': registerInfo,
                'profileUrls': profileUploadInfo.profileUrls
              });
            }
            else {
              return JSONStringify({
                'error': profileUploadInfo.error
              }, true);
            }
          });
      }
      else {
        return Promise.resolve().then(() => JSONStringify(safetyChecks, true));
      }
    });
}

/*
 * Sign a profile.
 * @path (string) path to the profile
 * @privateKey (string) the owner key (must be single-sig)
 */
function profileSign(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const profilePath = args[0];
  const profileData = JSON.parse(fs.readFileSync(profilePath).toString());
  return Promise.resolve().then(() => makeProfileJWT(profileData, args[1]));
}

/*
 * Verify a profile with an address or public key
 * @path (string) path to the profile
 * @publicKeyOrAddress (string) public key or address
 */
function profileVerify(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const profilePath = args[0];
  let publicKeyOrAddress = args[1];

  // need to coerce mainnet 
  if (publicKeyOrAddress.match(ID_ADDRESS_PATTERN)) {
    publicKeyOrAddress = network.coerceMainnetAddress(publicKeyOrAddress.slice(3));
  }
  
  const profileString = fs.readFileSync(profilePath).toString();
  
  return Promise.resolve().then(() => {
    let profileToken = null;
    
    try {
      const profileTokens = JSON.parse(profileString);
      profileToken = profileTokens[0].token;
    }
    catch (e) {
      // might be a raw token 
      profileToken = profileString;
    }

    if (!profileToken) {
      throw new Error(`Data at ${profilePath} does not appear to be a signed profile`);
    }
   
    const profile = blockstack.extractProfile(profileToken, publicKeyOrAddress);
    return JSONStringify(profile);
  });
}


/*
 * Store a signed profile for a name or an address.
 * * verify that the profile was signed by the name's owner address
 * * verify that the private key matches the name's owner address
 *
 * Assumes that the URI records are all Gaia hubs
 *
 * @nameOrAddress (string) name or address that owns the profile
 * @path (string) path to the signed profile token
 * @privateKey (string) owner private key for the name
 * @gaiaUrl (string) this is the write endpoint of the Gaia hub to use
 */
function profileStore(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const nameOrAddress = args[0];
  const signedProfilePath = args[1];
  const privateKey = decodePrivateKey(args[2]);
  const gaiaHubUrl = args[3];

  const signedProfileData = fs.readFileSync(signedProfilePath).toString();

  const ownerAddress = getPrivateKeyAddress(network, privateKey);
  const ownerAddressMainnet = network.coerceMainnetAddress(ownerAddress);

  let nameInfoPromise : Promise<{address: string}>;
  let name  = '';

  if (nameOrAddress.startsWith('ID-')) {
    // ID-address
    nameInfoPromise = Promise.resolve().then(() => {
      return {
        'address': nameOrAddress.slice(3)
      };
    });
  }
  else {
    // name; find the address 
    nameInfoPromise = getNameInfoEasy(network, nameOrAddress);
    name = nameOrAddress;
  }
  
  const verifyProfilePromise = profileVerify(network, 
    [signedProfilePath, `ID-${ownerAddressMainnet}`]);
   
  return Promise.all([nameInfoPromise, verifyProfilePromise])
    .then(([nameInfo, _verifiedProfile] : [NameInfoType, any]) => {
      if (safetyChecks && (!nameInfo ||
          network.coerceAddress(nameInfo.address) !== network.coerceAddress(ownerAddress))) {
        throw new Error('Name owner address either could not be found, or does not match ' +
          `private key address ${ownerAddress}`);
      }
      return gaiaUploadProfileAll(
        network, [gaiaHubUrl], signedProfileData, args[2], name);
    })
    .then((gaiaUrls : {dataUrls?: string[], error?: string}) => {
      if (gaiaUrls.hasOwnProperty('error')) {
        return JSONStringify(gaiaUrls, true);
      }
      else {
        return JSONStringify({'profileUrls': gaiaUrls.dataUrls});
      }
    });
}

/*
 * Push a zonefile to the Atlas network
 * @zonefileDataOrPath (string) the zonefile data to push, or the path to the data
 */
function zonefilePush(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const zonefileDataOrPath = args[0];
  let zonefileData = null;

  try {
    zonefileData = fs.readFileSync(zonefileDataOrPath).toString();
  } catch(e) {
    zonefileData = zonefileDataOrPath;
  }

  return network.broadcastZoneFile(zonefileData)
    .then((result : any) => {
      return JSONStringify(result);
    });
}

/*
 * Get the app private key(s) from a backup phrase and an ID-address
 * args:
 * @mnemonic (string) the 12-word phrase
 * @nameOrIDAddress (string) the name or ID-address
 * @appOrigin (string) the application's origin URL
 */
async function getAppKeys(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const mnemonic = await getBackupPhrase(args[0]);
  const nameOrIDAddress = args[1];
  const origin = args[2];
  const idAddress = await getIDAddress(network, nameOrIDAddress);
  const networkInfo = await getApplicationKeyInfo(network, mnemonic, idAddress, origin);
  return JSONStringify(networkInfo);
}

/*
 * Get the owner private key(s) from a backup phrase
 * args:
 * @mnemonic (string) the 12-word phrase
 * @max_index (integer) (optional) the profile index maximum
 */
async function getOwnerKeys(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const mnemonic = await getBackupPhrase(args[0]);
  let maxIndex = 1;
  if (args.length > 1 && !!args[1]) {
    maxIndex = parseInt(args[1]);
  }

  const keyInfo: OwnerKeyInfoType[] = [];
  for (let i = 0; i < maxIndex; i++) {
    keyInfo.push(await getOwnerKeyInfo(network, mnemonic, i));
  }

  return JSONStringify(keyInfo);
}

/*
 * Get the payment private key from a backup phrase 
 * args:
 * @mnemonic (string) the 12-word phrase
 */
async function getPaymentKey(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const mnemonic = await getBackupPhrase(args[0]);
  // keep the return value consistent with getOwnerKeys 
  const keyObj = await getPaymentKeyInfo(network, mnemonic);
  const keyInfo: PaymentKeyInfoType[] = [];
  keyInfo.push(keyObj);
  return JSONStringify(keyInfo);
}

/*
 * Get the payment private key from a backup phrase used by the Stacks wallet
 * args:
 * @mnemonic (string) the 24-word phrase
 */
async function getStacksWalletKey(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const mnemonic = await getBackupPhrase(args[0]);
  // keep the return value consistent with getOwnerKeys
  const keyObj = await getStacksWalletKeyInfo(network, mnemonic);
  const keyInfo: StacksKeyInfoType[] = [];
  keyInfo.push(keyObj);
  return JSONStringify(keyInfo);
}

/*
 * Make a private key and output it 
 * args:
 * @mnemonic (string) OPTIONAL; the 12-word phrase
 */
async function makeKeychain(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  let mnemonic: string;
  if (args[0]) {
    mnemonic = await getBackupPhrase(args[0]);
  } else {
    mnemonic = await bip39.generateMnemonic(
      STX_WALLET_COMPATIBLE_SEED_STRENGTH, 
      crypto.randomBytes
    );
  }

  const stacksKeyInfo = await getStacksWalletKeyInfo(network, mnemonic);
  return JSONStringify({
    'mnemonic': mnemonic,
    'keyInfo': stacksKeyInfo
  });
}

/*
 * Get an address's tokens and their balances.
 * Takes either a Bitcoin or Stacks address
 * args:
 * @address (string) the address
 */
function balance(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  let address = args[0];

  if (BLOCKSTACK_TEST) {
    // force testnet address if we're in regtest or testnet mode
    address = network.coerceAddress(address);
  }

  // temporary hack to use network config from stacks-transactions lib
  const txNetwork = network.isMainnet() ? new StacksMainnet() : new StacksTestnet();
  txNetwork.coreApiUrl = network.blockstackAPIUrl;

  return fetch(txNetwork.getAccountApiUrl(address))
    .then((response) => response.json())
    .then((response) => {
      let balanceHex = response.balance;
      if(balanceHex.startsWith('0x')) {
        balanceHex = balanceHex.substr(2);
      }
      const balance = new BN(balanceHex, 16);
      const res = {
        balance: balance.toString(10),
        nonce: response.nonce
      };
      return Promise.resolve(JSONStringify(res));
    });
}

/*
 * Get a page of the account's history
 * args:
 * @address (string) the account address
 * @page (int) the page of the history to fetch (optional)
 */
function getAccountHistory(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const address = c32check.c32ToB58(args[0]);

  if (args.length >= 2 && !!args[1]) {
    const page = parseInt(args[1]);
    return Promise.resolve().then(() => {
      return network.getAccountHistoryPage(address, page);
    })
      .then(accountStates => JSONStringify(accountStates.map((s : any) => {
        const new_s = {
          address: c32check.b58ToC32(s.address),
          credit_value: s.credit_value.toString(),
          debit_value: s.debit_value.toString()
        };
        return new_s;
      })));
  }
  else {
    // all pages 
    let history : any[] = [];
    
    function getAllAccountHistoryPages(page: number) : Promise<any[]> {
      return network.getAccountHistoryPage(address, page)
        .then((results : any[]) => {
          if (results.length == 0) {
            return history;
          }
          else {
            history = history.concat(results);
            return getAllAccountHistoryPages(page + 1);
          }
        });
    }

    return getAllAccountHistoryPages(0)
      .then((accountStates: any[]) => JSONStringify(accountStates.map((s : any) => {
        const new_s = {
          address: c32check.b58ToC32(s.address),
          credit_value: s.credit_value.toString(),
          debit_value: s.debit_value.toString()
        };
        return new_s;
      })));
  }
}

/*
 * Get the account's state(s) at a particular block height
 * args:
 * @address (string) the account address
 * @blockHeight (int) the height at which to query
 */
function getAccountAt(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const address = c32check.c32ToB58(args[0]);
  const blockHeight = parseInt(args[1]);

  return Promise.resolve().then(() => {
    return network.getAccountAt(address, blockHeight);
  })
    .then(accountStates => accountStates.map((s : any) => {
      const new_s = {
        address: c32check.b58ToC32(s.address),
        credit_value: s.credit_value.toString(),
        debit_value: s.debit_value.toString()
      };
      return new_s;
    }))
    .then(history => JSONStringify(history));
}

/*
 * Sends BTC from one private key to another address
 * args:
 * @recipientAddress (string) the recipient's address
 * @amount (string) the amount of BTC to send
 * @privateKey (string) the private key that owns the BTC
 */
function sendBTC(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const destinationAddress = args[0];
  const amount = parseInt(args[1]);
  const paymentKeyHex = decodePrivateKey(args[2]);

  if (amount <= 5500) {
    throw new Error('Invalid amount (must be greater than 5500)');
  }

  let paymentKey;
  if (typeof paymentKeyHex === 'string') {
    // single-sig
    paymentKey = blockstack.PubkeyHashSigner.fromHexString(paymentKeyHex);
  }
  else {
    // multi-sig or segwit 
    paymentKey = paymentKeyHex;
  }

  const txPromise = blockstack.transactions.makeBitcoinSpend(destinationAddress, paymentKey, amount, !hasKeys(paymentKeyHex))
    .catch((e : Error) => {
      if (e.name === 'InvalidAmountError') {
        return JSONStringify({
          'status': false,
          'error': e.message
        }, true);
      }
      else {
        throw e;
      }
    });

  if (txOnly) {
    return txPromise;
  }
  else {
    return txPromise.then((tx : string) => {
      return network.broadcastTransaction(tx);
    })
      .then((txid : string) => {
        return txid;
      });
  }
}


/*
 * Send tokens from one account private key to another account's address.
 * args:
 * @recipientAddress (string) the recipient's account address
 * @tokenAmount (int) the number of tokens to send
 * @fee (int) the transaction fee to be paid
 * @nonce (int) integer nonce needs to be incremented after each transaction from an account
 * @privateKey (string) the hex-encoded private key to use to send the tokens
 * @memo (string) OPTIONAL: a 34-byte memo to include
 */
async function sendTokens(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const recipientAddress = args[0];
  const tokenAmount = new BN(args[1]);
  const fee = new BN(args[2]);
  const nonce = new BN(args[3]);
  const privateKey = args[4];

  let memo = '';

  if (args.length > 4 && !!args[5]) {
    memo = args[5];
  }

  // temporary hack to use network config from stacks-transactions lib
  const txNetwork = network.isMainnet() ? new StacksMainnet() : new StacksTestnet();
  txNetwork.coreApiUrl = network.blockstackAPIUrl;

  const options: TokenTransferOptions = {
    recipient: recipientAddress,
    amount: tokenAmount,
    senderKey: privateKey,
    fee,
    nonce,
    memo,
    network: txNetwork
  }

  const tx = await makeSTXTokenTransfer(options);

  if (estimateOnly) {
    return estimateTransfer(tx, txNetwork).then((cost) => {
      return cost.toString(10)
    })
  }

  if (txOnly) {
    return Promise.resolve(tx.serialize().toString('hex'));
  }

  return broadcastTransaction(tx, txNetwork).then((response) => {
    return {
      txid: tx.txid(),
      transaction: generateExplorerTxPageUrl(tx.txid(), txNetwork),
    };
  }).catch((error) => {
    return error.toString();
  });
}

/*
 * Depoly a Clarity smart contract.
 * args:
 * @source (string) path to the contract source file
 * @contractName (string) the name of the contract
 * @fee (int) the transaction fee to be paid
 * @nonce (int) integer nonce needs to be incremented after each transaction from an account
 * @privateKey (string) the hex-encoded private key to use to send the tokens
 */
async function contractDeploy(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const sourceFile = args[0];
  const contractName = args[1];
  const fee = new BN(args[2]);
  const nonce = new BN(args[3]);
  const privateKey = args[4];

  const source = fs.readFileSync(sourceFile).toString();

  // temporary hack to use network config from stacks-transactions lib
  const txNetwork = network.isMainnet() ? new StacksMainnet() : new StacksTestnet();
  txNetwork.coreApiUrl = network.blockstackAPIUrl;

  const options: ContractDeployOptions = {
    contractName,
    codeBody: source,
    senderKey: privateKey,
    fee,
    nonce,
    network: txNetwork,
    postConditionMode: PostConditionMode.Allow
  }

  const tx = await makeContractDeploy(options);

  if (estimateOnly) {
    return estimateContractDeploy(tx, txNetwork).then((cost) => {
      return cost.toString(10)
    })
  }

  if (txOnly) {
    return Promise.resolve(tx.serialize().toString('hex'));
  }

  return broadcastTransaction(tx, txNetwork).then(() => {
    return {
      txid: tx.txid(),
      transaction: generateExplorerTxPageUrl(tx.txid(), txNetwork),
    };
  }).catch((error) => {
    return error.toString();
  });
}

/*
 * Call a Clarity smart contract function.
 * args:
 * @contractAddress (string) the address of the contract
 * @contractName (string) the name of the contract
 * @functionName (string) the name of the function to call
 * @fee (int) the transaction fee to be paid
 * @nonce (int) integer nonce needs to be incremented after each transaction from an account
 * @privateKey (string) the hex-encoded private key to use to send the tokens
 */
async function contractFunctionCall(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const contractAddress = args[0];
  const contractName = args[1];
  const functionName = args[2];
  const fee = new BN(args[3]);
  const nonce = new BN(args[4]);
  const privateKey = args[5];

  // temporary hack to use network config from stacks-transactions lib
  const txNetwork = network.isMainnet() ? new StacksMainnet() : new StacksTestnet();
  txNetwork.coreApiUrl = network.blockstackAPIUrl;

  let abi: ClarityAbi;
  let abiArgs: ClarityFunctionArg[];
  let functionArgs: ClarityValue[] = [];

  return getAbi(
    contractAddress,
    contractName,
    txNetwork
  ).then((responseAbi) => {
    abi = responseAbi;
    const filtered = abi.functions.filter(fn => fn.name === functionName);
    if (filtered.length === 1) {
      abiArgs = filtered[0].args;
      return makePromptsFromArgList(abiArgs);
    } else {
      return null;
    }
  })
  .then((prompts) => inquirer.prompt(prompts))
  .then((answers) => {
    functionArgs = parseClarityFunctionArgAnswers(answers, abiArgs);

    const options: ContractCallOptions = {
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderKey: privateKey,
      fee,
      nonce,
      network: txNetwork,
      postConditionMode: PostConditionMode.Allow
    }

    return makeContractCall(options);
  }).then((tx) => {
    if (!validateContractCall(tx.payload as ContractCallPayload, abi)) {
      throw new Error('Failed to validate function arguments against ABI');
    }

    if (estimateOnly) {
      return estimateContractFunctionCall(tx, txNetwork).then((cost) => {
        return cost.toString(10)
      })
    }

    if (txOnly) {
      return Promise.resolve(tx.serialize().toString('hex'));
    }

    return broadcastTransaction(tx, txNetwork).then(() => {
      return {
        txid: tx.txid(),
        transaction: generateExplorerTxPageUrl(tx.txid(), txNetwork),
      };
    }).catch((error) => {
      return error.toString();
    });
  });
}

/*
 * Call a read-only Clarity smart contract function.
 * args:
 * @contractAddress (string) the address of the contract
 * @contractName (string) the name of the contract
 * @functionName (string) the name of the function to call
 * @senderAddress (string) the sender address
 */
async function readOnlyContractFunctionCall(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const contractAddress = args[0];
  const contractName = args[1];
  const functionName = args[2];
  const senderAddress = args[3];

  // temporary hack to use network config from stacks-transactions lib
  const txNetwork = network.isMainnet() ? new StacksMainnet() : new StacksTestnet();
  txNetwork.coreApiUrl = network.blockstackAPIUrl;

  let abi: ClarityAbi;
  let abiArgs: ClarityFunctionArg[];
  let functionArgs: ClarityValue[] = [];

  return getAbi(
    contractAddress,
    contractName,
    txNetwork
  ).then((responseAbi) => {
    abi = responseAbi;
    const filtered = abi.functions.filter(fn => fn.name === functionName);
    if (filtered.length === 1) {
      abiArgs = filtered[0].args;
      return makePromptsFromArgList(abiArgs);
    } else {
      return null;
    }
  })
  .then((prompts) => inquirer.prompt(prompts))
  .then((answers) => {
    functionArgs = parseClarityFunctionArgAnswers(answers, abiArgs);

    const options: ReadOnlyFunctionOptions = {
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderAddress,
      network: txNetwork,
    }

    return callReadOnlyFunction(options);
  }).then((returnValue) => {
    return cvToString(returnValue);
  }).catch((error) => {
    return error.toString();
  });
}

/*
 * Get the number of confirmations of a txid.
 * args:
 * @txid (string) the transaction ID as a hex string
 */
function getConfirmations(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const txid = args[0];
  return Promise.all([network.getBlockHeight(), network.getTransactionInfo(txid)])
    .then(([blockHeight, txInfo]) => {
      return JSONStringify({
        'blockHeight': txInfo.block_height,
        'confirmations': blockHeight - txInfo.block_height + 1
      });
    })
    .catch((e) => {
      if (e.message.toLowerCase() === 'unconfirmed transaction') {
        return JSONStringify({
          'blockHeight': 'unconfirmed',
          'confirmations': 0
        });
      }
      else {
        throw e;
      }
    });
}

/*
 * Get the address of a private key 
 * args:
 * @private_key (string) the hex-encoded private key or key bundle
 */
function getKeyAddress(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const privateKey = decodePrivateKey(args[0]);
  return Promise.resolve().then(() => {
    const addr = getPrivateKeyAddress(network, privateKey);
    return JSONStringify({
      'BTC': addr,
      'STACKS': c32check.b58ToC32(addr)
    });
  });
}

function getDidConfiguration(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const privateKey = decodePrivateKey(args[2]);
  return makeDIDConfiguration(network, args[0], args[1], args[2]).then(didConfiguration => {
    return JSONStringify(didConfiguration);
  });
}

/*
 * Get a file from Gaia.
 * args:
 * @username (string) the blockstack ID of the user who owns the data
 * @origin (string) the application origin
 * @path (string) the file to read
 * @appPrivateKey (string) OPTIONAL: the app private key to decrypt/verify with
 * @decrypt (string) OPTINOAL: if '1' or 'true', then decrypt
 * @verify (string) OPTIONAL: if '1' or 'true', then search for and verify a signature file
 *  along with the data
 */
function gaiaGetFile(network: CLINetworkAdapter, args: string[]) : Promise<string | Buffer> {
  const username = args[0];
  const origin = args[1];
  const path = args[2];
  let appPrivateKey = args[3];
  let decrypt = false;
  let verify = false;

  if (!!appPrivateKey && args.length > 4 && !!args[4]) {
    decrypt = (args[4].toLowerCase() === 'true' || args[4].toLowerCase() === '1');
  }

  if (!!appPrivateKey && args.length > 5 && !!args[5]) {
    verify = (args[5].toLowerCase() === 'true' || args[5].toLowerCase() === '1');
  }

  if (!appPrivateKey) {
    // make a fake private key (it won't be used)
    appPrivateKey = 'fda1afa3ff9ef25579edb5833b825ac29fae82d03db3f607db048aae018fe882';
  }

  // force mainnet addresses 
  blockstack.config.network.layer1 = bitcoin.networks.bitcoin;
  return gaiaAuth(network, appPrivateKey, null)
    .then((_userData : UserData) => blockstack.getFile(path, {
      decrypt: decrypt,
      verify: verify,
      app: origin,
      username: username}))
    .then((data: ArrayBuffer | Buffer | string) => {
      if (data instanceof ArrayBuffer) {
        return Buffer.from(data);
      }
      else {
        return data;
      }
    });
}

/*
 * Put a file into a Gaia hub
 * args:
 * @hubUrl (string) the URL to the write endpoint of the gaia hub
 * @appPrivateKey (string) the private key used to authenticate to the gaia hub
 * @dataPath (string) the path (on disk) to the data to store 
 * @gaiaPath (string) the path (in Gaia) where the data will be stored
 * @encrypt (string) OPTIONAL: if '1' or 'true', then encrypt the file
 * @sign (string) OPTIONAL: if '1' or 'true', then sign the file and store the signature too.
 */
function gaiaPutFile(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const hubUrl = args[0];
  const appPrivateKey = args[1];
  const dataPath = args[2];
  const gaiaPath = path.normalize(args[3].replace(/^\/+/, ''));

  let encrypt = false;
  let sign = false;
  
  if (args.length > 4 && !!args[4]) {
    encrypt = (args[4].toLowerCase() === 'true' || args[4].toLowerCase() === '1');
  }
  if (args.length > 5 && !!args[5]) {
    sign = (args[5].toLowerCase() === 'true' || args[5].toLowerCase() === '1');
  }
  
  const data = fs.readFileSync(dataPath);

  // force mainnet addresses
  // TODO
  blockstack.config.network.layer1 = bitcoin.networks.bitcoin;
  return gaiaAuth(network, appPrivateKey, hubUrl)
    .then((_userData : UserData) => {      
      return blockstack.putFile(gaiaPath, data, { encrypt: encrypt, sign: sign });
    })
    .then((url : string) => {
      return JSONStringify({'urls': [url]});
    });
}

/*
 * Delete a file in a Gaia hub
 * args:
 * @hubUrl (string) the URL to the write endpoint of the gaia hub
 * @appPrivateKey (string) the private key used to authenticate to the gaia hub
 * @gaiaPath (string) the path (in Gaia) to delete
 * @wasSigned (string) OPTIONAL: if '1' or 'true'.  Delete the signature file as well.
 */
function gaiaDeleteFile(network: CLINetworkAdapter, args: string[]): Promise<string> {
  const hubUrl = args[0];
  const appPrivateKey = args[1];
  const gaiaPath = path.normalize(args[2].replace(/^\/+/, ''));

  let wasSigned = false;

  if (args.length > 3 && !!args[3]) {
    wasSigned = (args[3].toLowerCase() === 'true' || args[3].toLowerCase() === '1');
  }

  // force mainnet addresses
  // TODO
  blockstack.config.network.layer1 = bitcoin.networks.bitcoin;
  return gaiaAuth(network, appPrivateKey, hubUrl)
    .then((_userData: UserData) => {
      return blockstack.deleteFile(gaiaPath, {wasSigned: wasSigned});
    })
    .then(() => {
      return JSONStringify('ok');
    });
}

/*
 * List files in a Gaia hub
 * args:
 * @hubUrl (string) the URL to the write endpoint of the gaia hub
 * @appPrivateKey (string) the private key used to authenticate to the gaia hub
 */
function gaiaListFiles(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const hubUrl = args[0];
  const appPrivateKey = args[1];
   
  // force mainnet addresses
  // TODO
  let count = 0;
  blockstack.config.network.layer1 = bitcoin.networks.bitcoin;
  return gaiaAuth(network, canonicalPrivateKey(appPrivateKey), hubUrl)
    .then((_userData : UserData) => {
      return blockstack.listFiles((name : string) => {
        // print out incrementally
        console.log(name);
        count += 1;
        return true;
      });
    })
    .then(() => JSONStringify(count));
}


/*
 * Group array items into batches
 */
function batchify<T>(input: T[], batchSize: number = 50): T[][] {
  const output = [];
  let currentBatch = [];
  for (let i = 0; i < input.length; i++) {
    currentBatch.push(input[i]);
    if (currentBatch.length >= batchSize) {
      output.push(currentBatch);
      currentBatch = [];
    }
  }
  if (currentBatch.length > 0) {
    output.push(currentBatch);
  }
  return output;
}

/*
 * Dump all files from a Gaia hub bucket to a directory on disk.
 * args:
 * @nameOrIDAddress (string) the name or ID address that owns the bucket to dump
 * @appOrigin (string) the application for which to dump data
 * @hubUrl (string) the URL to the write endpoint of the gaia hub
 * @mnemonic (string) the 12-word phrase or ciphertext
 * @dumpDir (string) the directory to hold the dumped files
 */
function gaiaDumpBucket(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const nameOrIDAddress = args[0];
  const appOrigin = args[1];
  const hubUrl = args[2];
  const mnemonicOrCiphertext = args[3];
  let dumpDir = args[4];

  if (dumpDir.length === 0) {
    throw new Error('Invalid directory (not given)');
  }
  if (dumpDir[0] !== '/') {
    // relative path.  make absolute 
    const cwd = fs.realpathSync('.');
    dumpDir = path.normalize(`${cwd}/${dumpDir}`);
  }

  mkdirs(dumpDir);

  function downloadFile(hubConfig: GaiaHubConfig, fileName: string) : Promise<any> {
    const gaiaReadUrl = `${hubConfig.url_prefix.replace(/\/+$/, '')}/${hubConfig.address}`;
    const fileUrl = `${gaiaReadUrl}/${fileName}`;
    const destPath = `${dumpDir}/${fileName.replace(/\//g, '\\x2f')}`;
    
    console.log(`Download ${fileUrl} to ${destPath}`);
    return fetch(fileUrl)
      .then((resp : any) => {
        if (resp.status !== 200) {
          throw new Error(`Bad status code for ${fileUrl}: ${resp.status}`);
        }
        
        // javascript can be incredibly stupid at fetching data despite being a Web language...
        const contentType = resp.headers.get('Content-Type');
        if (contentType === null
            || contentType.startsWith('text')
            || contentType === 'application/json') {
          return resp.text();
        } else {
          return resp.arrayBuffer();
        }
      })
      .then((filebytes : Buffer | ArrayBuffer) => {
        return new Promise((resolve, reject) => {
          try {
            fs.writeFileSync(destPath, Buffer.from(filebytes), { encoding: null, mode: 0o660 });
            resolve();
          }
          catch(e) {
            reject(e);
          }
        });
      });
  }

  // force mainnet addresses
  // TODO: better way of doing this
  blockstack.config.network.layer1 = bitcoin.networks.bitcoin;

  const fileNames: string[] = [];
  let gaiaHubConfig : GaiaHubConfig;
  let appPrivateKey : string;
  let ownerPrivateKey : string;

  return getIDAppKeys(network, nameOrIDAddress, appOrigin, mnemonicOrCiphertext)
    .then((keyInfo : IDAppKeys) => {
      appPrivateKey = keyInfo.appPrivateKey;
      ownerPrivateKey = keyInfo.ownerPrivateKey;
      return gaiaAuth(network, appPrivateKey, hubUrl, ownerPrivateKey);
    })
    .then((_userData : UserData) => {
      return gaiaConnect(network, hubUrl, appPrivateKey);
    })
    .then((hubConfig : GaiaHubConfig) => {
      gaiaHubConfig = hubConfig;
      return blockstack.listFiles((name) => {
        fileNames.push(name);
        return true;
      });
    })
    .then((fileCount : number) => {
      console.log(`Download ${fileCount} files...`);
      const fileBatches : string[][] = batchify(fileNames);
      let filePromiseChain : Promise<any> = Promise.resolve();
      for (let i = 0; i < fileBatches.length; i++) {
        const filePromises = fileBatches[i].map((fileName) => downloadFile(gaiaHubConfig, fileName));
        const batchPromise = Promise.all(filePromises);
        filePromiseChain = filePromiseChain.then(() => batchPromise);
      }

      return filePromiseChain.then(() => JSONStringify(fileCount));
    });
}

/*
 * Restore all of the files in a Gaia bucket dump to a new Gaia hub
 * args:
 * @nameOrIDAddress (string) the name or ID address that owns the bucket to dump
 * @appOrigin (string) the origin of the app for which to restore data
 * @hubUrl (string) the URL to the write endpoint of the new gaia hub
 * @mnemonic (string) the 12-word phrase or ciphertext
 * @dumpDir (string) the directory to hold the dumped files
 */
function gaiaRestoreBucket(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const nameOrIDAddress = args[0];
  const appOrigin = args[1];
  const hubUrl = args[2];
  const mnemonicOrCiphertext = args[3];
  let dumpDir = args[4];

  if (dumpDir.length === 0) {
    throw new Error('Invalid directory (not given)');
  }
  if (dumpDir[0] !== '/') {
    // relative path.  make absolute 
    const cwd = fs.realpathSync('.');
    dumpDir = path.normalize(`${cwd}/${dumpDir}`);
  }

  const fileList = fs.readdirSync(dumpDir);
  const fileBatches = batchify(fileList, 10);

  let appPrivateKey : string;
  let ownerPrivateKey : string;
  
  // force mainnet addresses
  // TODO better way of doing this
  blockstack.config.network.layer1 = bitcoin.networks.bitcoin;

  return getIDAppKeys(network, nameOrIDAddress, appOrigin, mnemonicOrCiphertext)
    .then((keyInfo : IDAppKeys) => {
      appPrivateKey = keyInfo.appPrivateKey;
      ownerPrivateKey = keyInfo.ownerPrivateKey;
      return gaiaAuth(network, appPrivateKey, hubUrl, ownerPrivateKey);
    })
    .then((_userData : UserData) => {
      let uploadPromise : Promise<any> = Promise.resolve();
      for (let i = 0; i < fileBatches.length; i++) {
        const uploadBatchPromises = fileBatches[i].map((fileName : string) => {
          const filePath = path.join(dumpDir, fileName);
          const dataBuf = fs.readFileSync(filePath);
          const gaiaPath = fileName.replace(/\\x2f/g, '/');
          return blockstack.putFile(gaiaPath, dataBuf, { encrypt: false, sign: false })
            .then((url : string) => {
              console.log(`Uploaded ${fileName} to ${url}`);
            });
        });
        uploadPromise = uploadPromise.then(() => Promise.all(uploadBatchPromises));
      }
      return uploadPromise;
    })
    .then(() => JSONStringify(fileList.length));
}

/*
 * Set the Gaia hub for an application for a blockstack ID.
 * args:
 * @blockstackID (string) the blockstack ID of the user
 * @profileHubUrl (string) the URL to the write endpoint of the user's profile gaia hub
 * @appOrigin (string) the application's Origin
 * @hubUrl (string) the URL to the write endpoint of the app's gaia hub
 * @mnemonic (string) the 12-word backup phrase, or the ciphertext of it
 */
async function gaiaSetHub(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  network.setCoerceMainnetAddress(true);

  const blockstackID = args[0];
  const ownerHubUrl = args[1];
  const appOrigin = args[2];
  const hubUrl = args[3];
  const mnemonicPromise = getBackupPhrase(args[4]);

  const nameInfoPromise = getNameInfoEasy(network, blockstackID)
    .then((nameInfo : NameInfoType) => {
      if (!nameInfo) {
        throw new Error('Name not found');
      }
      return nameInfo;
    });

  const profilePromise = blockstack.lookupProfile(blockstackID);

  const [nameInfo, nameProfile, mnemonic]: [NameInfoType, any, string] = 
    await Promise.all([nameInfoPromise, profilePromise, mnemonicPromise]);

  if (!nameProfile) {
    throw new Error('No profile found');
  }
  if (!nameInfo) {
    throw new Error('Name not found');
  }
  if (!nameInfo.zonefile) {
    throw new Error('No zone file found');
  }

  if (!nameProfile.apps) {
    nameProfile.apps = {};
  }

  // get owner ID-address
  const ownerAddress = network.coerceMainnetAddress(nameInfo.address);
  const idAddress = `ID-${ownerAddress}`;
  
  // get owner and app key info 
  const appKeyInfo = await getApplicationKeyInfo(network, mnemonic, idAddress, appOrigin);
  const ownerKeyInfo = await getOwnerKeyInfo(network, mnemonic, appKeyInfo.ownerKeyIndex);

  // do we already have an address set for this app?
  let existingAppAddress : string;
  let appPrivateKey : string;
  try {
    existingAppAddress = getGaiaAddressFromProfile(network, nameProfile, appOrigin);
    appPrivateKey = extractAppKey(network, appKeyInfo, existingAppAddress);
  }
  catch (e) {
    console.log(`No profile application entry for ${appOrigin}`);
    appPrivateKey = extractAppKey(network, appKeyInfo);
  }
  
  appPrivateKey = `${canonicalPrivateKey(appPrivateKey)}01`;
  const appAddress = network.coerceMainnetAddress(getPrivateKeyAddress(network, appPrivateKey));

  if (existingAppAddress && appAddress !== existingAppAddress) {
    throw new Error(`BUG: ${existingAppAddress} !== ${appAddress}`);
  }

  const profile = nameProfile;
  const ownerPrivateKey = ownerKeyInfo.privateKey;
  
  const ownerGaiaHubPromise = gaiaConnect(network, ownerHubUrl, ownerPrivateKey);
  const appGaiaHubPromise = gaiaConnect(network, hubUrl, appPrivateKey);

  const [ownerHubConfig, appHubConfig] : [GaiaHubConfig, GaiaHubConfig] = 
    await Promise.all([ownerGaiaHubPromise, appGaiaHubPromise]);

  if (!ownerHubConfig.url_prefix) {
    throw new Error('Invalid owner hub config: no url_prefix defined');
  }

  if (!appHubConfig.url_prefix) {
    throw new Error('Invalid app hub config: no url_prefix defined');
  }

  const gaiaReadUrl = appHubConfig.url_prefix.replace(/\/+$/, '');

  const newAppEntry : Record<string, string> = {};
  newAppEntry[appOrigin] = `${gaiaReadUrl}/${appAddress}/`;

  const apps = Object.assign({}, profile.apps ? profile.apps : {}, newAppEntry);
  profile.apps = apps;

  // sign the new profile
  const signedProfile = makeProfileJWT(profile, ownerPrivateKey); 
  const profileUrls : {dataUrls?: string[], error?: string} = await gaiaUploadProfileAll(
    network, [ownerHubUrl], signedProfile, ownerPrivateKey, blockstackID);

  if (profileUrls.error) {
    return JSONStringify({
      error: profileUrls.error
    });
  }
  else {
    return JSONStringify({
      profileUrls: profileUrls.dataUrls
    });
  }
}
      
      
/*
 * Convert an address between mainnet and testnet, and between
 * base58check and c32check.
 * args:
 * @address (string) the input address.  can be in any format
 */
function addressConvert(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const addr = args[0];
  let b58addr : string;
  let c32addr : string;
  let testnetb58addr : string;
  let testnetc32addr : string;

  if (addr.match(STACKS_ADDRESS_PATTERN)) {
    c32addr = addr;
    b58addr = c32check.c32ToB58(c32addr);
  }
  else if (addr.match(/[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+/)) {
    c32addr = c32check.b58ToC32(addr);
    b58addr = addr;
  }
  else {
    throw new Error(`Unrecognized address ${addr}`);
  }

  if (network.isTestnet()) {
    testnetb58addr = network.coerceAddress(b58addr);
    testnetc32addr = c32check.b58ToC32(testnetb58addr);
  }

  return Promise.resolve().then(() => {
    const result : any = {
      mainnet: {
        STACKS: c32addr, 
        BTC: b58addr
      },
      testnet: undefined
    };

    if (network.isTestnet()) {
      result.testnet = {
        STACKS: testnetc32addr, 
        BTC: testnetb58addr
      };
    }

    return JSONStringify(result);
  });
}

/*
 * Run an authentication daemon on a given port.
 * args:
 * @gaiaHubUrl (string) the write endpoint of your app Gaia hub, where app data will be stored
 * @mnemonic (string) your 12-word phrase, optionally encrypted.  If encrypted, then
 * a password will be prompted.
 * @profileGaiaHubUrl (string) the write endpoint of your profile Gaia hub, where your profile
 *   will be stored (optional)
 * @port (number) the port to listen on (optional)
 */
function authDaemon(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const gaiaHubUrl = args[0];
  const mnemonicOrCiphertext = args[1];
  let port = 3000;  // default port
  let profileGaiaHub = gaiaHubUrl;

  if (args.length > 2 && !!args[2]) {
    profileGaiaHub = args[2];
  }

  if (args.length > 3 && !!args[3]) {
    port = parseInt(args[3]);
  }

  if (port < 0 || port > 65535) {
    return Promise.resolve().then(() => JSONStringify({ error: 'Invalid port' }));
  }

  const mnemonicPromise = getBackupPhrase(mnemonicOrCiphertext);

  return mnemonicPromise
    .then((mnemonic : string) => {
      noExit = true;

      // load up all of our identity addresses, profiles, profile URLs, and Gaia connections
      const authServer = express();
      authServer.use(cors());

      authServer.get(/^\/auth\/*$/, (req: express.Request, res: express.Response) => {
        return handleAuth(network, mnemonic, gaiaHubUrl, profileGaiaHub, port, req, res);
      });

      authServer.get(/^\/signin\/*$/, (req: express.Request, res: express.Response) => {
        return handleSignIn(network, mnemonic, gaiaHubUrl, profileGaiaHub, req, res);
      });

      authServer.listen(port, () => console.log(`Authentication server started on ${port}`));
      return 'Press Ctrl+C to exit';
    })
    .catch((e : Error) => {
      return JSONStringify({ error: e.message });
    });
}

/*
 * Encrypt a backup phrase
 * args:
 * @backup_phrase (string) the 12-word phrase to encrypt
 * @password (string) the password (will be interactively prompted if not given)
 */
function encryptMnemonic(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const mnemonic = args[0];
  if (mnemonic.split(/ +/g).length !== 12) {
    throw new Error('Invalid backup phrase: must be 12 words');
  }

  const passwordPromise = new Promise((resolve, reject) => {
    let pass = '';
    if (args.length === 2 && !!args[1]) {
      pass = args[1];
      resolve(pass);
    }
    else {
      if (!process.stdin.isTTY) {
        // password must be given as an argument
        const errMsg = 'Password argument required on non-interactive mode';
        reject(new Error(errMsg));
      }
      else {
        // prompt password
        getpass('Enter password: ', (pass1 : string) => {
          getpass('Enter password again: ', (pass2 : string) => {
            if (pass1 !== pass2) {
              const errMsg = 'Passwords do not match';
              reject(new Error(errMsg));
            }
            else {
              resolve(pass1);
            }
          });
        });
      }
    }
  });

  return passwordPromise
    .then((pass : string) => encryptBackupPhrase(mnemonic, pass))
    .then((cipherTextBuffer : Buffer) => cipherTextBuffer.toString('base64'))
    .catch((e : Error) => {
      return JSONStringify({ error: e.message});
    });
}

/* Decrypt a backup phrase 
 * args:
 * @encrypted_backup_phrase (string) the encrypted base64-encoded backup phrase
 * @password 9string) the password (will be interactively prompted if not given)
 */
function decryptMnemonic(network: CLINetworkAdapter, args: string[]) : Promise<string> {
  const ciphertext = args[0];
 
  const passwordPromise = new Promise((resolve, reject) => {
    if (args.length === 2 && !!args[1]) {
      const pass = args[1];
      resolve(pass);
    }
    else {
      if (!process.stdin.isTTY) {
        // password must be given 
        reject(new Error('Password argument required in non-interactive mode'));
      }
      else {
        // prompt password 
        getpass('Enter password: ', (p) => {
          resolve(p);
        });
      }
    }
  });

  return passwordPromise
    .then((pass : string) => decryptBackupPhrase(Buffer.from(ciphertext, 'base64'), pass))
    .catch((e : Error) => {
      return JSONStringify({ error: 'Failed to decrypt (wrong password or corrupt ciphertext), ' +
        `details: ${e.message}` });
    });
}

/* Print out all documentation on usage in JSON 
 */
type DocsArgsType = {
  name: string;
  type: string;
  value: string;
  format: string;
};

type FormattedDocsType = {
  command: string;
  args: DocsArgsType[];
  usage: string;
  group: string
};

function printDocs(_network: CLINetworkAdapter, _args: string[]) : Promise<string> {
  return Promise.resolve().then(() => {
    const formattedDocs : FormattedDocsType[] = [];
    const commandNames : string[] = Object.keys(CLI_ARGS.properties);
    for (let i = 0; i < commandNames.length; i++) {
      const commandName = commandNames[i];
      const args : DocsArgsType[] = [];
      const usage = CLI_ARGS.properties[commandName].help;
      const group = CLI_ARGS.properties[commandName].group;

      for (let j = 0; j < CLI_ARGS.properties[commandName].items.length; j++) {
        const argItem = CLI_ARGS.properties[commandName].items[j];
        args.push({
          name: argItem.name,
          type: argItem.type,
          value: argItem.realtype,
          format: argItem.pattern ? argItem.pattern : '.+'
        } as DocsArgsType);
      }

      formattedDocs.push({
        command: commandName,
        args: args,
        usage: usage,
        group: group
      } as FormattedDocsType);
    }
    return JSONStringify(formattedDocs);
  });
}

type CommandFunction = (network: CLINetworkAdapter, args: string[]) => Promise<string | Buffer>;

/*
 * Decrypt a backup phrase
 * args:
 * @p
/*
 * Global set of commands
 */
const COMMANDS : Record<string, CommandFunction> = {
  'authenticator': authDaemon,
  'announce': announce,
  'balance': balance,
  'call_contract_func': contractFunctionCall,
  'call_read_only_contract_func': readOnlyContractFunctionCall,
  'convert_address': addressConvert,
  'decrypt_keychain': decryptMnemonic,
  'deploy_contract': contractDeploy,
  'docs': printDocs,
  'encrypt_keychain': encryptMnemonic,
  'gaia_deletefile': gaiaDeleteFile,
  'gaia_dump_bucket': gaiaDumpBucket,
  'gaia_getfile': gaiaGetFile,
  'gaia_listfiles': gaiaListFiles,
  'gaia_putfile': gaiaPutFile,
  'gaia_restore_bucket': gaiaRestoreBucket,
  'gaia_sethub': gaiaSetHub,
  'get_address': getKeyAddress,
  'get_account_at': getAccountAt,
  'get_account_history': getAccountHistory,
  'get_blockchain_record': getNameBlockchainRecord,
  'get_blockchain_history': getNameHistoryRecord,
  'get_confirmations': getConfirmations,
  'get_did_configuration': getDidConfiguration,
  'get_namespace_blockchain_record': getNamespaceBlockchainRecord,
  'get_app_keys': getAppKeys,
  'get_owner_keys': getOwnerKeys,
  'get_payment_key': getPaymentKey,
  'get_stacks_wallet_key': getStacksWalletKey,
  'get_zonefile': getZonefile,
  'lookup': lookup,
  'make_keychain': makeKeychain,
  'make_zonefile': makeZonefile,
  'names': names,
  'name_import': nameImport,
  'namespace_preorder': namespacePreorder,
  'namespace_reveal': namespaceReveal,
  'namespace_ready': namespaceReady,
  'price': price,
  'price_namespace': priceNamespace,
  'profile_sign': profileSign,
  'profile_store': profileStore,
  'profile_verify': profileVerify,
  'register': register,
  'register_addr': registerAddr,
  'register_subdomain': registerSubdomain,
  'renew': renew,
  'revoke': revoke,
  'send_btc': sendBTC,
  'send_tokens': sendTokens,
  'transfer': transfer,
  'tx_preorder': txPreorder,
  'tx_register': txRegister,
  'update': update,
  'whois': whois,
  'zonefile_push': zonefilePush
};

/*
 * CLI main entry point
 */
export function CLIMain() {
  const argv = process.argv;
  const opts = getCLIOpts(argv);

  const cmdArgs : any = checkArgs(CLIOptAsStringArray(opts, '_') ? CLIOptAsStringArray(opts, '_') : []);
  if (!cmdArgs.success) {
    if (cmdArgs.error) {
      console.log(cmdArgs.error);
    }
    if (cmdArgs.usage) {
      if (cmdArgs.command) {
        console.log(makeCommandUsageString(cmdArgs.command));
        console.log('Use "help" to list all commands.');
      }
      else {
        console.log(USAGE);
        console.log(makeAllCommandsList());
      }
    }
    process.exit(1);
  }
  else {
    txOnly = CLIOptAsBool(opts, 'x');
    estimateOnly = CLIOptAsBool(opts, 'e');
    safetyChecks = !CLIOptAsBool(opts, 'U');
    receiveFeesPeriod = opts['N'] ?
      parseInt(CLIOptAsString(opts, 'N')) : receiveFeesPeriod;
    gracePeriod = opts['G'] ?
      parseInt(CLIOptAsString(opts, 'N')) : gracePeriod;
    maxIDSearchIndex = opts['M'] ? 
      parseInt(CLIOptAsString(opts, 'M')) : maxIDSearchIndex;

    const debug = CLIOptAsBool(opts, 'd');
    const consensusHash = CLIOptAsString(opts, 'C');
    const integration_test = CLIOptAsBool(opts, 'i');
    const testnet = CLIOptAsBool(opts, 't');
    const magicBytes = CLIOptAsString(opts, 'm');
    const apiUrl = CLIOptAsString(opts, 'H');
    const transactionBroadcasterUrl = CLIOptAsString(opts, 'T');
    const nodeAPIUrl = CLIOptAsString(opts, 'I');
    const utxoUrl = CLIOptAsString(opts, 'X');
    const bitcoindUsername = CLIOptAsString(opts, 'u');
    const bitcoindPassword = CLIOptAsString(opts, 'p');

    if (integration_test) {
      BLOCKSTACK_TEST = integration_test;
    }

    const configPath = CLIOptAsString(opts, 'c') ? CLIOptAsString(opts, 'c') : 
      (integration_test ? DEFAULT_CONFIG_REGTEST_PATH : 
        (testnet ? DEFAULT_CONFIG_TESTNET_PATH : DEFAULT_CONFIG_PATH));

    const namespaceBurnAddr = CLIOptAsString(opts, 'B');
    const feeRate = CLIOptAsString(opts, 'F') ? parseInt(CLIOptAsString(opts, 'F')) : 0;
    const priceToPay = CLIOptAsString(opts, 'P') ? CLIOptAsString(opts, 'P') : '0';
    const priceUnits = CLIOptAsString(opts, 'D');

    const networkType = testnet ? 'testnet' : (integration_test ? 'regtest' : 'mainnet');

    const configData = loadConfig(configPath, networkType);

    if (debug) {
      configData.logConfig.level = 'debug';
    }
    else {
      configData.logConfig.level = 'info';
    }
    if (bitcoindUsername) {
      configData.bitcoindUsername = bitcoindUsername;
    }
    if (bitcoindPassword) {
      configData.bitcoindPassword = bitcoindPassword;
    }

    if (utxoUrl) {
      configData.utxoServiceUrl = utxoUrl;
    }

    winston.configure({ level: configData.logConfig.level, transports: [new winston.transports.Console(configData.logConfig)] });
     
    const cliOpts : CLI_NETWORK_OPTS = {
      consensusHash: consensusHash ? consensusHash : null,
      feeRate: feeRate ? feeRate : null,
      namespaceBurnAddress: namespaceBurnAddr ? namespaceBurnAddr : null,
      priceToPay: priceToPay ? priceToPay : null,
      priceUnits: priceUnits ? priceUnits : null,
      receiveFeesPeriod: receiveFeesPeriod ? receiveFeesPeriod : null,
      gracePeriod: gracePeriod ? gracePeriod : null,
      altAPIUrl: (apiUrl ? apiUrl : configData.blockstackAPIUrl),
      altTransactionBroadcasterUrl: (transactionBroadcasterUrl ? 
        transactionBroadcasterUrl : 
        configData.broadcastServiceUrl),
      nodeAPIUrl: (nodeAPIUrl ? nodeAPIUrl : configData.blockstackNodeUrl)
    };

    // wrap command-line options
    const wrappedNetwork = getNetwork(configData, (!!BLOCKSTACK_TEST || !!integration_test || !!testnet));
    const blockstackNetwork = new CLINetworkAdapter(wrappedNetwork, cliOpts);
    if (magicBytes) {
      blockstackNetwork.MAGIC_BYTES = magicBytes;
    }

    blockstack.config.network = blockstackNetwork;
    blockstack.config.logLevel = 'error';

    if (cmdArgs.command === 'help') {
      console.log(makeCommandUsageString(cmdArgs.args[0]));
      process.exit(0);
    }

    const method = COMMANDS[cmdArgs.command];
    let exitcode = 0;

    method(blockstackNetwork, cmdArgs.args)
      .then((result : string | Buffer) => {
        try {
        // if this is a JSON object with 'status', set the exit code
          if (result instanceof Buffer) {
            return result;
          }
          else {
            const resJson : any = JSON.parse(result);
            if (resJson.hasOwnProperty('status') && !resJson.status) {
              exitcode = 1;
            }
            return result;
          }
        }
        catch(e) {
          return result;
        }
      })
      .then((result : string | Buffer) => {
        if (result instanceof Buffer) {
          process.stdout.write(result);
        }
        else {
          console.log(result);
        }
      })
      .then(() => {
        if (!noExit) {
          process.exit(exitcode);
        }
      })
      .catch((e : Error) => {
        console.error(e.stack);
        console.error(e.message);
        if (!noExit) {
          process.exit(1);
        }
      });
  }
}
