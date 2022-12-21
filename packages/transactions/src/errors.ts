class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.message = message;
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class SerializationError extends TransactionError {
  constructor(message: string) {
    super(message);
  }
}

export class DeserializationError extends TransactionError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when `NoEstimateAvailable` is received as an error reason from a
 * Stacks node. The Stacks node has not seen this kind of contract-call before,
 * and it cannot provide an estimate yet.
 * @see https://docs.hiro.so/api#tag/Fees/operation/post_fee_transaction
 */
export class NoEstimateAvailableError extends TransactionError {
  constructor(message: string) {
    super(message);
  }
}

export class NotImplementedError extends TransactionError {
  constructor(message: string) {
    super(message);
  }
}

export class SigningError extends TransactionError {
  constructor(message: string) {
    super(message);
  }
}

export class VerificationError extends TransactionError {
  constructor(message: string) {
    super(message);
  }
}
