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
import { hexToBytes } from '@stacks/common';

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

export type SbtcApiNotifyResponse = {
  bitcoinTxid: string;
  bitcoinTxOutputIndex: number;
  recipient: string;
  amount: number;
  lastUpdateHeight: number;
  lastUpdateBlockHash: string;
  status: string;
  statusMessage: string;
  parameters: {
    maxFee: number;
    lockTime: number;
  };
  reclaimScript: string;
  depositScript: string;
};

export interface BaseClientConfig {
  sbtcContract: string;

  btcApiUrl: string;
  stxApiUrl: string;
  sbtcApiUrl: string;
}

export class SbtcApiClient {
  constructor(public config: BaseClientConfig) {}

  async fetchUtxos(address: string): Promise<UtxoWithTx[]> {
    return (
      fetch(`${this.config.btcApiUrl}/address/${address}/utxo`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
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
    return fetch(`${this.config.btcApiUrl}/tx/${txid}/hex`, {
      headers: {
        Accept: 'text/plain',
        'Content-Type': 'text/plain',
        'Accept-Encoding': 'identity',
      },
    }).then(res => res.text());
  }

  async fetchFeeRates(): Promise<MempoolFeeEstimates> {
    return fetch(`${this.config.btcApiUrl}/v1/fees/recommended`).then(res => res.json());
  }

  async fetchFeeRate(target: 'low' | 'medium' | 'high'): Promise<number> {
    const feeEstimates = await this.fetchFeeRates();
    const t = target === 'high' ? 'fastestFee' : target === 'medium' ? 'halfHourFee' : 'hourFee';
    return feeEstimates[t];
  }

  async broadcastTx(tx: btc.Transaction): Promise<string> {
    return await fetch(`${this.config.btcApiUrl}/tx`, {
      method: 'POST',
      headers: { Accept: 'text/plain', 'Content-Type': 'text/plain' },
      body: tx.hex,
    }).then(res => {
      try {
        return res.text() as Promise<string>;
      } catch (e) {
        return res.json() as Promise<string>; // the proxy might need a fallback decode
      }
    });
  }

  async notifySbtc({
    depositScript,
    reclaimScript,
    vout = 0,
    transaction,
  }: {
    depositScript: string;
    reclaimScript: string;
    /** Optional, output index (defaults to `0`) */
    vout?: number;
    transaction: btc.Transaction | string;
  }) {
    const tx =
      typeof transaction === 'string'
        ? btc.Transaction.fromRaw(hexToBytes(transaction))
        : transaction;

    return (await fetch(`${this.config.sbtcApiUrl}/deposit`, {
      method: 'POST',
      headers: {
        // needed for CORS
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bitcoinTxid: tx.id,
        bitcoinTxOutputIndex: vout,
        depositScript,
        reclaimScript,
        transactionHex: tx.hex,
      }),
    }).then(res => res.json())) as SbtcApiNotifyResponse;
  }

  async fetchSignersPublicKey(contractAddress?: string): Promise<string> {
    const res = (await fetchCallReadOnlyFunction({
      contractAddress: contractAddress ?? this.config.sbtcContract,
      contractName: 'sbtc-registry',
      functionName: 'get-current-aggregate-pubkey',
      functionArgs: [],
      senderAddress: STACKS_DEVNET.bootAddress, // zero address
      client: { baseUrl: this.config.stxApiUrl },
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
    const addressInfo = await fetch(`${this.config.btcApiUrl}/address/${address}`).then(r =>
      r.json()
    );

    return addressInfo.chain_stats.funded_txo_sum - addressInfo.chain_stats.spent_txo_sum;
  }

  async fetchSbtcBalance(stacksAddress: string) {
    const balance = (await this.fetchCallReadOnly({
      contractAddress: this.config.sbtcContract,
      functionName: 'get-balance',
      args: [Cl.address(stacksAddress)],
    })) as SomeCV<UIntCV>;

    return balance?.value?.value ?? 0;
  }

  async fetchDeposit(txid: string): Promise<SbtcApiNotifyResponse>;
  async fetchDeposit({
    txid,
    vout = 0,
  }: {
    txid: string;
    vout: number;
  }): Promise<SbtcApiNotifyResponse>;
  async fetchDeposit(param: string | { txid: string; vout: number }) {
    if (typeof param === 'string') return this.fetchDeposit({ txid: param, vout: 0 });

    const { txid, vout } = param;
    return await fetch(`${this.config.sbtcApiUrl}/deposit/${txid}/${vout}`).then(
      r => r.json() as Promise<SbtcApiNotifyResponse>
    );
  }
}

// todo: add async fetchDeposits('pending' | 'confirmed')

export class SbtcApiClientMainnet extends SbtcApiClient {
  constructor(config?: Partial<BaseClientConfig>) {
    super(
      Object.assign(
        {
          btcApiUrl: 'https://mempool.space/api',
          stxApiUrl: 'https://api.hiro.so',
          sbtcApiUrl: 'https://sbtc-emily.com',
          sbtcContract: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
        },
        config
      )
    );
  }
}

export class SbtcApiClientTestnet extends SbtcApiClient {
  constructor(config?: Partial<BaseClientConfig>) {
    super(
      Object.assign(
        {
          btcApiUrl: 'https://beta.sbtc-mempool.tech/api/proxy',
          stxApiUrl: 'https://api.testnet.hiro.so',
          sbtcApiUrl: 'https://beta.sbtc-emily.com',
          /** ⚠︎ Attention: This contract address might still change over the course of the sBTC contract on Testnet */
          sbtcContract: 'SNGWPN3XDAQE673MXYXF81016M50NHF5X5PWWM70',
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
          btcApiUrl: 'http://localhost:3010/api/proxy',
          stxApiUrl: 'http://localhost:3999',
          sbtcApiUrl: 'http://localhost:3031',
          sbtcContract: 'SN3R84XZYA63QS28932XQF3G1J8R9PC3W76P9CSQS',
        },
        config
      )
    );
  }
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
