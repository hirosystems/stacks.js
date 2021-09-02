import { StacksTransaction } from './transaction';

import { StacksPrivateKey, StacksPublicKey } from './keys';
import { isSingleSig, nextVerification, SpendingConditionOpts } from './authorization';
import { cloneDeep } from './utils';
import { AuthType, PubKeyEncoding, StacksMessageType } from './constants';
import { SigningError } from './errors';

export class TransactionSigner {
  transaction: StacksTransaction;
  sigHash: string;
  originDone: boolean;
  checkOversign: boolean;
  checkOverlap: boolean;

  constructor(transaction: StacksTransaction) {
    this.transaction = transaction;
    this.sigHash = transaction.signBegin();
    this.originDone = false;
    this.checkOversign = true;
    this.checkOverlap = true;

    // If multi-sig spending condition exists, iterate over
    // auth fields and reconstruct sigHash
    const spendingCondition = transaction.auth.spendingCondition;
    if (spendingCondition && !isSingleSig(spendingCondition)) {
      if (
        spendingCondition.fields.filter(
          field => field.contents.type === StacksMessageType.MessageSignature
        ).length >= spendingCondition.signaturesRequired
      ) {
        throw new Error('SpendingCondition has more signatures than are expected');
      }

      spendingCondition.fields.forEach(field => {
        if (field.contents.type === StacksMessageType.MessageSignature) {
          const signature = field.contents;
          const nextVerify = nextVerification(
            this.sigHash,
            transaction.auth.authType,
            spendingCondition.fee,
            spendingCondition.nonce,
            PubKeyEncoding.Compressed, // always compressed for multisig
            signature
          );
          this.sigHash = nextVerify.nextSigHash;
        }
      });
    }
  }

  static createSponsorSigner(
    transaction: StacksTransaction,
    spendingCondition: SpendingConditionOpts
  ) {
    if (transaction.auth.authType != AuthType.Sponsored) {
      throw new SigningError('Cannot add sponsor to non-sponsored transaction');
    }

    const tx: StacksTransaction = cloneDeep(transaction);
    tx.setSponsor(spendingCondition);
    const originSigHash = tx.verifyOrigin();
    const signer = new this(tx);
    signer.originDone = true;
    signer.sigHash = originSigHash;
    signer.checkOversign = true;
    signer.checkOverlap = true;
    return signer;
  }

  signOrigin(privateKey: StacksPrivateKey) {
    if (this.checkOverlap && this.originDone) {
      throw new SigningError('Cannot sign origin after sponsor key');
    }

    if (this.transaction.auth === undefined) {
      throw new SigningError('"transaction.auth" is undefined');
    }
    if (this.transaction.auth.spendingCondition === undefined) {
      throw new SigningError('"transaction.auth.spendingCondition" is undefined');
    }

    if (!isSingleSig(this.transaction.auth.spendingCondition)) {
      const spendingCondition = this.transaction.auth.spendingCondition;
      if (
        this.checkOversign &&
        spendingCondition.fields.filter(
          field => field.contents.type === StacksMessageType.MessageSignature
        ).length >= spendingCondition.signaturesRequired
      ) {
        throw new Error('Origin would have too many signatures');
      }
    }

    const nextSighash = this.transaction.signNextOrigin(this.sigHash, privateKey);
    this.sigHash = nextSighash;
  }

  appendOrigin(publicKey: StacksPublicKey) {
    if (this.checkOverlap && this.originDone) {
      throw Error('Cannot append public key to origin after sponsor key');
    }

    if (this.transaction.auth === undefined) {
      throw new Error('"transaction.auth" is undefined');
    }
    if (this.transaction.auth.spendingCondition === undefined) {
      throw new Error('"transaction.auth.spendingCondition" is undefined');
    }

    this.transaction.appendPubkey(publicKey);
  }

  signSponsor(privateKey: StacksPrivateKey) {
    if (this.transaction.auth === undefined) {
      throw new SigningError('"transaction.auth" is undefined');
    }
    if (this.transaction.auth.authType !== AuthType.Sponsored) {
      throw new SigningError('"transaction.auth.authType" is not AuthType.Sponsored');
    }

    const nextSighash = this.transaction.signNextSponsor(this.sigHash, privateKey);
    this.sigHash = nextSighash;
    this.originDone = true;
  }

  getTxInComplete(): StacksTransaction {
    return cloneDeep(this.transaction);
  }

  resume(transaction: StacksTransaction) {
    this.transaction = cloneDeep(transaction);
    this.sigHash = transaction.signBegin();
  }
}
