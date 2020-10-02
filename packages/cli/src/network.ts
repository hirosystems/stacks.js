import blockstack from 'blockstack';
import * as bitcoin from 'bitcoinjs-lib';
const BN = require('bn.js');
import fetch from 'node-fetch';

import { CLI_CONFIG_TYPE } from './argparse';

import { BlockstackNetwork } from 'blockstack/lib/network';

const SATOSHIS_PER_BTC = 1e8;

export interface CLI_NETWORK_OPTS {
  consensusHash: string | null;
  feeRate: number | null;
  namespaceBurnAddress: string | null;
  priceToPay: string | null;
  priceUnits: string | null;
  receiveFeesPeriod: number | null;
  gracePeriod: number | null;
  altAPIUrl: string | null;
  altTransactionBroadcasterUrl: string | null;
  nodeAPIUrl: string | null;
}

export interface PriceType {
  units: 'BTC' | 'STACKS';
  amount: import('bn.js');
}

export type NameInfoType = {
  address: string;
  blockchain: string;
  did: string;
  expire_block: number;
  grace_period: number;
  last_txid: string;
  renewal_deadline: number;
  resolver: string | null;
  status: string;
  zonefile: string | null;
  zonefile_hash: string | null;
};

/*
 * Adapter class that allows us to use data obtained
 * from the CLI.
 */
export class CLINetworkAdapter extends BlockstackNetwork {
  consensusHash: string | null;
  feeRate: number | null;
  namespaceBurnAddress: string | null;
  priceToPay: string | null;
  priceUnits: string | null;
  gracePeriod: number | null;
  receiveFeesPeriod: number | null;
  nodeAPIUrl: string;
  optAlwaysCoerceAddress: boolean;

  constructor(network: BlockstackNetwork, opts: CLI_NETWORK_OPTS) {
    const optsDefault: CLI_NETWORK_OPTS = {
      consensusHash: null,
      feeRate: null,
      namespaceBurnAddress: null,
      priceToPay: null,
      priceUnits: null,
      receiveFeesPeriod: null,
      gracePeriod: null,
      altAPIUrl: network.blockstackAPIUrl,
      altTransactionBroadcasterUrl: network.broadcastServiceUrl,
      nodeAPIUrl: null,
    };

    opts = Object.assign({}, optsDefault, opts);

    super(opts.altAPIUrl, opts.altTransactionBroadcasterUrl, network.btc, network.layer1);
    this.consensusHash = opts.consensusHash;
    this.feeRate = opts.feeRate;
    this.namespaceBurnAddress = opts.namespaceBurnAddress;
    this.priceToPay = opts.priceToPay;
    this.priceUnits = opts.priceUnits;
    this.receiveFeesPeriod = opts.receiveFeesPeriod;
    this.gracePeriod = opts.gracePeriod;
    this.nodeAPIUrl = opts.nodeAPIUrl;

    this.optAlwaysCoerceAddress = false;
  }

  isMainnet(): boolean {
    return this.layer1.pubKeyHash === bitcoin.networks.bitcoin.pubKeyHash;
  }

  isTestnet(): boolean {
    return this.layer1.pubKeyHash === bitcoin.networks.testnet.pubKeyHash;
  }

  setCoerceMainnetAddress(value: boolean) {
    this.optAlwaysCoerceAddress = value;
  }

  coerceMainnetAddress(address: string): string {
    const addressInfo = bitcoin.address.fromBase58Check(address);
    const addressHash = addressInfo.hash;
    const addressVersion = addressInfo.version;
    let newVersion = 0;

    if (addressVersion === this.layer1.pubKeyHash) {
      newVersion = 0;
    } else if (addressVersion === this.layer1.scriptHash) {
      newVersion = 5;
    }
    return bitcoin.address.toBase58Check(addressHash, newVersion);
  }

  getFeeRate(): Promise<number> {
    if (this.feeRate) {
      // override with CLI option
      return Promise.resolve(this.feeRate);
    }
    if (this.isTestnet()) {
      // in regtest mode
      return Promise.resolve(Math.floor(0.00001 * SATOSHIS_PER_BTC));
    }
    return super.getFeeRate();
  }

  getConsensusHash(): Promise<string> {
    // override with CLI option
    if (this.consensusHash) {
      return new Promise((resolve: any) => resolve(this.consensusHash));
    }
    return super.getConsensusHash().then((c: string) => c);
  }

  getGracePeriod(): Promise<number> {
    if (this.gracePeriod) {
      return new Promise((resolve: any) => resolve(this.gracePeriod));
    }
    return super.getGracePeriod().then((g: number) => g);
  }

  getNamePrice(name: string): Promise<PriceType> {
    // override with CLI option
    if (this.priceUnits && this.priceToPay) {
      return new Promise((resolve: any) =>
        resolve({
          units: String(this.priceUnits),
          amount: new BN(this.priceToPay),
        } as PriceType)
      );
    }
    return super.getNamePrice(name).then((priceInfo: PriceType) => {
      // use v2 scheme
      if (!priceInfo.units) {
        priceInfo = {
          units: 'BTC',
          amount: new BN(String(priceInfo)),
        };
      }
      return priceInfo;
    });
  }

  getNamespacePrice(namespaceID: string): Promise<PriceType> {
    // override with CLI option
    if (this.priceUnits && this.priceToPay) {
      return new Promise((resolve: any) =>
        resolve({
          units: String(this.priceUnits),
          amount: new BN(String(this.priceToPay)),
        } as PriceType)
      );
    }
    return super.getNamespacePrice(namespaceID).then((priceInfo: PriceType) => {
      // use v2 scheme
      if (!priceInfo.units) {
        priceInfo = {
          units: 'BTC',
          amount: new BN(String(priceInfo)),
        } as PriceType;
      }
      return priceInfo;
    });
  }

  getNamespaceBurnAddress(
    namespace: string,
    useCLI: boolean = true,
    receiveFeesPeriod: number = -1
  ): Promise<string> {
    // override with CLI option
    if (this.namespaceBurnAddress && useCLI) {
      return new Promise((resolve: any) => resolve(this.namespaceBurnAddress));
    }

    return Promise.all([
      fetch(`${this.blockstackAPIUrl}/v1/namespaces/${namespace}`),
      this.getBlockHeight(),
    ])
      .then(([resp, blockHeight]: [any, number]) => {
        if (resp.status === 404) {
          throw new Error(`No such namespace '${namespace}'`);
        } else if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`);
        } else {
          return Promise.all([resp.json(), blockHeight]);
        }
      })
      .then(([namespaceInfo, blockHeight]: [any, number]) => {
        let address = '1111111111111111111114oLvT2'; // default burn address
        if (namespaceInfo.version === 2) {
          // pay-to-namespace-creator if this namespace is less than $receiveFeesPeriod blocks old
          if (receiveFeesPeriod < 0) {
            receiveFeesPeriod = this.receiveFeesPeriod;
          }

          if (namespaceInfo.reveal_block + receiveFeesPeriod > blockHeight) {
            address = namespaceInfo.address;
          }
        }
        return address;
      })
      .then((address: string) => this.coerceAddress(address));
  }

  getNameInfo(name: string): Promise<NameInfoType> {
    // optionally coerce addresses
    return super.getNameInfo(name).then((ni: any) => {
      const nameInfo: NameInfoType = {
        address: this.optAlwaysCoerceAddress ? this.coerceMainnetAddress(ni.address) : ni.address,
        blockchain: ni.blockchain,
        did: ni.did,
        expire_block: ni.expire_block,
        grace_period: ni.grace_period,
        last_txid: ni.last_txid,
        renewal_deadline: ni.renewal_deadline,
        resolver: ni.resolver,
        status: ni.status,
        zonefile: ni.zonefile,
        zonefile_hash: ni.zonefile_hash,
      };
      return nameInfo;
    });
  }

  getBlockchainNameRecord(name: string): Promise<any> {
    // TODO: send to blockstack.js
    const url = `${this.blockstackAPIUrl}/v1/blockchains/bitcoin/names/${name}`;
    return fetch(url)
      .then(resp => {
        if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`);
        } else {
          return resp.json();
        }
      })
      .then(nameInfo => {
        // coerce all addresses
        const fixedAddresses: Record<string, any> = {};
        for (const addrAttr of ['address', 'importer_address', 'recipient_address']) {
          if (nameInfo.hasOwnProperty(addrAttr) && nameInfo[addrAttr]) {
            fixedAddresses[addrAttr] = this.coerceAddress(nameInfo[addrAttr]);
          }
        }
        return Object.assign(nameInfo, fixedAddresses);
      });
  }

  getNameHistory(name: string, page: number): Promise<Record<string, any[]>> {
    // TODO: send to blockstack.js
    const url = `${this.blockstackAPIUrl}/v1/names/${name}/history?page=${page}`;
    return fetch(url)
      .then(resp => {
        if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`);
        }
        return resp.json();
      })
      .then(historyInfo => {
        // coerce all addresses
        const fixedHistory: Record<string, any[]> = {};
        for (const historyBlock of Object.keys(historyInfo)) {
          const fixedHistoryList: any[] = [];
          for (const historyEntry of historyInfo[historyBlock]) {
            const fixedAddresses: Record<string, string> = {};
            let fixedHistoryEntry: any = {};
            for (const addrAttr of ['address', 'importer_address', 'recipient_address']) {
              if (historyEntry.hasOwnProperty(addrAttr) && historyEntry[addrAttr]) {
                fixedAddresses[addrAttr] = this.coerceAddress(historyEntry[addrAttr]);
              }
            }
            fixedHistoryEntry = Object.assign(historyEntry, fixedAddresses);
            fixedHistoryList.push(fixedHistoryEntry);
          }
          fixedHistory[historyBlock] = fixedHistoryList;
        }
        return fixedHistory;
      });
  }
}

/*
 * Instantiate a network using settings from the config file.
 */
export function getNetwork(configData: CLI_CONFIG_TYPE, regTest: boolean): BlockstackNetwork {
  if (regTest) {
    const network = new blockstack.network.LocalRegtest(
      configData.blockstackAPIUrl,
      configData.broadcastServiceUrl,
      new blockstack.network.BitcoindAPI(configData.utxoServiceUrl, {
        username: configData.bitcoindUsername || 'blockstack',
        password: configData.bitcoindPassword || 'blockstacksystem',
      })
    );

    return network;
  } else {
    const network = new BlockstackNetwork(
      configData.blockstackAPIUrl,
      configData.broadcastServiceUrl,
      new blockstack.network.BlockchainInfoApi(configData.utxoServiceUrl)
    );

    return network;
  }
}
