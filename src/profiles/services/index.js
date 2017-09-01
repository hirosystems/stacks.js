import { Facebook } from './facebook'
import { Github } from './github'
import { Twitter } from './twitter'

export const profileServices = {
  facebook: Facebook,
  github: Github,
  twitter: Twitter
}

export { containsValidProofStatement, containsValidBitcoinProofStatement } from './serviceUtils'
