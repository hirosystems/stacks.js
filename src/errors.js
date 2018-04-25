/* @flow */
export const ERROR_CODES = {
  MISSING_PARAMETER: 'missing_parameter',
  REMOTE_SERVICE_ERROR: 'remote_service_error',
  FAILED_DECRYPTION_ERROR: 'failed_decryption_error',
  INVALID_DID_ERROR: 'invalid_did_error',
  NOT_ENOUGH_FUNDS_ERROR: 'not_enough_error',
  INVALID_AMOUNT_ERROR: 'invalid_amount_error',
  LOGIN_FAILED_ERROR: 'login_failed',
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
  parameter: ?string
  constructor(error: ErrorType) {
    let { message } = error
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
    message += '\nIf you believe this exception is caused by a bug in blockstack.js' +
      ', please file a bug report: https://community.blockstack.org/bugs?' +
      `9ndd2=Bug&4ud0i=${encodeURIComponent(bugMessage)}`
    super(message)
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
    super({ code: ERROR_CODES.MISSING_PARAMETER, message, parameter: '' })
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
    super({ code: ERROR_CODES.INVALID_DID_ERROR, message, param: '' })
    this.name = 'InvalidDIDError'
    this.message = message
  }
}

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

export class InvalidAmountError extends BlockstackError {
  fees: number
  specifiedAmount: number
  constructor(fees: number, specifiedAmount: number) {
    const message = `Not enough coin to fund fees transaction fees. Fees would be ${fees},` +
          ` specified spend is  ${specifiedAmount}`
    super({ code: ERROR_CODES.INVALID_AMOUNT_ERROR, message })
    this.specifiedAmount = specifiedAmount
    this.fees = fees
    this.name = 'InvalidAmountError'
    this.message = message
  }
}

export class LoginFailedError extends BlockstackError {
  constructor(reason: string) {
    const message = `Failed to login: ${reason}`
    super({ code: ERROR_CODES.LOGIN_FAILED_ERROR, message })
    this.message = message
    this.name = 'LoginFailedError'
  }
}

export class FailedDecryptionError extends BlockstackError {
  constructor(message: ?string) {
    message = message || 'Unable to decrypt cipher object.'
    super({ code: ERROR_CODES.FAILED_DECRYPTION_ERROR, message })
    this.message = message
  }
}
