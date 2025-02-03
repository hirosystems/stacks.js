import {
  Hex,
  IntegerType,
  PrivateKey,
  PublicKey,
  bytesToHex,
  concatArray,
  intToBigInt,
  isInstance,
  writeUInt32BE,
} from '@stacks/common';
import {
  ChainId,
  NetworkParam,
  STACKS_MAINNET,
  STACKS_TESTNET,
  TransactionVersion,
  networkFrom,
  whenTransactionVersion,
} from '@stacks/network';
import { serializePayloadBytes } from '.';
import { BytesReader } from './BytesReader';
import {
  Authorization,
  MultiSigSpendingCondition,
  SpendingConditionOpts,
  deserializeAuthorization,
  intoInitialSighashAuth,
  isSingleSig,
  nextSignature,
  serializeAuthorizationBytes,
  setFee,
  setNonce,
  setSponsor,
  setSponsorNonce,
  verifyOrigin,
} from './authorization';
import {
  AddressHashMode,
  AnchorMode,
  AuthType,
  PostConditionMode,
  PubKeyEncoding,
  RECOVERABLE_ECDSA_SIG_LENGTH_BYTES,
} from './constants';
import { SerializationError, SigningError } from './errors';
import { createStacksPublicKey, privateKeyIsCompressed, publicKeyIsCompressed } from './keys';
import { cloneDeep, txidFromData } from './utils';
import {
  LengthPrefixedList,
  PayloadInput,
  PayloadWire,
  PostConditionWire,
  PublicKeyWire,
  StacksWireType,
  createLPList,
  createMessageSignature,
  createTransactionAuthField,
  deserializeLPList,
  deserializePayload,
  serializeLPListBytes,
} from './wire';

export class StacksTransactionWire {
  transactionVersion: TransactionVersion;
  chainId: ChainId;
  auth: Authorization;
  payload: PayloadWire;
  postConditionMode: PostConditionMode;
  postConditions: LengthPrefixedList<PostConditionWire>;

  /** @deprecated Not used, starting with Stacks 2.5. Still needed for serialization. */
  anchorMode: AnchorMode;

  constructor({
    auth,
    payload,
    postConditions = createLPList([]),
    postConditionMode = PostConditionMode.Deny,
    transactionVersion,
    chainId,
    /** The network is only used if `transactionVersion` or `chainId` are not provided */
    network = 'mainnet',
  }: {
    payload: PayloadInput;
    auth: Authorization;
    postConditions?: LengthPrefixedList<PostConditionWire>;
    postConditionMode?: PostConditionMode;
    transactionVersion?: TransactionVersion;
    chainId?: ChainId;
  } & NetworkParam) {
    network = networkFrom(network);

    this.transactionVersion = transactionVersion ?? network.transactionVersion;
    this.chainId = chainId ?? network.chainId;
    this.auth = auth;

    if ('amount' in payload) {
      this.payload = {
        ...payload,
        amount: intToBigInt(payload.amount),
      };
    } else {
      this.payload = payload;
    }

    this.postConditionMode = postConditionMode;
    this.postConditions = postConditions;

    this.anchorMode = AnchorMode.Any;
  }

  /** @deprecated Does NOT mutate transaction, but rather returns the hash of the transaction with a cleared initial authorization */
  signBegin() {
    const tx = cloneDeep(this);
    tx.auth = intoInitialSighashAuth(tx.auth);
    return tx.txid();
  }

  /** @deprecated Alias of `.signBegin()` */
  verifyBegin() {
    const tx = cloneDeep(this);
    tx.auth = intoInitialSighashAuth(tx.auth);
    return tx.txid();
  }

  verifyOrigin(): string {
    return verifyOrigin(this.auth, this.verifyBegin());
  }

  signNextOrigin(sigHash: string, privateKey: PrivateKey): string {
    if (this.auth.spendingCondition === undefined) {
      throw new Error('"auth.spendingCondition" is undefined');
    }
    if (this.auth.authType === undefined) {
      throw new Error('"auth.authType" is undefined');
    }
    return this.signAndAppend(this.auth.spendingCondition, sigHash, AuthType.Standard, privateKey);
  }

  signNextSponsor(sigHash: string, privateKey: PrivateKey): string {
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

  /**
   * Append a public key to the spending-condition of the transaction
   *
   * @param publicKey - the public key to append
   * @example
   * ```ts
   * import { makeSTXTokenTransfer } from '@stacks/transactions';
   *
   * const transaction = makeSTXTokenTransfer({ ... });
   * transaction.appendPubkey('034f355bdcb7cc0af728..24c0e585c5e89ac788521e0');
   * ```
   */
  appendPubkey(publicKey: PublicKey): void;
  appendPubkey(publicKey: PublicKeyWire): void;
  appendPubkey(publicKey: PublicKey | PublicKeyWire): void {
    const wire =
      typeof publicKey === 'object' && 'type' in publicKey
        ? publicKey
        : createStacksPublicKey(publicKey);

    const cond = this.auth.spendingCondition;
    if (cond && !isSingleSig(cond)) {
      const compressed = publicKeyIsCompressed(wire.data);
      cond.fields.push(
        createTransactionAuthField(
          compressed ? PubKeyEncoding.Compressed : PubKeyEncoding.Uncompressed,
          wire
        )
      );
    } else {
      throw new Error(`Can't append public key to a singlesig condition`);
    }
  }

  // todo: this could be static?
  /** **Warning**: method mutates the `condition` param */
  signAndAppend(
    /** `condition` is mutated by this method */
    condition: SpendingConditionOpts,
    curSigHash: string,
    authType: AuthType,
    privateKey: PrivateKey
  ): string {
    const { nextSig, nextSigHash } = nextSignature(
      curSigHash,
      authType,
      condition.fee,
      condition.nonce,
      privateKey
    );
    if (isSingleSig(condition)) {
      condition.signature = createMessageSignature(nextSig);
    } else {
      const compressed = privateKeyIsCompressed(privateKey);
      condition.fields.push(
        createTransactionAuthField(
          compressed ? PubKeyEncoding.Compressed : PubKeyEncoding.Uncompressed,
          createMessageSignature(nextSig)
        )
      );
    }

    return nextSigHash;
  }

  txid(): string {
    const serialized = this.serializeBytes();
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

  /**
   * Serialize a transaction to a hex string (byte representation)
   *
   * @returns A hex string of the serialized transaction
   * @example
   * ```ts
   * import { makeSTXTokenTransfer } from '@stacks/transactions';
   *
   * const transaction = makeSTXTokenTransfer({ ... });
   * const hex = transaction.serialize();
   * ```
   */
  serialize(): Hex {
    return bytesToHex(this.serializeBytes());
  }

  /**
   * Serialize a transaction to bytes
   *
   * @returns A Uint8Array of the serialized transaction
   * @example
   * ```ts
   * import { makeSTXTokenTransfer } from '@stacks/transactions';
   *
   * const transaction = makeSTXTokenTransfer({ ... });
   * const bytes = transaction.serializeBytes();
   * ```
   */
  serializeBytes(): Uint8Array {
    if (this.transactionVersion === undefined) {
      throw new SerializationError('"transactionVersion" is undefined');
    }
    if (this.chainId === undefined) {
      throw new SerializationError('"chainId" is undefined');
    }
    if (this.auth === undefined) {
      throw new SerializationError('"auth" is undefined');
    }
    if (this.payload === undefined) {
      throw new SerializationError('"payload" is undefined');
    }

    const bytesArray = [];

    bytesArray.push(this.transactionVersion);
    const chainIdBytes = new Uint8Array(4);
    writeUInt32BE(chainIdBytes, this.chainId, 0);
    bytesArray.push(chainIdBytes);
    bytesArray.push(serializeAuthorizationBytes(this.auth));
    bytesArray.push(this.anchorMode);
    bytesArray.push(this.postConditionMode);
    bytesArray.push(serializeLPListBytes(this.postConditions));
    bytesArray.push(serializePayloadBytes(this.payload));

    return concatArray(bytesArray);
  }
}

/**
 * @param tx hex string or bytes of serialized transaction
 */
export function deserializeTransaction(tx: string | Uint8Array | BytesReader) {
  const bytesReader = isInstance(tx, BytesReader) ? tx : new BytesReader(tx);
  const transactionVersion = bytesReader.readUInt8Enum(TransactionVersion, n => {
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
  const postConditions = deserializeLPList(bytesReader, StacksWireType.PostCondition);
  const payload = deserializePayload(bytesReader);

  const transaction = new StacksTransactionWire({
    transactionVersion,
    chainId,
    auth,
    payload,
    postConditions,
    postConditionMode,
  });
  transaction.anchorMode = anchorMode; // not used anymore, but part of the transaction wire format
  return transaction;
}

/** @ignore */
export function deriveNetworkFromTx(transaction: StacksTransactionWire) {
  // todo: maybe add as renamed public method
  return whenTransactionVersion(transaction.transactionVersion)({
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
export function estimateTransactionByteLength(transaction: StacksTransactionWire): number {
  const hashMode = transaction.auth.spendingCondition.hashMode;
  // List of Multi-sig transaction hash modes
  const multiSigHashModes = [AddressHashMode.P2SH, AddressHashMode.P2WSH];

  // Check if its a Multi-sig transaction
  if (multiSigHashModes.includes(hashMode)) {
    const multiSigSpendingCondition: MultiSigSpendingCondition = transaction.auth
      .spendingCondition as MultiSigSpendingCondition;

    // Find number of existing signatures if the transaction is signed or partially signed
    const existingSignatures = multiSigSpendingCondition.fields.filter(
      field => field.contents.type === StacksWireType.MessageSignature
    ).length; // existingSignatures will be 0 if its a unsigned transaction

    // Estimate total signature bytes size required for this multi-sig transaction
    // Formula: totalSignatureLength = (signaturesRequired - existingSignatures) * (SIG_LEN_BYTES + 1 byte for type of signature)
    const totalSignatureLength =
      (multiSigSpendingCondition.signaturesRequired - existingSignatures) *
      (RECOVERABLE_ECDSA_SIG_LENGTH_BYTES + 1);

    return transaction.serializeBytes().byteLength + totalSignatureLength;
  } else {
    // Single-sig transaction
    // Signature space already allocated by empty message signature
    return transaction.serializeBytes().byteLength;
  }
}

/**
 * Alias for `transaction.serialize()`
 *
 * Serializes a transaction to a hex string.
 *
 * @example
 * ```ts
 * import { makeSTXTokenTransfer, serializeTransaction } from '@stacks/transactions';
 *
 * const transaction = makeSTXTokenTransfer({ ... });
 * const hex = serializeTransaction(transaction);
 * ```
 */
export function serializeTransaction(transaction: StacksTransactionWire): Hex {
  return transaction.serialize();
}

/**
 * Alias for `transaction.serializeBytes()`
 *
 * Serializes a transaction to bytes.
 *
 * @example
 * ```ts
 * import { makeSTXTokenTransfer, serializeTransactionBytes } from '@stacks/transactions';
 *
 * const transaction = makeSTXTokenTransfer({ ... });
 * const bytes = serializeTransactionBytes(transaction);
 * ```
 */
export function serializeTransactionBytes(transaction: StacksTransactionWire): Uint8Array {
  return transaction.serializeBytes();
}

/**
 * Alias for `transaction.serialize()`
 *
 * Serializes a transaction to a hex string.
 *
 * @example
 * ```ts
 * import { makeSTXTokenTransfer, transactionToHex } from '@stacks/transactions';
 *
 * const transaction = makeSTXTokenTransfer({ ... });
 * const hex = transactionToHex(transaction);
 * ```
 */
export function transactionToHex(transaction: StacksTransactionWire): string {
  return transaction.serialize();
}
