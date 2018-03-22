/* @flow */

import bitcoin from 'bitcoinjs-lib'
import { decodeB40, hash160, hash128, DUST_MINIMUM } from './utils'
import { config } from '../config'
import bigi from 'bigi'

// todo : add name length / character verification

export class BlockstackNamespace {
  namespaceID: string
  version: number
  lifetime: number
  coeff: number
  base: number
  buckets: Array<number>
  nonalphaDiscount: number
  noVowelDiscount: number

  constructor(namespaceID: string) {
    if (namespaceID.length > 19) {
      throw new Error("Namespace ID too long (19 chars max)")
    }
    if (!namespaceID.match('[0123456789abcdefghijklmnopqrstuvwxyz_-]+')) {
      throw new Error("Namespace ID can only use characters 0123456789abcdefghijklmnopqrstuvwxyz-_")
    }

    this.namespaceID = namespaceID
    this.version = -1
    this.lifetime = -1
    this.coeff = -1
    this.base = -1
    this.buckets = [-1]
    this.nonalphaDiscount = -1
    this.noVowelDiscount = -1
  }

  check() {
    try {
      this.setVersion(this.version)
      this.setLifetime(this.lifetime)
      this.setCoeff(this.coeff)
      this.setBase(this.base)
      this.setBuckets(this.buckets)
      this.setNonalphaDiscount(this.nonalphaDiscount)
      this.setNoVowelDiscount(this.noVowelDiscount)
      return true
    }
    catch (e) {
      return false
    }
  }

  setVersion(version: number) { 
    if (version < 0 || version > 2**16 - 1) {
      throw new Error("Invalid version: must be a 16-bit number")
    }
    this.version = version
  }

  setLifetime(lifetime: number) {
    if (lifetime < 0 || lifetime > 2**32 - 1) {
      throw new Error("Invalid lifetime: must be a 32-bit number")
    }
    this.lifetime = lifetime
  }
    
  setCoeff(coeff: number) {
    if (coeff < 0 || coeff > 255) {
      throw new Error("Invalid coeff: must be an 8-bit number")
    }
    this.coeff = coeff
  }

  setBase(base: number) {
    if (base < 0 || base > 255) {
      throw new Error("Invalid base: must be an 8-bit number")
    }
    this.base = base
  }

  setBuckets(buckets: Array<number>) {
    if (buckets.length != 16) {
      throw new Error("Invalid buckets: must have 16 entries")
    }

    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i] < 0 || buckets[i] > 15) {
        throw new Error("Invalid buckets: must be 4-bit numbers")
      }
    }

    this.buckets = buckets.slice(0)
  }
 
  setNonalphaDiscount(nonalphaDiscount: number) {
    if (nonalphaDiscount < 0 || nonalphaDiscount > 15) {
      throw new Error("Invalid nonalphaDiscount: must be a 4-bit number")
    }
    this.nonalphaDiscount = nonalphaDiscount
  }

  setNoVowelDiscount(noVowelDiscount: number) {
    if (noVowelDiscount < 0 || noVowelDiscount > 15) {
      throw new Error("Invalid noVowelDiscount: must be a 4-bit number")
    }
    this.noVowelDiscount = noVowelDiscount
  }

  toHexPayload() {
    const lifeHex = ('00000000' + this.lifetime.toString(16)).slice(-8)
    const coeffHex = ('00' + this.coeff.toString(16)).slice(-2)
    const baseHex = ('00' + this.base.toString(16)).slice(-2)
    const bucketHex = this.buckets.map((b) => {return b.toString(16);}).reduce((b1, b2) => {return b1 + b2}, '')
    const discountHex = this.nonalphaDiscount.toString(16) + this.noVowelDiscount.toString(16)
    const versionHex = ('0000' + this.version.toString(16)).slice(-4)
    const namespaceIDHex = new Buffer(this.namespaceID).toString('hex')

    return lifeHex + coeffHex + baseHex + bucketHex + discountHex + versionHex + namespaceIDHex
  } 
}

export function makePreorderSkeleton(
  fullyQualifiedName: string, consensusHash : string, preorderAddress: string,
  burnAddress : string, burnAmount: {units: string, amount: Object},
  registerAddress: ?string = null) {
  // Returns a preorder tx skeleton.
  //   with 3 outputs : 1. the Blockstack Preorder OP_RETURN data
  //                    2. the Preorder's change address (5500 satoshi minimum)
  //                    3. the BURN
  //
  //    0     2  3                                              23             39          47
  //    |-----|--|----------------------------------------------|--------------|-----------|
  //    magic op  hash160(name.ns_id,script_pubkey,register_addr) consensus hash  STACKS
  //                                                                             (optional)

  // Returns an unsigned serialized transaction.
  const network = config.network
  const nameBuff = Buffer.from(decodeB40(fullyQualifiedName), 'hex') // base40
  const scriptPublicKey = bitcoin.address.toOutputScript(preorderAddress, network.layer1)

  const dataBuffers = [nameBuff, scriptPublicKey]

  if (registerAddress) {
    const registerBuff = Buffer.from(registerAddress, 'ascii')
    dataBuffers.push(registerBuff)
  }

  const dataBuff = Buffer.concat(dataBuffers)

  const hashed = hash160(dataBuff)

  const opReturnBufferLen = burnAmount.units == 'BTC' ? 40 : 48
  const opReturnBuffer = Buffer.alloc(opReturnBufferLen)
  opReturnBuffer.write('id?', 0, 3, 'ascii')
  hashed.copy(opReturnBuffer, 3)
  opReturnBuffer.write(consensusHash, 23, 16, 'hex')

  if (burnAmount.units == 'STACKS') {
    const burnHex = burnAmount.amount.toHex()
    const paddedBurnHex = ('0000000000000000' + burnHex).slice(-16)
    opReturnBuffer.write(paddedBurnHex, 40, 8, 'hex')
  }

  const nullOutput = bitcoin.script.nullDataOutput(opReturnBuffer)

  const tx = new bitcoin.TransactionBuilder(network.layer1)

  tx.addOutput(nullOutput, 0)
  tx.addOutput(preorderAddress, DUST_MINIMUM)

  if (burnAmount.units == 'BTC') {
    const btcBurnAmount = parseInt(burnAmount.amount.toHex(), 16)
    tx.addOutput(burnAddress, btcBurnAmount)
  }
  else {
    tx.addOutput(burnAddress, DUST_MINIMUM)
  }

  return tx.buildIncomplete()
}

export function makeRegisterSkeleton(
  fullyQualifiedName: string, ownerAddress: string,
  valueHash: ?string = null, burnTokenAmount: ?Object = null) {
  // Returns a register tx skeleton.
  //   with 2 outputs : 1. The register OP_RETURN
  //                    2. The owner address (can be different from REGISTER address on renewals)

  // You MUST make the first input a UTXO from the current OWNER *or* the
  //   funder of the PREORDER

  // in the case of a renewal, this would need to be modified to include a change address
  //  as output (3) before the burn output (4)

  let payload
  const network = config.network

  if (valueHash) {
    if (valueHash.length !== 40) {
      throw new Error('Value hash length incorrect. Expecting 20-bytes, hex-encoded')
    }
    const payloadLen = burnTokenAmount !== null ? 65 : 57
    payload = Buffer.alloc(payloadLen, 0)
    payload.write(fullyQualifiedName, 0, 37, 'ascii')
    payload.write(valueHash, 37, 20, 'hex')
    if (burnTokenAmount !== null) {
      const burnHex = burnTokenAmount.toHex()
      const paddedBurnHex = ('0000000000000000' + burnHex).slice(-16)
      payload.write(paddedBurnHex, 57, 16, 'hex')
    }
  } else {
    payload = Buffer.from(fullyQualifiedName, 'ascii')
  }

  const opReturnBuffer = Buffer.concat([Buffer.from('id:', 'ascii'), payload])
  const nullOutput = bitcoin.script.nullDataOutput(opReturnBuffer)

  const tx = new bitcoin.TransactionBuilder(network.layer1)

  tx.addOutput(nullOutput, 0)
  tx.addOutput(ownerAddress, DUST_MINIMUM)

  return tx.buildIncomplete()
}

export function makeRenewalSkeleton(
  fullyQualifiedName: string, nextOwnerAddress: string, lastOwnerAddress: string,
  burnAddress: string, burnAmount: {units: string, amount: Object}, valueHash: ?string = null) {
  const network = config.network
  const burnTokenAmount = burnAmount.units === 'BTC' ? null : burnAmount.amount
  const burnBTCAmount = burnAmount.units == 'BTC' ? parseInt(burnAmount.amount.toHex(), 16) : DUST_MINIMUM
  const registerTX = makeRegisterSkeleton(
    fullyQualifiedName, nextOwnerAddress, valueHash, burnTokenAmount)
  const txB = bitcoin.TransactionBuilder.fromTransaction(
    registerTX, network.layer1)
  txB.addOutput(lastOwnerAddress, DUST_MINIMUM)
  txB.addOutput(burnAddress, burnBTCAmount)
  return txB.buildIncomplete()
}

export function makeTransferSkeleton(
  fullyQualifiedName: string, consensusHash: string, newOwner: string,
  keepZonefile: boolean = false) {
  // Returns a transfer tx skeleton.
  //   with 2 outputs : 1. the Blockstack Transfer OP_RETURN data
  //                    2. the new owner with a DUST_MINIMUM value (5500 satoshi)
  //
  // You MUST make the first input a UTXO from the current OWNER
  //
  // Returns an unsigned serialized transaction.
  const network = config.network
  const opRet = Buffer.alloc(36)
  let keepChar = '~'
  if (keepZonefile) {
    keepChar = '>'
  }

  opRet.write('id>', 0, 3, 'ascii')
  opRet.write(keepChar, 3, 1, 'ascii')

  const hashed = hash128(Buffer.from(fullyQualifiedName, 'ascii'))
  hashed.copy(opRet, 4)
  opRet.write(consensusHash, 20, 16, 'hex')

  const opRetPayload = bitcoin.script.nullDataOutput(opRet)

  const tx = new bitcoin.TransactionBuilder(network.layer1)

  tx.addOutput(opRetPayload, 0)
  tx.addOutput(newOwner, DUST_MINIMUM)

  return tx.buildIncomplete()
}


export function makeUpdateSkeleton(
  fullyQualifiedName: string, consensusHash: string, valueHash: string) {
  // Returns an update tx skeleton.
  //   with 1 output : 1. the Blockstack update OP_RETURN
  //
  // You MUST make the first input a UTXO from the current OWNER
  //
  // Returns an unsigned serialized transaction.
  const network = config.network
  const opRet = Buffer.alloc(39)

  const nameBuff = Buffer.from(fullyQualifiedName, 'ascii')
  const consensusBuff = Buffer.from(consensusHash, 'ascii')

  const hashedName = hash128(Buffer.concat(
    [nameBuff, consensusBuff]))

  opRet.write('id+', 0, 3, 'ascii')
  hashedName.copy(opRet, 3)
  opRet.write(valueHash, 19, 20, 'hex')

  const opRetPayload = bitcoin.script.nullDataOutput(opRet)

  const tx = new bitcoin.TransactionBuilder(network.layer1)

  tx.addOutput(opRetPayload, 0)

  return tx.buildIncomplete()
}


export function makeRevokeSkeleton(fullyQualifiedName: string) {
  // Returns a revoke tx skeleton 
  //    with 1 output: 1. the Blockstack revoke OP_RETURN
  //
  // You MUST make the first input a UTXO from the current OWNER
  //
  // Returns an unsigned serialized transaction
  const network = config.network
  const opRet = Buffer.alloc(3)

  const nameBuff = Buffer.from(fullyQualifiedName, 'ascii')
  
  opRet.write('id~', 0, 3, 'ascii')
  
  const opReturnBuffer = Buffer.concat([opRet, nameBuff])
  const nullOutput = bitcoin.script.nullDataOutput(opReturnBuffer)

  const tx = new bitcoin.TransactionBuilder(network.layer1)

  tx.addOutput(nullOutput, 0)

  return tx.buildIncomplete()
}

export function makeNamespacePreorderSkeleton(
  namespaceID: string, consensusHash : string, preorderAddress: string,
  registerAddress: string, burnAmount: {units: string, amount: Object}) {
  // Returns a namespace preorder tx skeleton.
  // Returns an unsigned serialized transaction.
  if (burnAmount.Units !== 'BTC' && burnAmount.units !== 'STACKS') {
    throw new Error(`Invalid burnUnits ${burnUnits}`)
  }

  const network = config.network
  const burnAddress = network.coerceAddress('1111111111111111111114oLvT2')
  const namespaceIDBuff = Buffer.from(decodeB40(namespaceID), 'hex') // base40
  const scriptPublicKey = bitcoin.address.toOutputScript(preorderAddress, network.layer1)
  const registerBuff = Buffer.from(registerAddress, 'ascii')

  const dataBuffers = [namespaceIDBuff, scriptPublicKey, registerBuff]
  const dataBuff = Buffer.concat(dataBuffers)

  const hashed = hash160(dataBuff)
  
  let btcBurnAmount = DUST_MINIMUM
  let opReturnBufferLen = 40
  if (burnAmount.units === 'STACKS') {
    opReturnBufferLen = 48
  }
  else {
    btcBurnAmount = parseInt(burnAmount.amount.toHex(), 16)
  }

  const opReturnBuffer = Buffer.alloc(opReturnBufferLen)
  opReturnBuffer.write('id*', 0, 3, 'ascii')
  hashed.copy(opReturnBuffer, 3)
  opReturnBuffer.write(consensusHash, 23, 16, 'hex')

  if (burnAmount.units == 'STACKS') {
    const burnHex = burnAmount.amount.toHex()
    const paddedBurnHex = ('0000000000000000' + burnHex).slice(-16)
    opReturnBuffer.write(paddedBurnHex, 40, 16, 'hex')
  }

  const nullOutput = bitcoin.script.nullDataOutput(opReturnBuffer)

  const tx = new bitcoin.TransactionBuilder(network.layer1)

  tx.addOutput(nullOutput, 0)
  tx.addOutput(preorderAddress, DUST_MINIMUM)
  tx.addOutput(burnAddress, btcBurnAmount)

  return tx.buildIncomplete()
}


export function makeNamespaceRevealSkeleton(
  namespace: BlockstackNamespace, revealAddress: string) {

  const network = config.network
  const hexPayload = namespace.toHexPayload()

  const opReturnBuffer = Buffer.alloc(3 + hexPayload.length/2)
  opReturnBuffer.write('id&', 0, 3, 'ascii')
  opReturnBuffer.write(hexPayload, 3, hexPayload.length/2, 'hex')

  const nullOutput = bitcoin.script.nullDataOutput(opReturnBuffer)
  const tx = new bitcoin.TransactionBuilder(network.layer1)

  tx.addOutput(nullOutput, 0)
  tx.addOutput(revealAddress, DUST_MINIMUM)

  return tx.buildIncomplete()
}


export function makeNamespaceReadySkeleton(
  namespaceID: string) {

  const network = config.network
  const opReturnBuffer = Buffer.alloc(3 + namespaceID.length)
  opReturnBuffer.write('id!', 0, 3, 'ascii')
  opReturnBuffer.write(namespaceID, 3, namespaceID.length, 'ascii')

  const nullOutput = bitcoin.script.nullDataOutput(opReturnBuffer)
  const tx = new bitcoin.TransactionBuilder(network.layer1)

  tx.addOutput(nullOutput, 0)
  
  return tx.buildIncomplete()
}
