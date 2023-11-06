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
