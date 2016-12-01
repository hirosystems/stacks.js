import test from 'tape'
import { services } from '../services/index'
import { Service } from '../services/service'
import { Facebook } from '../services/facebook'
import { sampleProofs } from './sampleProofs'


export function runServicesUnitTests() {
  test('get proof url', (t) => {
    t.plan(3)
    t.equal(services.facebook.getProofUrl(sampleProofs.naval[1]), "https://www.facebook.com/navalr/posts/10152190734077261")
    t.equal(services.github.getProofUrl(sampleProofs.naval[2]), "https://gist.github.com/navalr/f31a74054f859ec0ac6a")
    t.equal(services.twitter.getProofUrl(sampleProofs.naval[0]), "https://twitter.com/naval/status/486609266212499456")
  })
}
