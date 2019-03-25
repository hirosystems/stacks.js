
export const ERROR_CODES = {
  MISSING_PARAMETER: 'missing_parameter',
  REMOTE_SERVICE_ERROR: 'remote_service_error',
  INVALID_STATE: 'invalid_state',
  NO_SESSION_DATA: 'no_session_data',
  UNKNOWN: 'unknown'
}

Object.freeze(ERROR_CODES)

type ErrorType = {
  code: string,
  parameter?: string,
  message: string
}

export class BlockstackError extends Error {
  message: string

  code: string

  parameter?: string

  constructor(error: ErrorType) {
    super(error.message)
    this.message = error.message
    this.code = error.code
    this.parameter = error.parameter ? error.parameter : null
  }

  toString() {
    return `${super.toString()}
    code: ${this.code} param: ${this.parameter ? this.parameter : 'n/a'}`
  }
}

export class InvalidParameterError extends BlockstackError {
  constructor(parameter: string, message: string = '') {
    super({ code: 'missing_parameter', message, parameter: '' })
    this.name = 'MissingParametersError'
  }
}

export class MissingParameterError extends BlockstackError {
  constructor(parameter: string, message: string = '') {
    super({ code: ERROR_CODES.MISSING_PARAMETER, message, parameter })
    this.name = 'MissingParametersError'
  }
}

export class RemoteServiceError extends BlockstackError {
  response: Response

  constructor(response: Response, message: string = '') {
    super({ code: ERROR_CODES.REMOTE_SERVICE_ERROR, message })
    this.response = response
  }
}

export class InvalidDIDError extends BlockstackError {
  constructor(message: string = '') {
    super({ code: 'invalid_did_error', message })
    this.name = 'InvalidDIDError'
  }
}

export class NotEnoughFundsError extends BlockstackError {
  leftToFund: number

  constructor(leftToFund: number) {
    const message = `Not enough UTXOs to fund. Left to fund: ${leftToFund}`
    super({ code: 'not_enough_error', message })
    this.leftToFund = leftToFund
    this.name = 'NotEnoughFundsError'
    this.message = message
  }
}

export class InvalidAmountError extends BlockstackError {
  fees: number

  specifiedAmount: number

  constructor(fees: number, specifiedAmount: number) {
    const message = `Not enough coin to fund fees transaction fees. Fees would be ${fees},`
          + ` specified spend is  ${specifiedAmount}`
    super({ code: 'invalid_amount_error', message })
    this.specifiedAmount = specifiedAmount
    this.fees = fees
    this.name = 'InvalidAmountError'
    this.message = message
  }
}

export class LoginFailedError extends BlockstackError {
  constructor(reason: string) {
    const message = `Failed to login: ${reason}`
    super({ code: 'login_failed', message })
    this.message = message
    this.name = 'LoginFailedError'
  }
}

export class SignatureVerificationError extends BlockstackError {
  constructor(reason: string) {
    const message = `Failed to verify signature: ${reason}`
    super({ code: 'signature_verification_failure', message })
    this.message = message
    this.name = 'SignatureVerificationError'
  }
}

export class InvalidStateError extends BlockstackError {
  constructor(message: string) {
    super({ code: ERROR_CODES.INVALID_STATE, message })
    this.message = message
    this.name = 'InvalidStateError'
  }
}

export class NoSessionDataError extends BlockstackError {
  constructor(message: string) {
    super({ code: ERROR_CODES.INVALID_STATE, message })
    this.message = message
    this.name = 'NoSessionDataError'
  }
}
