/**
 * Calculate the AES-CBC ciphertext output byte length a given input length.
 * AES has a fixed block size of 16-bytes regardless key size.
 * @ignore
 */
export function getAesCbcOutputLength(inputByteLength: number) {
  // AES-CBC block mode rounds up to the next block size.
  const cipherTextLength = (Math.floor(inputByteLength / 16) + 1) * 16;
  return cipherTextLength;
}

/**
 * Calculate the base64 encoded string length for a given input length.
 * This is equivalent to the byte length when the string is ASCII or UTF8-8
 * encoded.
 * @param number
 */
export function getBase64OutputLength(inputByteLength: number) {
  const encodedLength = Math.ceil(inputByteLength / 3) * 4;
  return encodedLength;
}

/**
 *
 * @ignore
 */
export function hashCode(string: string) {
  let hash = 0;
  if (string.length === 0) return hash;
  for (let i = 0; i < string.length; i++) {
    const character = string.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash &= hash;
  }
  return hash & 0x7fffffff;
}
