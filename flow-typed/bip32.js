declare module 'bip32' {
  declare class BIP32 {
    depth: number;
    parentFingerprint: number;
    index: number;
    publicKey: Buffer;
    privateKey: Buffer;
    chainCode: Buffer;
    network: Network;
    fingerprint: Buffer;
    identifier: Buffer;
    static fromBase58(
      str: string,
      networks: ?(Array<Network> | Network)
    ): BIP32;
    derive(index: number): BIP32;
    deriveHardened(index: number): BIP32;
    derivePath(path: string): BIP32;
    toBase58(): string;
    constructor(keyPair: ECPair, chainCode: Buffer): void;

    static fromBase58(
      base: string,
      network?: ?(Network | Array<Network>)
    ): BIP32;
    static fromSeedHex(seed: string, network?: ?Network): BIP32;
    static fromSeedBuffer(seed: Buffer, network?: ?Network): BIP32;
    getPublicKeyBuffer(): Buffer;

    sign(): ECSignature;
    verify(hash: Buffer, signature: ECSignature): Buffer;
    neutered(): BIP32;
    isNeutered(): boolean;
    constructor(keyPair: ECPair, chainCode: Buffer): void;
    static HIGHEST_BIT: number;
  }
}
