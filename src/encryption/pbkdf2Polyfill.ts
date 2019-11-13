/* 
An async implementation for browsers that support WebCrypto hash & hmac 
but not pbkdf2.

Extracted from crypto-browserify/pbkdf2 and modified to use WebCrypto
for hashing/hmac operations.

See original at: https://github.com/crypto-browserify/pbkdf2/tree/v3.0.17/lib
*/


function createHmacDigest(algorithm: 'sha512' | 'sha256') {
  let algo: string
  if (algorithm === 'sha256') {
    algo = 'SHA-256'
  } else if (algorithm === 'sha512') {
    algo = 'SHA-512'
  } else {
    throw new Error(`Unsupported hash algorithm ${algorithm}`)
  }
  const subtleCrypto = crypto.subtle
  const algoOpts = { name: 'HMAC', hash: algo }
  return async (key: Buffer, data: Buffer) => {
    const cryptoKey = await subtleCrypto.importKey('raw', key, algoOpts, true, ['sign'])
    const sig = await subtleCrypto.sign(algoOpts, cryptoKey, data)
    return Buffer.from(sig)
  }
}

export default async function pbkdf2(
  key: Buffer, 
  salt: Buffer, 
  iterations: number, 
  keyLength: number, 
  algorithm: 'sha256' | 'sha512'
) {
  const hmacDigest = createHmacDigest(algorithm)

  const DK = Buffer.alloc(keyLength)
  const saltLength = salt.length
  const block1 = Buffer.alloc(saltLength + 4)
  salt.copy(block1, 0, 0, saltLength)

  let destPos = 0

  const hLen = algorithm === 'sha512' ? 64 : 32
  const l = Math.ceil(keyLength / hLen)

  for (let i = 1; i <= l; i++) {
    block1.writeUInt32BE(i, saltLength)

    // eslint-disable-next-line no-await-in-loop
    const T = await hmacDigest(key, block1)
    let U = T

    for (let j = 1; j < iterations; j++) {
      // eslint-disable-next-line no-await-in-loop
      U = await hmacDigest(key, U)
      for (let k = 0; k < hLen; k++) {
        T[k] ^= U[k]
      }
    }
    T.copy(DK, destPos)
    destPos += hLen
  }
  return DK
}

function createDigest(algorithm: 'sha512' | 'sha256') {
  let algo: string
  if (algorithm === 'sha256') {
    algo = 'SHA-256'
  } else if (algorithm === 'sha512') {
    algo = 'SHA-512'
  } else {
    throw new Error(`Unsupported hash algorithm ${algorithm}`)
  }
  const subtleCrypto = crypto.subtle
  return async (data: Buffer) => {
    const hash = await subtleCrypto.digest(algo, data)
    return Buffer.from(hash)
  }
}

export async function pbkdf2NoHmacSupport(
  key: Buffer, 
  salt: Buffer, 
  iterations: number, 
  keyLength: number, 
  algorithm: 'sha256' | 'sha512'
) {
  const hash = createDigest(algorithm)
  const saltLength = salt.length
  const blocksize = algorithm === 'sha512' ? 128 : 64
  const size = algorithm === 'sha512' ? 64 : 32

  if (key.length > blocksize) {
    key = await hash(key)
  } else if (key.length < blocksize) {
    const ZEROS = Buffer.alloc(128)
    key = Buffer.concat([key, ZEROS], blocksize)
  }

  const ipad2 = Buffer.alloc(blocksize + size)
  const opad = Buffer.alloc(blocksize + size)
  for (let i = 0; i < blocksize; i++) {
    ipad2[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  const ipad1 = Buffer.alloc(blocksize + saltLength + 4)
  ipad2.copy(ipad1, 0, 0, blocksize)

  const DK = Buffer.alloc(keyLength)
  const block1 = Buffer.alloc(saltLength + 4)
  salt.copy(block1, 0, 0, saltLength)

  let destPos = 0
  const hLen = size
  const l = Math.ceil(keyLength / hLen)

  const run = async (data: Buffer, ipad: Buffer): Promise<Buffer> => {
    data.copy(ipad, blocksize)
    const h = await hash(ipad)
    h.copy(opad, blocksize)
    return hash(opad)
  }

  for (let i = 1; i <= l; i++) {
    block1.writeUInt32BE(i, saltLength)

    // eslint-disable-next-line no-await-in-loop
    const T = await run(block1, ipad1)
    let U = T

    for (let j = 1; j < iterations; j++) {
      // eslint-disable-next-line no-await-in-loop
      U = await run(U, ipad2)
      for (let k = 0; k < hLen; k++) {
        T[k] ^= U[k]
      }
    }

    T.copy(DK, destPos)
    destPos += hLen
  }

  return DK
}
