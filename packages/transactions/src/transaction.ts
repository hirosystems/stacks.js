import {
  DEFAULT_CHAIN_ID,
  TransactionVersion,
  PayloadType,
  AnchorMode,
  PostConditionMode,
  AuthType,
  StacksMessageType,
  ChainID,
  AddressHashMode,
} from './constants';

import {
  Authorization,
  SpendingCondition,
  nextSignature,
  isSingleSig,
  SingleSigSpendingCondition,
  MultiSigSpendingCondition,
  createTransactionAuthField,
} from './authorization';

import { BufferArray, txidFromData, cloneDeep } from './utils';

import { Payload, serializePayload, deserializePayload } from './payload';

import { LengthPrefixedList, serializeLPList, deserializeLPList, createLPList } from './types';

import { StacksPrivateKey, StacksPublicKey } from './keys';

import { BufferReader } from './bufferReader';

import * as BigNum from 'bn.js';
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
    payload: Payload,
    postConditions?: LengthPrefixedList,
    postConditionMode?: PostConditionMode,
    anchorMode?: AnchorMode,
    chainId?: ChainID
  ) {
    this.version = version;
    this.auth = auth;
    this.payload = payload;
    this.chainId = chainId ?? DEFAULT_CHAIN_ID;
    this.postConditionMode = postConditionMode ?? PostConditionMode.Deny;
    this.postConditions = postConditions ?? createLPList([]);

    if (anchorMode) {
      this.anchorMode = anchorMode;
    } else {
      switch (payload.payloadType) {
        case PayloadType.Coinbase:
        case PayloadType.PoisonMicroblock: {
          this.anchorMode = AnchorMode.OnChainOnly;
          break;
        }
        case PayloadType.ContractCall:
        case PayloadType.SmartContract:
        case PayloadType.TokenTransfer: {
          this.anchorMode = AnchorMode.Any;
          break;
        }
      }
    }
  }

  signBegin() {
    const tx = cloneDeep(this);
    tx.auth = tx.auth.intoInitialSighashAuth();
    return tx.txid();
  }

  verifyBegin() {
    const tx = cloneDeep(this);
    tx.auth = tx.auth.intoInitialSighashAuth();
    return tx.txid();
  }

  verifyOrigin(): string {
    return this.auth.verifyOrigin(this.verifyBegin());
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
    if (this.auth.sponsorSpendingCondition === undefined) {
      throw new Error('"auth.spendingCondition" is undefined');
    }
    if (this.auth.authType === undefined) {
      throw new Error('"auth.authType" is undefined');
    }
    return this.signAndAppend(
      this.auth.sponsorSpendingCondition,
      sigHash,
      AuthType.Sponsored,
      privateKey
    );
  }

  appendPubkey(publicKey: StacksPublicKey) {
    const cond = this.auth.spendingCondition;
    if (cond && !isSingleSig(cond)) {
      cond.fields.push(createTransactionAuthField(publicKey));
    } else {
      throw new Error(`Can't append public key to a singlesig condition`);
    }
  }

  signAndAppend(
    condition: SpendingCondition,
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
      condition.fields.push(createTransactionAuthField(nextSig));
    }

    return nextSigHash;
  }

  txid(): string {
    const serialized = this.serialize();
    return txidFromData(serialized);
  }

  setSponsor(sponsorSpendingCondition: SpendingCondition) {
    if (this.auth.authType != AuthType.Sponsored) {
      throw new SigningError('Cannot sponsor sign a non-sponsored transaction');
    }

    this.auth.setSponsor(sponsorSpendingCondition);
  }

  /**
   * Set the total fee to be paid for this transaction
   *
   * @param {BigNum} fee - the fee amount in microstacks
   */
  setFee(amount: BigNum) {
    this.auth.setFee(amount);
  }

  /**
   * Set the transaction nonce
   *
   * @param {BigNum} nonce - the nonce value
   */
  setNonce(nonce: BigNum) {
    this.auth.setNonce(nonce);
  }

  /**
   * Set the transaction sponsor nonce
   *
   * @param {BigNum} nonce - the sponsor nonce value
   */
  setSponsorNonce(nonce: BigNum) {
    this.auth.setSponsorNonce(nonce);
  }

  serialize(): Buffer {
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

    const bufferArray: BufferArray = new BufferArray();

    bufferArray.appendByte(this.version);
    const chainIdBuffer = Buffer.alloc(4);
    chainIdBuffer.writeUInt32BE(this.chainId, 0);
    bufferArray.push(chainIdBuffer);
    bufferArray.push(this.auth.serialize());
    bufferArray.appendByte(this.anchorMode);
    bufferArray.appendByte(this.postConditionMode);
    bufferArray.push(serializeLPList(this.postConditions));
    bufferArray.push(serializePayload(this.payload));

    return bufferArray.concatBuffer();
  }
}

export function deserializeTransaction(bufferReader: BufferReader) {
  const version = bufferReader.readUInt8Enum(TransactionVersion, n => {
    throw new Error(`Could not parse ${n} as TransactionVersion`);
  });
  const chainId = bufferReader.readUInt32BE();
  const auth = Authorization.deserialize(bufferReader);
  const anchorMode = bufferReader.readUInt8Enum(AnchorMode, n => {
    throw new Error(`Could not parse ${n} as AnchorMode`);
  });
  const postConditionMode = bufferReader.readUInt8Enum(PostConditionMode, n => {
    throw new Error(`Could not parse ${n} as PostConditionMode`);
  });
  const postConditions = deserializeLPList(bufferReader, StacksMessageType.PostCondition);
  const payload = deserializePayload(bufferReader);

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
