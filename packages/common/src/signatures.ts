import { hexToInt } from './utils';

const COORDINATE_BYTES = 32;

/** @ignore */
export function parseRecoverableSignatureVrs(signature: string) {
  // todo: prefer RSV format or add format options of message signing functions
  if (signature.length < COORDINATE_BYTES * 2 * 2 + 1) {
    throw new Error('Invalid signature');
  }
  const recoveryIdHex = signature.slice(0, 2);
  const r = signature.slice(2, 2 + COORDINATE_BYTES * 2);
  const s = signature.slice(2 + COORDINATE_BYTES * 2);
  return {
    recoveryId: hexToInt(recoveryIdHex),
    r,
    s,
  };
}

/** @ignore */
export function signatureVrsToRsv(signature: string) {
  return signature.slice(2) + signature.slice(0, 2);
}

/** @ignore */
export function signatureRsvToVrs(signature: string) {
  return signature.slice(-2) + signature.slice(0, -2);
}
