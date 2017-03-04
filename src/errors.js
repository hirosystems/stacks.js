'use strict'

export class InvalidDIDError extends Error {
  constructor(message) {
    super()
    this.name = 'InvalidDIDError'
    this.message = (message || '')
  }
}