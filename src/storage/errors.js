'use strict'

export class UnsupportedNetstringTypeError extends Error {
  constructor(message) {
    super()
    this.name = 'UnsupportedNetstringTypeError'
    this.message = (message || '')
  }
}

export class InvalidNetstringError extends Error {
  constructor(message) {
     super()
     this.name = 'InvalidNetstringError'
     this.message = (message || '')
  }
}

