import { Facebook } from './facebook'
import { Github } from './github'
import { Twitter } from './twitter'
import { Instagram } from './instagram'

export const profileServices = {
  facebook: Facebook,
  github: Github,
  twitter: Twitter,
  instagram: Instagram
}

export { containsValidProofStatement, containsValidBitcoinProofStatement } from './serviceUtils'
