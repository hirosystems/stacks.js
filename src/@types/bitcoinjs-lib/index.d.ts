import bitcoin from 'bitcoinjs-lib'

/**
 * Note: This fixes is a bug in the 3rd party type defs for bitcoinjs. 
 * The bitcoinjs repo appears to be being ported to Typescript, so 
 * the next release is likely going to include its own (accurate) typing 
 * defs and we can then remove this. 
 */
declare module 'bitcoinjs-lib' {
  namespace payments {
    export function embed(
      a: { network?: bitcoin.Network, output?: Buffer, data?: Buffer[] }, 
      opts?: { validate?: boolean }): { output: Buffer, data: Buffer[] };
  }
}
