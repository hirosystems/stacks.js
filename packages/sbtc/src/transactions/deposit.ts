import * as btc from '@scure/btc-signer';
import * as secp from '@noble/secp256k1';
import * as P from 'micro-packed';
import { hex } from '@scure/base';
import type { BridgeTransactionType, UTXO } from './types/sbtc_types.js';
import { toStorable, buildDepositPayload, buildDepositPayloadOpReturn } from './payload_utils.js';
import { addInputs, inputAmt } from './wallet_utils.js';
import { MagicBytes as MagicBytes, MagicBytes, OPCodes, OpCode } from './constants.js';
import { c32addressDecode } from 'c32check';

export const REVEAL_PAYMENT = 10001; // todo: is this const?
export const DUST = 500; // todo: double-check what this has to be set to

const concat = P.concatBytes;

interface BitcoinNetwork {
  bech32: string;
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
}

export const NETWORK: BitcoinNetwork = btc.NETWORK;
export const TEST_NETWORK: BitcoinNetwork = btc.TEST_NETWORK;

interface DepositOpts {
  network?: BitcoinNetwork;
  amount: number;
  btcFeeRates: any;
  addressInfo: any;
  stacksAddress: string;
  sbtcWalletAddress: string;
  cardinal: string;
  userPaymentPubKey: string;
}

export function buildSBtcDepositBtcPayload({
  network: net,
  address,
}: {
  network: BitcoinNetwork;
  address: string;
}): Uint8Array {
  const magicBytes =
    net.bech32 === 'tb' ? hex.decode(MagicBytes.Testnet) : hex.decode(MagicBytes.Mainnet);
  const opCodeBytes = hex.decode(OpCode.PegIn);
  return concat(magicBytes, opCodeBytes, stacksAddressBytes(address));
}

function stacksAddressBytes(address: string): Uint8Array {
  const [addr, contractName] = address.split('.');
  const [version, hash] = c32addressDecode(addr);
  const versionBytes = hex.decode(version.toString(16));
  const hashBytes = hex.decode(hash);

  return concat(versionBytes, hashBytes, lpContractNameBytes(contractName));
}

function lpContractNameBytes(contractName?: string): Uint8Array {
  if (!contractName) return Uint8Array.from([0]); // empty

  const cnameBuf = new TextEncoder().encode(contractName);
  const cnameLen = cnameBuf.byteLength;
  if (cnameBuf.length > 40) throw new Error('Contract name is too long - max 40 characters');
  return concat(cnameLen, cnameBuf);
}

function optionalLengthPrefixed<T>(
  something: T | null | undefined,
  fn: (something: T) => Uint8Array,
  maxLength?: number = -1
): Uint8Array {
  if (!something) return Uint8Array.from([0]); // empty

  const bytes = fn(something);
  const length = bytes.byteLength;
  if (maxLength >= 0 && bytes.length > maxLength) {
    throw new Error(`ByteLength exceeds maximum length of ${maxLength}`);
  }
  return concat(hex.length, bytes);
}

/**
 *
 */
export function buildOpReturnDepositTransaction({
  network = NETWORK,
  amount,
  btcFeeRates,
  addressInfo,
  stacksAddress,
  sbtcWalletAddress,
  cardinal,
  userPaymentPubKey,
}: DepositOpts) {
  opts.network = opts.network ?? NETWORK; // mainnet by default
  const data = buildDepositPayloadOpReturn(network, stacksAddress);
  const txFees = calculateDepositFees(
    network,
    false,
    amount,
    btcFeeRates.feeInfo,
    addressInfo,
    sbtcWalletAddress,
    data
  );
  const tx = new btc.Transaction({
    allowUnknowInput: true,
    allowUnknowOutput: true,
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  });
  // no reveal fee for op_return
  addInputs(network, amount, 0, tx, false, addressInfo.utxos, userPaymentPubKey);
  tx.addOutput({ script: btc.Script.encode(['RETURN', data]), amount: BigInt(0) });
  tx.addOutputAddress(sbtcWalletAddress, BigInt(amount), net);
  const changeAmount = inputAmt(tx) - (amount + txFees[1]);
  if (changeAmount > 0) tx.addOutputAddress(cardinal, BigInt(changeAmount), net);
  return tx;
}

/**
 * @param network
 * @param amount the amount to deposit plus the reveal transaction gas fee
 * @param btcFeeRates current rates
 * @param addressInfo the utxos to spend from
 * @param commitTxAddress the commitment address - contains the taproot data and the payload
 * @param cardinal the change address
 * @param userPaymentPubKey pubkey needed to spend script hash inputs
 * @returns transaction object
 */
export function buildOpDropDepositTransaction(
  network: string,
  amount: number,
  btcFeeRates: any,
  addressInfo: any,
  commitTxAddress: string,
  cardinal: string,
  userPaymentPubKey: string
) {
  const net = network === 'testnet' ? btc.TEST_NETWORK : btc.NETWORK;
  const txFees = calculateDepositFees(
    network,
    true,
    amount,
    btcFeeRates.feeInfo,
    addressInfo,
    commitTxAddress,
    undefined
  );
  const tx = new btc.Transaction({
    allowUnknowInput: true,
    allowUnknowOutput: true,
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  });
  addInputs(network, amount, REVEAL_PAYMENT, tx, false, addressInfo.utxos, userPaymentPubKey);
  tx.addOutputAddress(commitTxAddress, BigInt(amount), net);
  const changeAmount = inputAmt(tx) - (amount + txFees[1]);
  if (changeAmount > 0) tx.addOutputAddress(cardinal, BigInt(changeAmount), net);
  return tx;
}

export function getOpReturnDepositRequest(
  network: string,
  amount: number,
  commitKeys: any,
  stacksAddress: string,
  sbtcWalletAddress: string,
  cardinal: string
): BridgeTransactionType {
  if (!stacksAddress) throw new Error('Stacks address missing');
  const data = buildDepositPayloadOpReturn(network, stacksAddress);
  //console.log('reclaimAddr.pubkey: ' + commitKeys.reclaimPubKey)
  //console.log('revealAddr.pubkey: ' + commitKeys.revealPubKey)

  const req: BridgeTransactionType = {
    originator: stacksAddress,
    fromBtcAddress: cardinal,
    revealPub: commitKeys.revealPubKey,
    reclaimPub: commitKeys.reclaimPubKey,
    status: 1,
    tries: 0,
    mode: 'op_return',
    amount: amount,
    requestType: 'deposit',
    wallet: hex.encode(data),
    stacksAddress: stacksAddress,
    sbtcWalletAddress: sbtcWalletAddress,
  };
  return req;
}

export function getOpDropDepositRequest(
  network: string,
  revealFee: number,
  commitKeys: any,
  stacksAddress: string,
  sbtcWalletAddress: string,
  cardinal: string
): BridgeTransactionType {
  const net = network === 'testnet' ? btc.TEST_NETWORK : btc.NETWORK;
  if (!stacksAddress) throw new Error('Address needed');
  //console.log('reclaimAddr.pubkey: ' + commitKeys.reclaimPubKey)
  //console.log('revealAddr.pubkey: ' + commitKeys.revealPubKey)

  const data = buildData(network, stacksAddress, revealFee, true);
  const scripts = [
    { script: btc.Script.encode([data, 'DROP', hex.decode(commitKeys.revealPubKey), 'CHECKSIG']) },
    {
      script: btc.Script.encode([
        'IF',
        144,
        'CHECKSEQUENCEVERIFY',
        'DROP',
        hex.decode(commitKeys.reclaimPubKey),
        'CHECKSIG',
        'ENDIF',
      ]),
    },
  ];
  const script = btc.p2tr(btc.TAPROOT_UNSPENDABLE_KEY, scripts, net, true);
  const req: BridgeTransactionType = {
    originator: stacksAddress,
    fromBtcAddress: cardinal,
    revealPub: commitKeys.revealPubKey,
    reclaimPub: commitKeys.reclaimPubKey,
    status: 1,
    tries: 0,
    mode: 'op_drop',
    amount: revealFee,
    requestType: 'deposit',
    wallet:
      "p2tr(TAPROOT_UNSPENDABLE_KEY, [{ script: Script.encode([data, 'DROP', revealPubK, 'CHECKSIG']) }, { script: Script.encode([reclaimPubKey, 'CHECKSIG']) }], net, true)",
    stacksAddress: stacksAddress,
    sbtcWalletAddress: sbtcWalletAddress,
  };
  req.commitTxScript = toStorable(script);
  return req;
}

function buildData(
  network: string,
  sigOrPrin: string,
  revealFee: number,
  opDrop: boolean
): Uint8Array {
  const net = network === 'testnet' ? btc.TEST_NETWORK : btc.NETWORK;
  if (opDrop) {
    return buildDepositPayload(net, revealFee, sigOrPrin, opDrop, undefined);
  }
  return buildDepositPayloadOpReturn(net, sigOrPrin);
}

export function maxCommit(addressInfo: any) {
  if (!addressInfo || !addressInfo.utxos || addressInfo.utxos.length === 0) return 0;
  const summ = addressInfo?.utxos
    ?.map((item: { value: number }) => item.value)
    .reduce((prev: number, curr: number) => prev + curr, 0);
  return summ || 0;
}

export function calculateDepositFees(
  network: string,
  opDrop: boolean,
  amount: number,
  feeInfo: any,
  addressInfo: any,
  commitTxScriptAddress: string,
  data: Uint8Array | undefined
) {
  try {
    const net = network === 'testnet' ? btc.TEST_NETWORK : btc.NETWORK;
    let vsize = 0;
    const tx = new btc.Transaction({
      allowUnknowInput: true,
      allowUnknowOutput: true,
      allowUnknownInputs: true,
      allowUnknownOutputs: true,
    });
    addInputs(
      network,
      amount,
      REVEAL_PAYMENT,
      tx,
      true,
      addressInfo.utxos,
      hex.encode(secp.getPublicKey(privKey, true))
    );
    if (!opDrop) {
      if (data) tx.addOutput({ script: btc.Script.encode(['RETURN', data]), amount: BigInt(0) });
      tx.addOutputAddress(commitTxScriptAddress, BigInt(amount), net);
    } else {
      tx.addOutputAddress(commitTxScriptAddress, BigInt(amount), net);
    }
    const changeAmount = inputAmt(tx) - amount;
    if (changeAmount > 0) tx.addOutputAddress(addressInfo.address, BigInt(changeAmount), net);
    //tx.sign(privKey);
    //tx.finalize();
    vsize = tx.vsize;
    const fees = [
      Math.floor((vsize * feeInfo['low_fee_per_kb']) / 1024),
      Math.floor((vsize * feeInfo['medium_fee_per_kb']) / 1024),
      Math.floor((vsize * feeInfo['high_fee_per_kb']) / 1024),
    ];
    return fees;
  } catch (err: any) {
    return [850, 1000, 1150];
  }
}
