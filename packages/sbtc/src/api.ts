import * as btc from '@scure/btc-signer';
import { TransactionInput } from '@scure/btc-signer/psbt';
import { STACKS_DEVNET } from '@stacks/network';
import {
  BufferCV,
  Cl,
  ClarityValue,
  SomeCV,
  UIntCV,
  fetchCallReadOnlyFunction,
} from '@stacks/transactions';
import { REGTEST } from './constants';
import { wrapLazyProxy } from './utils';

/** todo */
// https://blockstream.info/api/address/1KFHE7w8BhaENAswwryaoccDb6qcT6DbYY/utxo
// [{"txid":"033e44b535c5709d30234921608219ee5ca1e320fa9def44715eaeb2b7ad52d3","vout":0,"status":{"confirmed":false},"value":42200}]
export type MempoolApiUtxo = {
  txid: string;
  vout: number;
  value: number;
  status?: {
    confirmed: boolean;
    block_height: number;
  };
};

/** todo */
export type UtxoWithTx = MempoolApiUtxo & {
  tx: string | Promise<string>;
};

export type SpendableUtxo = MempoolApiUtxo & {
  input: TransactionInput | Promise<TransactionInput>;
  vsize?: number | Promise<number>;
};

export type MempoolFeeEstimates = {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  // economyFee: number;
  // minimumFee: number;
};

export interface BaseClientConfig {
  sbtcContract: string;

  sbtcApiUrl: string;
  btcMempoolApiUrl: string;
  stxApiUrl: string;
}

export class SbtcApiClient {
  constructor(public config: BaseClientConfig) {}

  async fetchUtxos(address: string): Promise<UtxoWithTx[]> {
    return (
      fetch(`${this.config.btcMempoolApiUrl}/address/${address}/utxo`)
        .then(res => res.json())
        // .then((utxos: MempoolApiUtxo[]) =>
        //   utxos.sort((a, b) => a.status.block_height - b.status.block_height)
        // )
        .then((utxos: MempoolApiUtxo[]) =>
          utxos.map(u => wrapLazyProxy(u, 'tx', () => this.fetchTxHex(u.txid)))
        )
    );
  }

  async fetchTxHex(txid: string): Promise<string> {
    return fetch(`${this.config.btcMempoolApiUrl}/api/tx/${txid}/hex`).then(res => res.text());
  }

  async fetchFeeRates(): Promise<MempoolFeeEstimates> {
    return fetch(`${this.config.btcMempoolApiUrl}/api/v1/fees/recommended`).then(res => res.json());
  }

  async fetchFeeRate(target: 'low' | 'medium' | 'high'): Promise<number> {
    const feeEstimates = await this.fetchFeeRates();
    const t = target === 'high' ? 'fastestFee' : target === 'medium' ? 'halfHourFee' : 'hourFee';
    return feeEstimates[t];
  }

  async broadcastTx(tx: btc.Transaction): Promise<string> {
    return await fetch(`${this.config.btcMempoolApiUrl}/tx`, {
      method: 'POST',
      body: tx.hex,
    }).then(res => res.text());
  }

  async fetchSignersPublicKey(contractAddress?: string): Promise<string> {
    const res = (await fetchCallReadOnlyFunction({
      contractAddress: contractAddress ?? this.config.sbtcContract,
      contractName: 'sbtc-registry',
      functionName: 'get-current-aggregate-pubkey',
      functionArgs: [],
      senderAddress: STACKS_DEVNET.bootAddress, // zero address
      client: {
        baseUrl: this.config.stxApiUrl,
      },
    })) as BufferCV;

    return res.value.slice(2);
  }

  async fetchSignersAddress(contractAddress?: string): Promise<string> {
    const pub = await this.fetchSignersPublicKey(contractAddress ?? this.config.sbtcContract);
    return btc.p2tr(pub, undefined, REGTEST).address!;
  }

  async fetchCallReadOnly({
    contractAddress,
    functionName,
    args = [],
    sender = STACKS_DEVNET.bootAddress, // zero address
  }: {
    contractAddress: string;
    functionName: string;
    args?: ClarityValue[];
    sender?: string;
  }) {
    contractAddress = contractAddress.replace('.', '/');
    return await fetch(
      `${this.config.stxApiUrl}/v2/contracts/call-read/${contractAddress}/${encodeURIComponent(
        functionName
      )}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sender, arguments: args.map(Cl.serialize) }),
      }
    )
      .then(res => res.json())
      .then(res => Cl.deserialize(res.result));
  }

  /** Get BTC balance (in satoshis) */
  async fetchBalance(address: string): Promise<number> {
    // todo: check if better endpoints now exist
    const addressInfo = await fetch(`${this.config.btcMempoolApiUrl}/address/${address}`).then(r =>
      r.json()
    );

    return addressInfo.chain_stats.funded_txo_sum - addressInfo.chain_stats.spent_txo_sum;
  }

  async fetchSbtcBalance(stacksAddress: string) {
    const [address, name] = stacksAddress.split('.');

    const balance = (await this.fetchCallReadOnly({
      contractAddress: this.config.sbtcContract,
      functionName: 'get-balance',
      args: [name ? Cl.contractPrincipal(address, name) : Cl.standardPrincipal(address)],
    })) as SomeCV<UIntCV>;

    return balance?.value?.value ?? 0;
  }
}

export class SbtcApiClientTestnet extends SbtcApiClient {
  constructor(config?: Partial<BaseClientConfig>) {
    super(
      Object.assign(
        {
          sbtcApiUrl: 'https://sbtc.tech', // todo: get real url
          btcMempoolApiUrl: 'https://blockstream.info/testnet/api', // todo: mempool it
          stxApiUrl: 'https://stacks-node-api.testnet.stacks.co',
          sbtcContract: 'SN3R84XZYA63QS28932XQF3G1J8R9PC3W76P9CSQS', // todo: find final value
        },
        config
      )
    );
  }
}

export class SbtcApiClientDevenv extends SbtcApiClient {
  constructor(config?: Partial<BaseClientConfig>) {
    super(
      Object.assign(
        {
          sbtcApiUrl: 'http://localhost:3031', // todo: get real url
          btcMempoolApiUrl: 'http://localhost:8083',
          stxApiUrl: 'http://localhost:3999',
          sbtcContract: 'SN3R84XZYA63QS28932XQF3G1J8R9PC3W76P9CSQS',
        },
        config
      )
    );
  }
}

// export class TestnetHelper extends SbtcApiClient {
//   constructor(config?: Partial<BaseUrlConfig>) {
//     super(
//       Object.assign(
//         {
//           bitcoinElectrsApiUrl: 'https://blockstream.info/testnet/api',
//           stacksApiUrl: 'https://stacks-node-api.testnet.stacks.co',
//         },
//         config
//       )
//     );
//   }

//   async getSbtcPegAddress(contractAddress = SBTC_FT_ADDRESS_TESTNET): Promise<string> {
//     const publicKey = (
//       (await this.fetchCallReadOnly({
//         contractAddress,
//         functionName: 'get-bitcoin-wallet-public-key',
//       })) as SomeCV<BufferCV>
//     ).value.buffer;

//     const tr = btc.p2tr(
//       publicKey.length === 33 ? publicKey.subarray(1) : publicKey, // strip y byte
//       undefined,
//       TESTNET
//     );
//     return tr.address!;
//   }

//   async getBitcoinAccount(mnemonic: string, idx: number = 0) {
//     return await getBitcoinAccount(TESTNET, mnemonic, idx);
//   }

//   async getStacksAccount(mnemonic: string, idx: number = 0) {
//     return await getStacksAccount(TransactionVersion.Testnet, mnemonic, idx);
//   }
// }

// export class DevEnvHelper extends SbtcApiClient {
//   btcRpc: RpcClient & RpcCallSpec;

//   constructor(config?: Partial<BaseUrlConfig & { bitcoinCoreRpcUrl: string }>) {
//     super(
//       Object.assign(
//         {
//           bitcoinElectrsApiUrl: 'http://127.0.0.1:3002',
//           stacksApiUrl: 'http://127.0.0.1:3999',
//         },
//         config
//       )
//     );

//     const bitcoinCoreRpcUrl = config?.bitcoinCoreRpcUrl ?? 'http://devnet:devnet@127.0.0.1:18433';
//     this.btcRpc = new RpcClient(bitcoinCoreRpcUrl).Typed;
//   }

//   async getSbtcPegAddress(): Promise<string> {
//     const pegAccount = await this.getBitcoinAccount(WALLET_00);
//     return pegAccount.tr.address;
//   }

//   async getBitcoinAccount(mnemonic: string, idx: number = 0) {
//     return await getBitcoinAccount(REGTEST, mnemonic, idx);
//   }

//   async getStacksAccount(mnemonic: string, idx: number = 0) {
//     return await getStacksAccount(TransactionVersion.Testnet, mnemonic, idx);
//   }
// }

// // == WALLET ===================================================================

// export const WALLET_00 =
//   'twice kind fence tip hidden tilt action fragile skin nothing glory cousin green tomorrow spring wrist shed math olympic multiply hip blue scout claw';
// export const WALLET_01 =
//   'sell invite acquire kitten bamboo drastic jelly vivid peace spawn twice guilt pave pen trash pretty park cube fragile unaware remain midnight betray rebuild';
// export const WALLET_02 =
//   'hold excess usual excess ring elephant install account glad dry fragile donkey gaze humble truck breeze nation gasp vacuum limb head keep delay hospital';

// export async function getBitcoinAccount(
//   network: BitcoinNetwork,
//   mnemonic: string,
//   idx: number = 0
// ) {
//   const seed = await bip39.mnemonicToSeed(mnemonic);
//   const hdkey = HDKey.fromMasterSeed(seed, network.bip32);

//   const path = `m/84'/${network.bip84.coin}'/${idx}'/0/0`;
//   const privateKey = hdkey.derive(path).privateKey!;
//   const publicKey = hdkey.derive(path).publicKey!;

//   const trPath = `m/86'/${network.bip84.coin}'/${idx}'/0/0`;
//   const trPrivateKey = hdkey.derive(trPath).privateKey!;
//   const trPublicKey = hdkey.derive(trPath).publicKey!; // not sure if this should be used, but this is what the CLI returns

//   return {
//     privateKey,
//     publicKey,
//     wpkh: { address: btc.getAddress('wpkh', privateKey, network)! },
//     tr: {
//       address: btc.getAddress('tr', trPrivateKey, network)!,
//       publicKey: trPublicKey,
//     },
//   };
// }

// export async function getStacksAccount(
//   transactionVersion: TransactionVersion,
//   mnemonic: string,
//   idx: number = 0
// ) {
//   const rootPrivateKey = await bip39.mnemonicToSeed(mnemonic);
//   const rootNode = HDKey.fromMasterSeed(rootPrivateKey);

//   const childKey = rootNode.derive(`m/44'/5757'/0'/0`).deriveChild(idx);
//   const stxPrivateKey = bytesToHex(compressPrivateKey(childKey.privateKey!));

//   return {
//     /** Alias for `privateKey` @deprecated use `.privateKey` instead */
//     stxPrivateKey,
//     privateKey: stxPrivateKey,
//     address: getAddressFromPrivateKey(stxPrivateKey, transactionVersion),
//   };
// }

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
