interface MintOptions {
  amount: number; // (amount uint)
  destination: string; // (destination principal)
  depositTxid: string; // (deposit-txid (buff 32))
  burnChainHeight: number; // (burn-chain-height uint)
  merkleProof: string[]; // (merkle-proof (list 14 (buff 32)))
  txIndex: number; // (tx-index uint)
  treeDepth: number; // (tree-depth uint)
  blockHeader: string; // (block-header (buff 80)))
}

export class sBTCClient {
  constructor(public network: StacksNetwork) {}

  /**

   */
  async mint(options: MintOptions): Promise<void> {
    const [contractAddress, contractName] = this.parseContractId(options?.contractId);
    const result = await callReadOnlyFunction({
      network: this.network,
      senderAddress: this.address,
      contractAddress,
      contractName,
      functionArgs: [uintCV(options.rewardCyleId), uintCV(options.rewardSetIndex)],
      functionName: 'get-reward-set-pox-address',
    });

    return unwrapMap(result as OptionalCV<TupleCV>, tuple => ({
      pox_address: {
        version: ((tuple.data['pox-addr'] as TupleCV).data['version'] as BufferCV).buffer,
        hashbytes: ((tuple.data['pox-addr'] as TupleCV).data['hashbytes'] as BufferCV).buffer,
      },
      total_ustx: (tuple.data['total-ustx'] as UIntCV).value,
    }));
  }
}
