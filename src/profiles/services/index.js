import { Facebook } from './facebook'
import { Github } from './github'
import { Twitter } from './twitter'
import { Instagram } from './instagram'
import { HackerNews } from './hackerNews'
import { LinkedIn } from './linkedIn'

export const profileServices = {
  facebook: Facebook,
  github: Github,
  twitter: Twitter,
  instagram: Instagram,
  hackerNews: HackerNews,
  linkedIn: LinkedIn
}

export { containsValidProofStatement, containsValidAddressProofStatement } from './serviceUtils'
