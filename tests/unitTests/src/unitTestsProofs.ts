import * as test from 'tape-promise/tape'
import * as FetchMock from 'fetch-mock'

import {
  validateProofs, containsValidProofStatement, containsValidAddressProofStatement
} from '../../../src'
import { profileServices } from '../../../src/profiles/services'

import {
  sampleProfiles, sampleProofs,
  sampleVerifications, sampleAddressBasedVerifications
} from './sampleData'


function mockRequests() {
  const naval = sampleVerifications.naval
  const larry = sampleVerifications.larry

  FetchMock.get(naval.facebook.url, naval.facebook.body)
  FetchMock.get(`${naval.github.url}/raw`, naval.github.body)
  FetchMock.get(naval.twitter.url, naval.twitter.body)
  FetchMock.get(larry.facebook.url, larry.facebook.body)
}

function testProofs(profile, username, totalProofs) {
  test(`Profiles ${username}`,
       (t) =>  { // FetchMock.get('https://www.facebook.com/larry.salibra/posts/10100341028448093', 'hi')
         mockRequests()
         return validateProofs(profile, undefined, username).then((proofs) => {
           t.ok(proofs, 'Proofs must have been created')
           t.equal(proofs instanceof Array, true, 'Proofs should be an Array')
           t.equal(proofs.length, totalProofs,
                   `Should have a proof for each of the ${totalProofs} claimed accounts`)
           t.equal(proofs.filter(x => x.valid).length, totalProofs, 'Should all be valid claims')
           FetchMock.restore()
         })
       })
}

function brokenProofs() {
  const naval = sampleVerifications.naval
  // adding a 'b' to the url, so they don't overlap with other mocked fetches.
  const navalAccounts = [{
    '@type': 'Account',
    service: 'facebook',
    identifier: 'navalr',
    proofType: 'http',
    proofUrl: 'https://facebook.com/navalr/posts/10152190734077261b'
  },
                         {
                           '@type': 'Account',
                           service: 'twitter',
                           identifier: 'naval',
                           proofType: 'http',
                           proofUrl: 'https://twitter.com/naval/status/486609266212499456b'
                         },
                         {
                           '@type': 'Account',
                           service: 'github',
                           identifier: 'navalr',
                           proofType: 'http',
                           proofUrl: 'https://gist.github.com/navalr/f31a74054f859ec0ac6ab'
                         }]

  test('brokenProofs', (t) => {
    FetchMock.get(`${naval.facebook.url}b`, naval.facebook.body)
    FetchMock.get(`${naval.github.url}b/raw`, naval.github.body)
    FetchMock.get(`${naval.twitter.url}b`, { body: '', status: 400 })
    t.plan(2)
    validateProofs({ account: navalAccounts }, undefined, 'naval.id')
      .then((proofs) => {
        t.equal(proofs.length, 3)
        t.equal(proofs.filter(x => x.valid).length, 2)
        FetchMock.restore()
      })
  })
}

export function runProofStatementUnitTests() {
  test('getProofStatement', (t) => {
    t.plan(6)

    const larry = sampleVerifications.larry
    const naval = sampleVerifications.naval
    const ken = sampleAddressBasedVerifications.ken
    const oscar = sampleAddressBasedVerifications.oscar

    t.equal(profileServices.facebook.getProofStatement(larry.facebook.body),
            'Verifying that "larry.id" is my Blockstack ID.',
            'Should extract proof statement from Facebook page meta tags')

    t.equal(profileServices.twitter.getProofStatement(naval.twitter.body),
            'Verifying myself: My Bitcoin username is +naval. https://t.co/DdpZv8tMAH #bitcoin',
            'Should extract proof statement from Twitter page meta tags')

    t.equal(profileServices.twitter.getProofStatement(ken.twitter.body),
            'Verifying my Blockstack ID is secured with the address 1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5',
            'Should extract address-based proof statement from Twitter page meta tags')

    t.equal(profileServices.instagram.getProofStatement(ken.instagram.body),
            'Verifying my Blockstack ID is secured with the address 1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5',
            'Should extract address-based proof statement from Instagram meta tags')

    t.equal(profileServices.hackerNews.getProofStatement(ken.hackerNews.body),
            'Verifying my Blockstack ID is secured with the address 1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5',
            'Should extract address-based proof statement from Hacker News profile')

    t.equal(profileServices.linkedIn.getProofStatement(oscar.linkedIn.body),
            'Oscar Lafarga on LinkedIn: "Verifying my Blockstack ID is secured with the address 1JbfoCkyyg2yn98jZ9A2HzGPzhHoc34WB7 https://lnkd.in/gM-KvXa"',
            'Should extract address-based proof statement from LinkedIn meta tags')
  })
}

export function runOwnerAddressBasedProofsUnitTests() {
  test('containsValidAddressProofStatement', (t) => {
    t.plan(12)

    const larry = sampleAddressBasedVerifications.larry
    const ken = sampleAddressBasedVerifications.ken
    const oscar = sampleAddressBasedVerifications.oscar

    const facebookProofStatement = profileServices.facebook.getProofStatement(larry.facebook.body)
    const twitterProofStatement = profileServices.twitter.getProofStatement(ken.twitter.body)
    const githubProofStatement = profileServices.github.getProofStatement(ken.github.body)
    const instagramProofStatement = profileServices.instagram.getProofStatement(ken.instagram.body)
    const hackerNewsProofStatement = profileServices.hackerNews
      .getProofStatement(ken.hackerNews.body)
    const linkedInProofStatement = profileServices.linkedIn.getProofStatement(oscar.linkedIn.body)


    t.equals(containsValidAddressProofStatement(facebookProofStatement,
                                                '1EyuZ8qxdhHjcnTChwQLyQaN3cmdK55DkH'),
             true, 'Facebook post meta tags should contain valid bitcoin address proof statement')

    t.equals(containsValidAddressProofStatement(facebookProofStatement,
                                                'differentBitcoinAddress'),
             false, 'Facebook post meta tags should not contain valid bitcoin address proof statement')

    t.equals(containsValidAddressProofStatement(twitterProofStatement,
                                                '1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5'),
             true, 'Twitter status meta tags should contain valid bitcoin address proof statement')

    t.equals(containsValidAddressProofStatement(twitterProofStatement,
                                                'differentBitcoinAddress'),
             false, 'Twitter status meta tags should not contain valid bitcoin address proof statement')

    t.equals(containsValidAddressProofStatement(githubProofStatement,
                                                '1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5'),
             true, 'Github gist body should contain valid bitcoin address proof statement')

    t.equals(containsValidAddressProofStatement(githubProofStatement,
                                                'differentBitcoinAddress'),
             false, 'Github gist body should not contain valid bitcoin address proof statement')

    t.equals(containsValidAddressProofStatement(instagramProofStatement,
                                                '1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5'),
             true, 'Instagram body should contain valid bitcoin address proof statement')

    t.equals(containsValidAddressProofStatement(instagramProofStatement,
                                                'differentBitcoinAddress'),
             false, 'Instagram body should not contain valid bitcoin address proof statement')

    t.equals(containsValidAddressProofStatement(hackerNewsProofStatement,
                                                '1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5'),
             true, 'Hacker News body should contain valid bitcoin address proof statement')

    t.equals(containsValidAddressProofStatement(hackerNewsProofStatement,
                                                'differentBitcoinAddress'),
             false, 'Hacker News body should not contain valid bitcoin address proof statement')

    t.equals(containsValidAddressProofStatement(linkedInProofStatement,
                                                '1JbfoCkyyg2yn98jZ9A2HzGPzhHoc34WB7'),
             true, 'LinkedIn body should contain valid bitcoin address proof statement')

    t.equals(containsValidAddressProofStatement(linkedInProofStatement,
                                                'differentBitcoinAddress'),
             false, 'LinkedIn body should not contain valid bitcoin address proof statement')
  })
}

export function runInBodyIdentityVerificationTests() {
  test('getProofIdentity', (t) => {
    t.plan(3)
    const ken = sampleAddressBasedVerifications.ken
    const oscar = sampleAddressBasedVerifications.oscar

    t.equal(profileServices.instagram.getProofIdentity(ken.instagram.body),
            'blckstcktest',
            'Should extract social proof identity from Instagram proof page body')

    t.equal(profileServices.instagram.getProofIdentity(ken.instagramRegression.body),
            'blckstcktest',
            'Should extract social proof identity from Instagram proof page body')

    t.equal(profileServices.linkedIn.getProofIdentity(oscar.linkedIn.body),
            'oscarlafarga',
            'Should extract social proof identity from LinkedIn proof page body')
  })
}

export function runProofUtilsUnitTests() {
  test('containsValidProofStatement', (t) => {
    t.plan(9)

    const naval = sampleVerifications.naval

    t.equal(containsValidProofStatement(naval.facebook.body, 'naval.id'),
            true, 'Facebook post body should contain valid proof statement for naval.id')
    t.equal(containsValidProofStatement(naval.github.body, 'naval.id'),
            true, 'Github gist post body should contain valid proof statement for naval.id')
    t.equal(containsValidProofStatement(naval.twitter.body, 'naval.id'),
            true, 'Twitter post body should contain valid proof statement for naval.id')

    const larry = sampleVerifications.larry

    t.equal(containsValidProofStatement(naval.facebook.body, 'larry.id'),
            false, 'Github gist post body should not contain valid proof statement for larry.id')
    t.equal(containsValidProofStatement(naval.github.body, 'larry.id'),
            false, 'Github gist post body should not contain valid proof statement for larry.id')
    t.equal(containsValidProofStatement(naval.twitter.body, 'larry.id'),
            false, 'Github gist post body should not contain valid proof statement for larry.id')
    t.equal(containsValidProofStatement(larry.facebook.body, 'larry.id'),
            true, 'Facebook post body should contain valid proof statement for larry.id')

    const subdomainId = 'subdomainiac.id.blockstack'
    t.equal(containsValidProofStatement(
      `verifying that ${subdomainId} is my blockstack id`,
      subdomainId
    ), true, 'Subdomain IDs work as proofs')

    t.throws(() => {
      containsValidProofStatement(larry.facebook.body, 'larry')
    }, /Error/, 'Using non-fully qualified blockstack name should throw exception')
  })
}

export function runProofServicesUnitTests() {
  test('normalize Facebook URLs', (t) => {
    t.plan(6)
    t.equal(profileServices.facebook.normalizeUrl(
      {
        service: 'facebook',
        proof_url: 'https://www.facebook.com/navalr/posts/10152190734077261',
        identifier: 'navalr'
      }
    ),
            'https://www.facebook.com/navalr/posts/10152190734077261',
            'Facebook URL should be normalized')
    t.equal(profileServices.facebook.normalizeUrl(
      {
        service: 'facebook',
        proof_url: 'https://facebook.com/navalr/posts/10152190734077261',
        identifier: 'navalr'
      }
    ),
            'https://www.facebook.com/navalr/posts/10152190734077261',
            'Facebook URL should be normalized')
    t.equal(profileServices.facebook.normalizeUrl(
      {
        service: 'facebook',
        proof_url: 'https://www.facebook.com/larrysalibra/posts/10100341028448093',
        identifier: 'larrysalibra'
      }
    ),
            'https://www.facebook.com/larrysalibra/posts/10100341028448093',
            'Facebook URL should be normalized')
    t.notEqual(profileServices.facebook.normalizeUrl(
      {
        service: 'facebook',
        proof_url: 'https://www.facebook.com/larry.salibra/posts/10100341028448093',
        identifier: 'larry.salibra'
      }
    ),
               'https://www.facebook.com/larrysalibra/posts/10100341028448093',
               'Facebook URL should be normalized')
    t.notEqual(profileServices.facebook.normalizeUrl(
      {
        service: 'facebook',
        proof_url: 'https://facebook.com/larry.salibra/posts/10100341028448093',
        identifier: 'larry.salibra'
      }
    ),
               'https://www.facebook.com/larrysalibra/posts/10100341028448093',
               'Facebook URL should be normalized')
    t.equal(profileServices.facebook.normalizeUrl(
      {
        service: 'facebook',
        proof_url: 'https://facebook.com/larrysalibra/posts/10100341028448093',
        identifier: 'larrysalibra'
      }
    ),
            'https://www.facebook.com/larrysalibra/posts/10100341028448093',
            'Facebook URL should be normalized')
  })

  test('normalize Instagarm URLs', (t) => {
    t.plan(4)
    t.equal(profileServices.instagram.normalizeUrl(
      {
        service: 'instagram',
        proof_url: 'https://www.instagram.com/p/BZ7KMM0A-Qc/',
        identifier: 'blckstcktest'
      }
    ),
            'https://www.instagram.com/p/BZ7KMM0A-Qc/',
            'Instagram URL should be normalized')
    t.equal(profileServices.instagram.normalizeUrl(
      {
        service: 'instagram',
        proof_url: 'https://instagram.com/p/BZ7KMM0A-Qc/',
        identifier: 'blckstcktest'
      }
    ),
            'https://www.instagram.com/p/BZ7KMM0A-Qc/',
            'Instagram URL should be normalized')
    t.equal(profileServices.instagram.normalizeUrl(
      {
        service: 'instagram',
        proof_url: 'http://www.instagram.com/p/BZ7KMM0A-Qc/',
        identifier: 'blckstcktest'
      }
    ),
            'https://www.instagram.com/p/BZ7KMM0A-Qc/',
            'Instagram URL should be normalized')
    t.equal(profileServices.instagram.normalizeUrl(
      {
        service: 'instagram',
        proof_url: 'http://instagram.com/p/BZ7KMM0A-Qc/',
        identifier: 'blckstcktest'
      }
    ),
            'https://www.instagram.com/p/BZ7KMM0A-Qc/',
            'Instagram URL should be normalized')
  })

  test('get proof url', (t) => {
    t.plan(11)
    t.equal(profileServices.facebook.getProofUrl(sampleProofs.naval[1]),
            'https://www.facebook.com/navalr/posts/10152190734077261',
            'Facebook proof URL should match reference')
    t.equal(profileServices.github.getProofUrl(sampleProofs.naval[2]),
            'https://gist.github.com/navalr/f31a74054f859ec0ac6a/raw',
            'Github proof URL should match reference')
    t.equal(profileServices.twitter.getProofUrl(sampleProofs.naval[0]),
            'https://twitter.com/naval/status/486609266212499456',
            'Twitter proof URL should match reference')
    t.equal(profileServices.facebook.getProofUrl(sampleProofs.larry[0]),
            'https://www.facebook.com/larry.salibra/posts/10100341028448093',
            'Facebook proof URL should match reference')
    t.equal(profileServices.instagram.getProofUrl(sampleProofs.ken[0]),
            'https://www.instagram.com/p/BYj6UDwgaX7/',
            'Instagram proof URL should match reference')
    t.equal(profileServices.hackerNews.getProofUrl(sampleProofs.ken[1]),
            'https://news.ycombinator.com/user?id=yukanl',
            'Hacker News proof URL should match reference')
    t.equal(profileServices.linkedIn.getProofUrl(sampleProofs.ken[2]),
            'https://www.linkedin.com/feed/update/urn:li:activity:6311587377647222784/',
            'LinkedIn proof URL should match reference')
    t.equal(profileServices.hackerNews.getProofUrl(sampleProofs.bruno[0]),
            'https://news.ycombinator.com/user?id=BrunoBernardino',
            'Hacker News proof URL should match reference')

    t.throws(() => {
      const notNavalTwitter = Object.assign({},
                                            sampleProofs.naval[0], {
                                              proof_url: 'https://twitter.com/not_naval/status/486609266212499456'
                                            })
      profileServices.twitter.getProofUrl(notNavalTwitter)
    }, /Error/, 'Not having claimed account identifier in Twitter proof URL should throw exception')

    t.throws(() => {
      const notNavalGithub = Object.assign({},
                                           sampleProofs.naval[2], {
                                             proof_url: 'https://gist.github.com/not_naval/f31a74054f859ec0ac6a'
                                           })
      profileServices.github.getProofUrl(notNavalGithub)
    }, /Error/, 'Not having claimed account identifier in Github proof URL should throw exception')

    t.throws(() => {
      const notKenHackerNews = Object.assign({},
                                             sampleProofs.ken[0], {
                                               proof_url: 'https://news.ycombinator.com/user?id=notken'
                                             })
      profileServices.github.getProofUrl(notKenHackerNews)
    }, /Error/,
             'Not having claimed account identifier in Hacker News proof URL should throw exception')
  })
}

export function runProofsUnitTests() {
  // Proof utils
  runProofUtilsUnitTests()
  // Proof statements
  runProofStatementUnitTests()
  // Proof address based
  runOwnerAddressBasedProofsUnitTests()
  // Proof identity extract from response body
  runInBodyIdentityVerificationTests()
  // Proof services
  runProofServicesUnitTests()
  // Proof HTML
  // testProofs(sampleProfiles.naval, 'naval.id', 3)
  testProofs(sampleProfiles.larry, 'larry.id', 1)
  // Broken proofs
  brokenProofs()
}
