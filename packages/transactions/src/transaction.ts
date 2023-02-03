import {
  bytesToHex,
  concatArray,
  hexToBytes,
  IntegerType,
  intToBigInt,
  writeUInt32BE,
} from '@stacks/common';
import {
  AnchorMode,
  anchorModeFromNameOrValue,
  AnchorModeName,
  AuthType,
  ChainID,
  DEFAULT_CHAIN_ID,
  PayloadType,
  PostConditionMode,
  PubKeyEncoding,
  StacksMessageType,
  TransactionVersion,
} from './constants';

import {
  Authorization,
  deserializeAuthorization,
  intoInitialSighashAuth,
  isSingleSig,
  nextSignature,
  serializeAuthorization,
  setFee,
  setNonce,
  setSponsor,
  setSponsorNonce,
  SpendingConditionOpts,
  verifyOrigin,
} from './authorization';
import { createTransactionAuthField } from './signature';

import { cloneDeep, txidFromData } from './utils';

import { deserializePayload, Payload, PayloadInput, serializePayload } from './payload';

import { createLPList, deserializeLPList, LengthPrefixedList, serializeLPList } from './types';

import { isCompressed, StacksPrivateKey, StacksPublicKey } from './keys';

import { BytesReader } from './bytesReader';

import { SerializationError, SigningError } from './errors';

export class StacksTransaction {
  version: TransactionVersion;
  chainId: ChainID;
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
    chainId?: ChainID
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
      this.anchorMode = anchorModeFromNameOrValue(anchorMode);
    } else {
      switch (payload.payloadType) {
        case PayloadType.Coinbase:
        case PayloadType.CoinbaseToAltRecipient:
        case PayloadType.PoisonMicroblock: {
          this.anchorMode = AnchorMode.OnChainOnly;
          break;
        }
        case PayloadType.ContractCall:
        case PayloadType.SmartContract:
        case PayloadType.VersionedSmartContract:
        case PayloadType.TokenTransfer: {
          this.anchorMode = AnchorMode.Any;
          break;
        }
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
 * @param data Uint8Array or hex string
 */
export function deserializeTransaction(data: BytesReader | Uint8Array | string) {
  let bytesReader: BytesReader;
  if (typeof data === 'string') {
    if (data.slice(0, 2).toLowerCase() === '0x') {
      bytesReader = new BytesReader(hexToBytes(data.slice(2)));
    } else {
      bytesReader = new BytesReader(hexToBytes(data));
    }
  } else if (data instanceof Uint8Array) {
    bytesReader = new BytesReader(data);
  } else {
    bytesReader = data;
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
