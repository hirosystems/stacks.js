const DUST_MINIMUM = 5500
import bitcoin from 'bitcoinjs-lib'
import RIPEMD160 from 'ripemd160'

// todo : add name length / character verification

function hash160(buff: Buffer){
    const sha256 = bitcoin.crypto.sha256(buff);
    const ret =  (new RIPEMD160()).update(sha256).digest();
    return ret;
}


function makePreorderSkeleton(fullyQualifiedName: string, consensusHash : string,
                              preorderAddress: string, burnAddress : string,
                              burnAmount: number,
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

  const nameBuff = Buffer.from(fullyQualifiedName, 'ascii')
  const scriptPublicKey = bitcoin.address.toOutputScript(preorderAddress)

  const dataBuffers = [ nameBuff, scriptPublicKey ]

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

  const tx = new bitcoin.TransactionBuilder(bitcoin.networks.bitcoin)

  tx.addOutput(nullOutput, 0)
  tx.addOutput(preorderAddress, DUST_MINIMUM)
  tx.addOutput(burnAddress, burnAmount)

  return tx.buildIncomplete()
}

function makeRegisterSkeleton(fullyQualifiedName: string, registerAddress: string,
                              ownerAddress: string, valueHash: string=null) {
  // Returns a register tx skeleton.
  //   with 2 outputs : 1. The register OP_RETURN
  //                    2. The owner address (can be different from REGISTER address on renewals)

  // You MUST make the first input a UTXO from the current OWNER

  // in the case of a renewal, this would need to be modified to include a change address
  //  as output (3) before the burn output (4)

  let payload

  if (valueHash) {
    if (valueHash.length != 40) {
      throw new Exception('Value hash length incorrect. Expecting 20-bytes, hex-encoded')
    }
    payload = Buffer.alloc(57, fill=0)
    payload.write(fullyQualifiedName, 0, 37, 'ascii')
    payload.write(valueHash, 37, 20, 'hex')
  } else {
    payload = Buffer.from(fullyQualifiedName, 'ascii')
  }

  const opReturnBuffer = Buffer.concat([ Buffer.from('id:', 'ascii'), payload ])
  const nullOutput = bitcoin.script.nullDataOutput(opReturnBuffer)

  const tx = new bitcoin.TransactionBuilder(network)

  tx.addOutput(nullOutput, 0)
  tx.addOutput(registerAddress, DUST_MINIMUM)

  return tx.buildIncomplete()
}

function makeTransferSkeleton(fullyQualifiedName: string, consensusHash: string,
                              newOwner: string, keepZonefile: boolean = false) {
  // Returns a transfer tx skeleton.
  //   with 2 outputs : 1. the Blockstack Transfer OP_RETURN data
  //                    2. the new owner with a DUST_MINIMUM value (5500 satoshi)
  //
  // You MUST make the first input a UTXO from the current OWNER
  //
  // Returns an unsigned serialized transaction.
  const op_ret = Buffer.alloc(36)
  let keepChar = '~'
  if(keepZonefile){
    keepChar = '>'
  }

  op_ret.write('id>', 0, 3, 'ascii')
  op_ret.write(keepChar, 3, 1, 'ascii')

  const hashed = utils.hash128(Buffer.from(fullyQualifiedName, 'ascii'))
  hashed.copy(op_ret, 4)
  op_ret.write(consensusHash, 20, 16, 'hex')

  const op_ret_payload = bitcoin.script.nullDataOutput(op_ret)

  const tx = new bitcoin.TransactionBuilder(network)

  tx.addOutput(op_ret_payload, 0)
  tx.addOutput(newOwner, DUST_MINIMUM)

  return tx.buildIncomplete()
}


function makeUpdateSkeleton(fullyQualifiedName : string, consensusHash : string,
                            zonefile : Buffer) {
  // Returns an update tx skeleton.
  //   with 1 output : 1. the Blockstack update OP_RETURN
  //
  // You MUST make the first input a UTXO from the current OWNER
  //
  // Returns an unsigned serialized transaction.
  const op_ret = Buffer.alloc(39)

  const nameBuff = Buffer.from(fqa, 'ascii')
  const consensusBuff = Buffer.from(consensusHash, 'ascii')

  const hashedName = utils.hash128(Buffer.concat(
    [nameBuff, consensusBuff]))

  const hashedZonefile = utils.hash160(zonefile)

  op_ret.write('id+', 0, 3, 'ascii')
  hashedName.copy(op_ret, 3)
  hashedZonefile.copy(op_ret, 19)

  const op_ret_payload = bitcoin.script.nullDataOutput(op_ret)

  var tx = new bitcoin.TransactionBuilder(network)

  tx.addOutput(op_ret_payload, 0)

  return tx.buildIncomplete()
}

exports.makePreorderSkeleton = makePreorderSkeleton
