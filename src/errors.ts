
/**
* @ignore
*/
export const ERROR_CODES = {
  MISSING_PARAMETER: 'missing_parameter',
  REMOTE_SERVICE_ERROR: 'remote_service_error',
  INVALID_STATE: 'invalid_state',
  NO_SESSION_DATA: 'no_session_data',
  FILE_NOT_FOUND: 'file_not_found',
  FAILED_DECRYPTION_ERROR: 'failed_decryption_error',
  INVALID_DID_ERROR: 'invalid_did_error',
  NOT_ENOUGH_FUNDS_ERROR: 'not_enough_error',
  INVALID_AMOUNT_ERROR: 'invalid_amount_error',
  LOGIN_FAILED_ERROR: 'login_failed',
  SIGNATURE_VERIFICATION_ERROR: 'signature_verification_failure',
  UNKNOWN: 'unknown'
}

Object.freeze(ERROR_CODES)

/**
* @ignore
*/
type ErrorType = {
  code: string,
  parameter?: string,
  message: string
}

/**
* @ignore
*/
export class BlockstackError extends Error {
  message: string

  code: string

  parameter?: string

  constructor(error: ErrorType) {
    let message = error.message
    let bugMessage = `Error Code: ${error.code}`
    let stack = null
    try {
      throw new Error()
    } catch (e) {
      stack = e.stack
    }
    if (stack) {
      bugMessage += `\nStack Trace:\n${stack}`
    }
    message += '\nIf you believe this exception is caused by a bug in blockstack.js'
      + ', please file a bug report: https://community.blockstack.org/bugs?'
      + `9ndd2=Bug&4ud0i=${encodeURIComponent(bugMessage)}`
    
    super(message)
    this.message = message
    this.code = error.code
    this.parameter = error.parameter ? error.parameter : null
  }

  toString() {
    return `${super.toString()}
    code: ${this.code} param: ${this.parameter ? this.parameter : 'n/a'}`
  }
}

/**
* @ignore
*/
export class FileNotFound extends BlockstackError {
  constructor(message: string) {
    super({ message, code: ERROR_CODES.FILE_NOT_FOUND })
    this.name = 'FileNotFound'
  }
}

/**
* @ignore
*/
export class InvalidParameterError extends BlockstackError {
  constructor(parameter: string, message: string = '') {
    super({ code: ERROR_CODES.MISSING_PARAMETER, message, parameter: '' })
    this.name = 'MissingParametersError'
  }
}

/**
* @ignore
*/
export class MissingParameterError extends BlockstackError {
  constructor(parameter: string, message: string = '') {
    super({ code: ERROR_CODES.MISSING_PARAMETER, message, parameter })
    this.name = 'MissingParametersError'
  }
}

/**
* @ignore
*/
export class RemoteServiceError extends BlockstackError {
  response: Response

  constructor(response: Response, message: string = '') {
    super({ code: ERROR_CODES.REMOTE_SERVICE_ERROR, message })
    this.response = response
  }
}

/**
* @ignore
*/
export class InvalidDIDError extends BlockstackError {
  constructor(message: string = '') {
    super({ code: ERROR_CODES.INVALID_DID_ERROR, message })
    this.name = 'InvalidDIDError'
  }
}

/**
* @ignore
*/
export class NotEnoughFundsError extends BlockstackError {
  leftToFund: number

  constructor(leftToFund: number) {
    const message = `Not enough UTXOs to fund. Left to fund: ${leftToFund}`
    super({ code: ERROR_CODES.NOT_ENOUGH_FUNDS_ERROR, message })
    this.leftToFund = leftToFund
    this.name = 'NotEnoughFundsError'
    this.message = message
  }
}

/**
* @ignore
*/

export class InvalidAmountError extends BlockstackError {
  fees: number

  specifiedAmount: number

  constructor(fees: number, specifiedAmount: number) {
    const message = `Not enough coin to fund fees transaction fees. Fees would be ${fees},`
          + ` specified spend is  ${specifiedAmount}`
    super({ code: ERROR_CODES.INVALID_AMOUNT_ERROR, message })
    this.specifiedAmount = specifiedAmount
    this.fees = fees
    this.name = 'InvalidAmountError'
    this.message = message
  }
}

/**
* @ignore
*/
export class LoginFailedError extends BlockstackError {
  constructor(reason: string) {
    const message = `Failed to login: ${reason}`
    super({ code: ERROR_CODES.LOGIN_FAILED_ERROR, message })
    this.message = message
    this.name = 'LoginFailedError'
  }
}

/**
* @ignore
*/
export class SignatureVerificationError extends BlockstackError {
  constructor(reason: string) {
    const message = `Failed to verify signature: ${reason}`
    super({ code: ERROR_CODES.SIGNATURE_VERIFICATION_ERROR, message })
    this.message = message
    this.name = 'SignatureVerificationError'
  }
}

export class FailedDecryptionError extends BlockstackError {
  constructor(message: string = 'Unable to decrypt cipher object.') {
    super({ code: ERROR_CODES.FAILED_DECRYPTION_ERROR, message })
    this.message = message
    this.name = 'FailedDecryptionError'
  }
}

/**
* @ignore
*/
export class InvalidStateError extends BlockstackError {
  constructor(message: string) {
    super({ code: ERROR_CODES.INVALID_STATE, message })
    this.message = message
    this.name = 'InvalidStateError'
  }
}

/**
* @ignore
*/
export class NoSessionDataError extends BlockstackError {
  constructor(message: string) {
    super({ code: ERROR_CODES.INVALID_STATE, message })
    this.message = message
    this.name = 'NoSessionDataError'
  }
}
