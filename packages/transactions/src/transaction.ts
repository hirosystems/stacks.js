import {
  bytesToHex,
  concatArray,
  hexToBytes,
  IntegerType,
  intToBigInt,
  writeUInt32BE,
} from '@stacks/common';
import {
  ChainId,
  DEFAULT_CHAIN_ID,
  STACKS_MAINNET,
  STACKS_TESTNET,
  TransactionVersion,
  whenTransactionVersion,
} from '@stacks/network';
import {
  Authorization,
  deserializeAuthorization,
  intoInitialSighashAuth,
  isSingleSig,
  MultiSigSpendingCondition,
  nextSignature,
  serializeAuthorization,
  setFee,
  setNonce,
  setSponsor,
  setSponsorNonce,
  SpendingConditionOpts,
  verifyOrigin,
} from './authorization';
import { BytesReader } from './bytesReader';
import {
  AddressHashMode,
  AnchorMode,
  anchorModeFrom,
  AnchorModeName,
  AuthType,
  PayloadType,
  PostConditionMode,
  PubKeyEncoding,
  RECOVERABLE_ECDSA_SIG_LENGTH_BYTES,
  StacksMessageType,
} from './constants';
import { SerializationError, SigningError } from './errors';
import { isCompressed, StacksPrivateKey, StacksPublicKey } from './keys';
import { deserializePayload, Payload, PayloadInput, serializePayload } from './payload';
import { createTransactionAuthField } from './signature';
import { createLPList, deserializeLPList, LengthPrefixedList, serializeLPList } from './types';
import { cloneDeep, txidFromData } from './utils';

export class StacksTransaction {
  version: TransactionVersion;
  chainId: ChainId;
  auth: Authorization;
  anchorMode: AnchorMode;
  payload: Payload;
  postConditionMode: PostConditionMode;
  postConditions: LengthPrefixedList;

  constructor(
    version: TransactionVersion,
    auth: Authorization,
    payload: PayloadInput,
    postConditions?: LengthPrefixedList,
    postConditionMode?: PostConditionMode,
    anchorMode?: AnchorModeName | AnchorMode,
    chainId?: ChainId
  ) {
    this.version = version;
    this.auth = auth;
    if ('amount' in payload) {
      this.payload = {
        ...payload,
        amount: intToBigInt(payload.amount, false),
      };
    } else {
      this.payload = payload;
    }
    this.chainId = chainId ?? DEFAULT_CHAIN_ID;
    this.postConditionMode = postConditionMode ?? PostConditionMode.Deny;
    this.postConditions = postConditions ?? createLPList([]);

    if (anchorMode) {
      this.anchorMode = anchorModeFrom(anchorMode);
    } else {
      switch (payload.payloadType) {
        case PayloadType.Coinbase:
        case PayloadType.CoinbaseToAltRecipient:
        case PayloadType.NakamotoCoinbase:
        case PayloadType.PoisonMicroblock:
        case PayloadType.TenureChange:
          this.anchorMode = AnchorMode.OnChainOnly;
          break;
        case PayloadType.ContractCall:
        case PayloadType.SmartContract:
        case PayloadType.VersionedSmartContract:
        case PayloadType.TokenTransfer:
          this.anchorMode = AnchorMode.Any;
          break;
      }
    }
  }

  signBegin() {
    const tx = cloneDeep(this);
    tx.auth = intoInitialSighashAuth(tx.auth);
    return tx.txid();
  }

  verifyBegin() {
    const tx = cloneDeep(this);
    tx.auth = intoInitialSighashAuth(tx.auth);
    return tx.txid();
  }

  verifyOrigin(): string {
    return verifyOrigin(this.auth, this.verifyBegin());
  }

  signNextOrigin(sigHash: string, privateKey: StacksPrivateKey): string {
    if (this.auth.spendingCondition === undefined) {
      throw new Error('"auth.spendingCondition" is undefined');
    }
    if (this.auth.authType === undefined) {
      throw new Error('"auth.authType" is undefined');
    }
    return this.signAndAppend(this.auth.spendingCondition, sigHash, AuthType.Standard, privateKey);
  }

  signNextSponsor(sigHash: string, privateKey: StacksPrivateKey): string {
    if (this.auth.authType === AuthType.Sponsored) {
      return this.signAndAppend(
        this.auth.sponsorSpendingCondition,
        sigHash,
        AuthType.Sponsored,
        privateKey
      );
    } else {
      throw new Error('"auth.sponsorSpendingCondition" is undefined');
    }
  }

  appendPubkey(publicKey: StacksPublicKey) {
    const cond = this.auth.spendingCondition;
    if (cond && !isSingleSig(cond)) {
      const compressed = isCompressed(publicKey);
      cond.fields.push(
        createTransactionAuthField(
          compressed ? PubKeyEncoding.Compressed : PubKeyEncoding.Uncompressed,
          publicKey
        )
      );
    } else {
      throw new Error(`Can't append public key to a singlesig condition`);
    }
  }

  signAndAppend(
    condition: SpendingConditionOpts,
    curSigHash: string,
    authType: AuthType,
    privateKey: StacksPrivateKey
  ): string {
    const { nextSig, nextSigHash } = nextSignature(
      curSigHash,
      authType,
      condition.fee,
      condition.nonce,
      privateKey
    );
    if (isSingleSig(condition)) {
      condition.signature = nextSig;
    } else {
      const compressed = bytesToHex(privateKey.data).endsWith('01');
      condition.fields.push(
        createTransactionAuthField(
          compressed ? PubKeyEncoding.Compressed : PubKeyEncoding.Uncompressed,
          nextSig
        )
      );
    }

    return nextSigHash;
  }

  txid(): string {
    const serialized = this.serialize();
    return txidFromData(serialized);
  }

  setSponsor(sponsorSpendingCondition: SpendingConditionOpts) {
    if (this.auth.authType != AuthType.Sponsored) {
      throw new SigningError('Cannot sponsor sign a non-sponsored transaction');
    }

    this.auth = setSponsor(this.auth, sponsorSpendingCondition);
  }

  /**
   * Set the total fee to be paid for this transaction
   *
   * @param fee - the fee amount in microstacks
   */
  setFee(amount: IntegerType) {
    this.auth = setFee(this.auth, amount);
  }

  /**
   * Set the transaction nonce
   *
   * @param nonce - the nonce value
   */
  setNonce(nonce: IntegerType) {
    this.auth = setNonce(this.auth, nonce);
  }

  /**
   * Set the transaction sponsor nonce
   *
   * @param nonce - the sponsor nonce value
   */
  setSponsorNonce(nonce: IntegerType) {
    if (this.auth.authType != AuthType.Sponsored) {
      throw new SigningError('Cannot sponsor sign a non-sponsored transaction');
    }

    this.auth = setSponsorNonce(this.auth, nonce);
  }

  serialize(): Uint8Array {
    if (this.version === undefined) {
      throw new SerializationError('"version" is undefined');
    }
    if (this.chainId === undefined) {
      throw new SerializationError('"chainId" is undefined');
    }
    if (this.auth === undefined) {
      throw new SerializationError('"auth" is undefined');
    }
    if (this.anchorMode === undefined) {
      throw new SerializationError('"anchorMode" is undefined');
    }
    if (this.payload === undefined) {
      throw new SerializationError('"payload" is undefined');
    }

    const bytesArray = [];

    bytesArray.push(this.version);
    const chainIdBytes = new Uint8Array(4);
    writeUInt32BE(chainIdBytes, this.chainId, 0);
    bytesArray.push(chainIdBytes);
    bytesArray.push(serializeAuthorization(this.auth));
    bytesArray.push(this.anchorMode);
    bytesArray.push(this.postConditionMode);
    bytesArray.push(serializeLPList(this.postConditions));
    bytesArray.push(serializePayload(this.payload));

    return concatArray(bytesArray);
  }
}

/**
 * @param tx hex string or bytes of serialized transaction
 */
export function deserializeTransaction(tx: string | Uint8Array | BytesReader) {
  let bytesReader: BytesReader;
  if (typeof tx === 'string') {
    if (tx.slice(0, 2).toLowerCase() === '0x') {
      bytesReader = new BytesReader(hexToBytes(tx.slice(2)));
    } else {
      bytesReader = new BytesReader(hexToBytes(tx));
    }
  } else if (tx instanceof Uint8Array) {
    bytesReader = new BytesReader(tx);
  } else {
    bytesReader = tx;
  }
  const version = bytesReader.readUInt8Enum(TransactionVersion, n => {
    throw new Error(`Could not parse ${n} as TransactionVersion`);
  });
  const chainId = bytesReader.readUInt32BE();
  const auth = deserializeAuthorization(bytesReader);
  const anchorMode = bytesReader.readUInt8Enum(AnchorMode, n => {
    throw new Error(`Could not parse ${n} as AnchorMode`);
  });
  const postConditionMode = bytesReader.readUInt8Enum(PostConditionMode, n => {
    throw new Error(`Could not parse ${n} as PostConditionMode`);
  });
  const postConditions = deserializeLPList(bytesReader, StacksMessageType.PostCondition);
  const payload = deserializePayload(bytesReader);

  return new StacksTransaction(
    version,
    auth,
    payload,
    postConditions,
    postConditionMode,
    anchorMode,
    chainId
  );
}

/** @ignore */
export function deriveNetworkFromTx(transaction: StacksTransaction) {
  return whenTransactionVersion(transaction.version)({
    [TransactionVersion.Mainnet]: STACKS_MAINNET,
    [TransactionVersion.Testnet]: STACKS_TESTNET,
  });
}

/**
 * Estimates transaction byte length
 * Context:
 * 1) Multi-sig transaction byte length increases by adding signatures
 *    which causes the incorrect fee estimation because the fee value is set while creating unsigned transaction
 * 2) Single-sig transaction byte length remain same due to empty message signature which allocates the space for signature
 * @param {transaction} - StacksTransaction object to be estimated
 * @return {number} Estimated transaction byte length
 */
export function estimateTransactionByteLength(transaction: StacksTransaction): number {
  const hashMode = transaction.auth.spendingCondition.hashMode;
  // List of Multi-sig transaction hash modes
  const multiSigHashModes = [AddressHashMode.SerializeP2SH, AddressHashMode.SerializeP2WSH];

  // Check if its a Multi-sig transaction
  if (multiSigHashModes.includes(hashMode)) {
    const multiSigSpendingCondition: MultiSigSpendingCondition = transaction.auth
      .spendingCondition as MultiSigSpendingCondition;

    // Find number of existing signatures if the transaction is signed or partially signed
    const existingSignatures = multiSigSpendingCondition.fields.filter(
      field => field.contents.type === StacksMessageType.MessageSignature
    ).length; // existingSignatures will be 0 if its a unsigned transaction

    // Estimate total signature bytes size required for this multi-sig transaction
    // Formula: totalSignatureLength = (signaturesRequired - existingSignatures) * (SIG_LEN_BYTES + 1 byte for type of signature)
    const totalSignatureLength =
      (multiSigSpendingCondition.signaturesRequired - existingSignatures) *
      (RECOVERABLE_ECDSA_SIG_LENGTH_BYTES + 1);

    return transaction.serialize().byteLength + totalSignatureLength;
  } else {
    // Single-sig transaction
    // Signature space already allocated by empty message signature
    return transaction.serialize().byteLength;
  }
}
