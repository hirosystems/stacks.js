/* @flow */
export const ERROR_CODES = {
  MISSING_PARAMETER: 'missing_parameter',
  REMOTE_SERVICE_ERROR: 'remote_service_error',
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
    super(error.message)
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
    super({ code: 'invalid_did_error', message, param: '' })
    this.name = 'InvalidDIDError'
    this.message = message
  }
}
