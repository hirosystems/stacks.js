import { Facebook } from './facebook'
import { Github } from './github'
import { Twitter } from './twitter'
import { Instagram } from './instagram'
import { HackerNews } from './hackerNews'
import { LinkedIn } from './linkedIn'
import { Service } from './service'
import { Proof } from './proof'

interface ValidateProofService {
  validateProof(proof: Proof, ownerAddress: string, name?: string): Promise<any>;
  getProofUrl(proof: Proof): string;
  getProofStatement(searchText: string): string;
  normalizeUrl(proof: Proof): string;
  getProofIdentity(searchText: string): string;
}

/** @ignore */
export const profileServices: {
  [serviceName: string]: Service & ValidateProofService
} = {
  facebook: Facebook,
  github: Github,
  twitter: Twitter,
  instagram: Instagram,
  hackerNews: HackerNews,
  linkedIn: LinkedIn
}
