'use strict'

import { Facebook } from './facebook'
import { Github } from './github'
import { Twitter } from './twitter'
export { containsValidProofStatement } from './serviceUtils'

export const services = {
  facebook: Facebook,
  github: Github,
  twitter: Twitter
}