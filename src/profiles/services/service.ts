import { containsValidProofStatement, containsValidAddressProofStatement } from './serviceUtils'
import { fetchPrivate } from '../../fetchUtil'
import { AccountProofInfo } from '../profileProofs'

export type CheerioModuleType = typeof import('cheerio')

/**
 * @ignore
 */
export abstract class Service {
  async validateProof(proof: AccountProofInfo,
                      ownerAddress: string,
                      cheerio: CheerioModuleType,
                      name: string = null
  ): Promise<AccountProofInfo> {
    try {
      const proofUrl = this.getProofUrl(proof)
      const res = await fetchPrivate(proofUrl)
      if (res.status !== 200) {
        throw new Error(`Proof url ${proofUrl} returned unexpected http status ${res.status}.
            Unable to validate proof.`)
      }
      const text = await res.text()

      // Validate identity in provided proof body/tags if required
      if (this.shouldValidateIdentityInBody()
          && proof.identifier !== this.getProofIdentity(text, cheerio)) {
        return proof
      }
      const proofText = this.getProofStatement(text, cheerio)
      proof.valid = containsValidProofStatement(proofText, name)
        || containsValidAddressProofStatement(proofText, ownerAddress)
      return proof
    } catch (error) {
      console.error(error)
      proof.valid = false
      return proof
    }
  }

  shouldValidateIdentityInBody() {
    return false
  }

  prefixScheme(proofUrl: string) {
    if (!proofUrl.startsWith('https://') && !proofUrl.startsWith('http://')) {
      return `https://${proofUrl}`
    } else if (proofUrl.startsWith('http://')) {
      return proofUrl.replace('http://', 'https://')
    } else {
      return proofUrl
    }
  }

  getProofIdentity(searchText: string, _cheerio: CheerioModuleType): string {
    return searchText
  }

  abstract getProofUrl(proof: AccountProofInfo): string;

  abstract getProofStatement(searchText: string, cheerio: CheerioModuleType): string;

  abstract normalizeUrl(proof: AccountProofInfo): string;
}
