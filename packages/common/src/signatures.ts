import { hexToInt } from './utils';

export function parseRecoverableSignature(signature: string) {
  const coordinateValueBytes = 32;
  if (signature.length < coordinateValueBytes * 2 * 2 + 1) {
    throw new Error('Invalid signature');
  }
  const r = signature.substr(0, coordinateValueBytes * 2);
  const s = signature.substr(coordinateValueBytes * 2, coordinateValueBytes * 2);
  const recoveryParamHex = signature.substr(coordinateValueBytes * 2 * 2, 2);
  return {
    r,
    s,
    recoveryParam: hexToInt(recoveryParamHex),
  };
}
