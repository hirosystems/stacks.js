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
    static fromSeed(seed: Buffer, network?: ?Network): BIP32;
    getPublicKeyBuffer(): Buffer;
    derive(index: number): BIP32;
    deriveHardened(index: number): BIP32;
    derivePath(path: string): BIP32;
    toBase58(): string;
    sign(): ECSignature;
    verify(hash: Buffer, signature: ECSignature): Buffer;
    neutered(): BIP32;
    isNeutered(): boolean;
    static HIGHEST_BIT: number;
    constructor(keyPair: ECPair, chainCode: Buffer): void;
  }

  declare export default typeof BIP32;
}
