export class MissingParametersError extends Error {
  constructor(message = '') {
    super()
    this.name = 'MissingParametersError'
    this.message = message
  }
}

export class InvalidDIDError extends Error {
  constructor(message = '') {
    super()
    this.name = 'InvalidDIDError'
    this.message = message
  }
}
