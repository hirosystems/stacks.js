import bitcoin from 'bitcoinjs-lib'

// TODO: get this merged into @types/bitcoinjs-lib package
declare module 'bitcoinjs-lib' {
  namespace payments {
    export function embed(
      a: { network?: bitcoin.Network, output?: Buffer, data?: Buffer[] }, 
      opts?: { validate?: boolean }): { output: Buffer, data: Buffer[] };
  }
}
