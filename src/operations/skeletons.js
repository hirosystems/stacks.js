import bitcoin from 'bitcoinjs-lib'
import { decodeB40, hash160, hash128, DUST_MINIMUM } from './util'
import { config } from '../config'

// todo : add name length / character verification


export function makePreorderSkeleton(
  fullyQualifiedName: string, consensusHash : string, preorderAddress: string,
  burnAddress : string, burnAmount: number,
  registerAddress: string = null) {
  // Returns a preorder tx skeleton.
  //   with 3 outputs : 1. the Blockstack Preorder OP_RETURN data
  //                    2. the Preorder's change address (5500 satoshi minimum)
  //                    3. the BURN
  //
  //    0     2  3                                              23             39
  //    |-----|--|----------------------------------------------|--------------|
  //    magic op  hash160(name.ns_id,script_pubkey,register_addr) consensus hash

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

  const opReturnBuffer = Buffer.alloc(39)
  opReturnBuffer.write('id?', 0, 3, 'ascii')
  hashed.copy(opReturnBuffer, 3)
  opReturnBuffer.write(consensusHash, 23, 16, 'hex')

  const nullOutput = bitcoin.script.nullDataOutput(opReturnBuffer)

  const tx = new bitcoin.TransactionBuilder(network.layer1)

  tx.addOutput(nullOutput, 0)
  tx.addOutput(preorderAddress, DUST_MINIMUM)
  tx.addOutput(burnAddress, burnAmount)

  return tx.buildIncomplete()
}

export function makeRegisterSkeleton(
  fullyQualifiedName: string, ownerAddress: string,
  valueHash: string = null) {
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
    payload = Buffer.alloc(57, 0)
    payload.write(fullyQualifiedName, 0, 37, 'ascii')
    payload.write(valueHash, 37, 20, 'hex')
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
  burnAddress: string, burnAmount: string, valueHash: string = null) {
  const network = config.network
  const registerTX = makeRegisterSkeleton(
    fullyQualifiedName, nextOwnerAddress, valueHash)
  const txB = bitcoin.TransactionBuilder.fromTransaction(
    registerTX, network.layer1)
  txB.addOutput(lastOwnerAddress, DUST_MINIMUM)
  txB.addOutput(burnAddress, burnAmount)
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
