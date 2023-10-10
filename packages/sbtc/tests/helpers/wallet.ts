import { ProjectivePoint } from '@noble/secp256k1';

export function schnorrPublicKey(privateKey: Uint8Array) {
  return ProjectivePoint.fromPrivateKey(privateKey).toRawBytes(true).slice(1);
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
