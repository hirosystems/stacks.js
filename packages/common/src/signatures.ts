import { hexToInt } from './utils';

export function parseRecoverableSignature(signature: string) {
  const coordinateValueBytes = 32;
  if (signature.length < coordinateValueBytes * 2 * 2 + 1) {
    throw new Error('Invalid signature');
  }
  const recoveryParamHex = signature.substr(0, 2);
  const r = signature.substr(2, coordinateValueBytes * 2);
  const s = signature.substr(2 + coordinateValueBytes * 2, coordinateValueBytes * 2);
  return {
    recoveryParam: hexToInt(recoveryParamHex),
    r,
    s,
  };
}
