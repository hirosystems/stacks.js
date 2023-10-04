import RpcClient from '@btc-helpers/rpc';
import { RpcCallSpec } from '@btc-helpers/rpc/dist/callspec';
import * as btc from '@scure/btc-signer';
import { COINBASE_BYTES_LENGTH, Cl } from '@stacks/transactions';
import { wrapLazyProxy } from './utils';

/** todo */
// https://blockstream.info/api/address/1KFHE7w8BhaENAswwryaoccDb6qcT6DbYY/utxo
// [{"txid":"033e44b535c5709d30234921608219ee5ca1e320fa9def44715eaeb2b7ad52d3","vout":0,"status":{"confirmed":false},"value":42200}]
export type BlockstreamUtxo = {
  txid: string;
  vout: number;
  value: number;
  status: {
    confirmed: boolean;
  };
};

/** todo */
export type UtxoWithTx = BlockstreamUtxo & {
  tx: string | Promise<string>;
};

export type SpendableUtxo = BlockstreamUtxo & {
  input: btc.TransactionInput | Promise<btc.TransactionInput>;
  vsize?: number | Promise<number>;
};

/** todo */
export type BlockstreamFeeEstimates =
  // prettier-ignore
  { [K in | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20' | '21' | '22' | '23' | '24' | '25' | '144' | '504' | '1008']: number; };

export class TestnetHelper {
  async fetchUtxos(address: string): Promise<UtxoWithTx[]> {
    // todo: error handling?
    return fetch(`https://blockstream.info/testnet/api/address/${address}/utxo`)
      .then(res => res.json())
      .then((utxos: BlockstreamUtxo[]) =>
        utxos.map(u => wrapLazyProxy(u, 'tx', () => this.fetchTxHex(u.txid)))
      );
  }

  async fetchTxHex(txid: string): Promise<string> {
    // todo: error handling?
    return fetch(`https://blockstream.info/testnet/api/tx/${txid}/hex`).then(res => res.text());
  }

  async estimateFeeRates(): Promise<BlockstreamFeeEstimates> {
    return fetch(`https://blockstream.info/testnet/api/fee-estimates`).then(res => res.json());
  }

  async estimateFeeRate(target: 'low' | 'medium' | 'high' | number): Promise<number> {
    const feeEstimates = await this.estimateFeeRates();
    const t =
      typeof target === 'number'
        ? target.toString()
        : target === 'high'
        ? '1'
        : target === 'medium'
        ? '2'
        : '3';
    if (t in feeEstimates) {
      return feeEstimates[t as keyof BlockstreamFeeEstimates];
    }

    throw new Error(`Invalid fee target: ${target}`);
  }

  async broadcastTx(tx: btc.Transaction): Promise<string> {
    return await fetch(`https://blockstream.info/testnet/api/tx`, {
      method: 'POST',
      body: tx.hex,
    }).then(res => res.text());
  }

  async stacksCallReadOnly({
    contractAddress,
    functionName,
    sender = 'ST000000000000000000002AMW42H',
    args = [],
  }: {
    contractAddress: string;
    functionName: string;
    sender?: string;
    args?: string[];
  }) {
    contractAddress = contractAddress.replace('.', '/');
    return await fetch(
      `https://api.testnet.hiro.so/v2/contracts/call-read/${contractAddress}/${encodeURIComponent(
        functionName
      )}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sender, arguments: args }),
      }
    )
      .then(res => res.json())
      .then(res => Cl.deserialize(res.result));
  }
}

/** todo */
export interface DevEnvConfig {
  bitcoinCoreRpcUrl: string;
  bitcoinElectrumApiUrl: string; // electrs
  bitcoinExplorerUrl: string; // explorer can access electrum
  stacksApiUrl: string;
  sbtcBridgeApiUrl: string;
}

// todo: rename to helper, and add wallets etc.
export class DevEnvHelper {
  config: DevEnvConfig;
  btcRpc: RpcClient & RpcCallSpec;

  constructor(config?: Partial<DevEnvConfig>) {
    this.config = Object.assign(
      {
        bitcoinCoreRpcUrl: 'http://devnet:devnet@127.0.0.1:18443',
        bitcoinElectrumApiUrl: 'http://127.0.0.1:60401',
        bitcoinExplorerUrl: 'http://127.0.0.1:3002',
        stacksApiUrl: 'http://127.0.0.1:3999',
        sbtcBridgeApiUrl: 'http://127.0.0.1:3010',
      },
      config
    );

    this.btcRpc = new RpcClient(this.config.bitcoinCoreRpcUrl).Typed;
  }

  /**
   * Fetches utxos for a given address.
   * If no utxos are found, imports the address, rescans, and tries again.
   * @param address address or script hash of wallet to fetch utxos for
   */
  async fetchUtxos(address: string): Promise<UtxoWithTx[]> {
    let unspent = await this.btcRpc.listunspent({
      addresses: [address],
    });

    if (unspent?.length === 0) {
      const addressInfo = await this.btcRpc.getaddressinfo({ address });
      if (!addressInfo.iswatchonly) {
        // only import if not already imported
        await this.btcRpc.importaddress({ address, rescan: true });
        unspent = await this.btcRpc.listunspent({
          addresses: [address],
        });
      }
    }

    const utxos = unspent.map((u: any) => ({
      txid: u.txid,
      vout: u.vout,
      value: Math.round(u.amount * 1e8), // Bitcoin to satoshis
      confirmed: u.confirmations > 0,
    }));

    for (const u of utxos) {
      u.tx = await this.fetchTxHex(u.txid); // sequential, to soften the load on the work queue
    }

    return utxos;
  }

  async fetchTxHex(txid: string): Promise<string> {
    return this.btcRpc.gettransaction({ txid }).then((tx: any) => tx.hex);
  }

  /**
   */
  async getBalance(address: string): Promise<number> {
    const addressInfo = await fetch(
      `${this.config.bitcoinExplorerUrl}/api/address/${address}`
    ).then(r => r.json());

    return addressInfo.txHistory.balanceSat;
  }

  // Fake impl for devenv
  // eslint-disable-next-line @typescript-eslint/require-await
  async estimateFeeRate(target: 'low' | 'medium' | 'high' | number): Promise<number> {
    switch (target) {
      case 'high':
        return 1;
      case 'medium':
        return 2;
      case 'low':
        return 3;
      default:
        return target;
    }
  }

  async broadcastTx(tx: btc.Transaction): Promise<string> {
    return await this.btcRpc.sendrawtransaction({ hexstring: tx.hex, maxfeerate: 1000 });
  }
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
