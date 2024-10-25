import * as triplesec from 'triplesec';

export function triplesecDecrypt(
  arg: { data: Uint8Array; key: Uint8Array },
  cb: (err: Error | null, buff: Uint8Array | null) => void
) {
  if (typeof Buffer === 'undefined')
    throw Error('Using triplesec currently requires polyfilling `Buffer`');

  const argBuffer = {
    data: Buffer.from(arg.data),
    key: Buffer.from(arg.key),
  };
  return triplesec.decrypt(argBuffer, (err, buff) => {
    return cb(err, buff ? new Uint8Array(buff.buffer) : null);
  });
}
