import * as btc from '@scure/btc-signer';
import { Cl } from '@stacks/transactions';

// https://blockstream.info/api/address/1KFHE7w8BhaENAswwryaoccDb6qcT6DbYY/utxo
// [{"txid":"033e44b535c5709d30234921608219ee5ca1e320fa9def44715eaeb2b7ad52d3","vout":0,"status":{"confirmed":false},"value":42200}]
export type BlockstreamUtxo = {
  txid: string;
  vout: number;
  value: number;
  status:
    | {
        confirmed: false;
      }
    | {
        confirmed: true;
        block_height: number;
        block_hash: string;
        block_time: number;
      };
};

export type BlockstreamUtxoWithTxHex = BlockstreamUtxo & {
  hex: string;
};

export async function fetchUtxos(address: string): Promise<BlockstreamUtxo[]> {
  // todo: error handling?
  return (await fetch(`https://blockstream.info/testnet/api/address/${address}/utxo`).then(res =>
    res.json()
  )) as BlockstreamUtxo[];
}

export async function fetchTxHex(txid: string): Promise<string> {
  // todo: error handling?
  return await fetch(`https://blockstream.info/testnet/api/tx/${txid}/hex`).then(res => res.text());
}

type BlockstreamFeeEstimates = {
  [K in
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '11'
    | '12'
    | '13'
    | '14'
    | '15'
    | '16'
    | '17'
    | '18'
    | '19'
    | '20'
    | '21'
    | '22'
    | '23'
    | '24'
    | '25'
    | '144'
    | '504'
    | '1008']: number;
};

export async function estimateFeeRates(): Promise<BlockstreamFeeEstimates> {
  return await fetch(`https://blockstream.info/testnet/api/fee-estimates`).then(res => res.json());
}

export async function estimateFeeRate(target: 'low' | 'medium' | 'high' | number): Promise<number> {
  const feeEstimates = await estimateFeeRates();
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

export async function broadcastTx(tx: btc.Transaction): Promise<string> {
  return await fetch(`https://blockstream.info/testnet/api/tx`, {
    method: 'POST',
    body: tx.hex,
  }).then(res => res.text());
}

export async function stacksCallReadOnly({
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

// export async function informBridgeApi(txid: string) {
//   // todo
//   return 'txid';
// }
