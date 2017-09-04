'use strict'

import blueTest from 'blue-tape'
import test from 'tape'
import fs from 'fs'
import FetchMock from 'fetch-mock'

import {
  validateProofs, containsValidProofStatement, containsValidBitcoinProofStatement, profileServices
} from '../../../lib'

import { sampleProfiles, sampleProofs, sampleVerifications, sampleAddressBasedVerifications } from './sampleData'

function mockRequests() {
  const naval = sampleVerifications.naval
  const larry = sampleVerifications.larry

  const addressBasedLarry = sampleAddressBasedVerifications.larry

  FetchMock.get(naval.facebook.url, naval.facebook.body)
  FetchMock.get(naval.github.url, naval.github.body)
  FetchMock.get(naval.twitter.url, naval.twitter.body)
  FetchMock.get(larry.facebook.url, larry.facebook.body)
}

function testProofs(profile, username, totalProofs) {
  mockRequests()

  blueTest('Profiles', (t) => {
    return validateProofs(profile, username).then((proofs) => {
      t.ok(proofs, 'Proofs must have been created')
      t.equal(proofs instanceof Array, true, "Proofs should be an Array")
      t.equal(proofs.length, totalProofs, "Should have a proof for each of the 3 claimed accounts")
      FetchMock.restore()
    })
  })
}

export function runProofStatementUnitTests() {
  test('getProofStatement', (t) => {
    t.plan(7)

    const larry = sampleVerifications.larry
    const naval = sampleVerifications.naval
    const ken = sampleAddressBasedVerifications.ken

    t.equal(profileServices.facebook.getProofStatement(larry.facebook.body), 
      'Verifying that "larry.id" is my Blockstack ID.', 
      'Should extract proof statement from Facebook page meta tags')

    t.equal(profileServices.twitter.getProofStatement(naval.twitter.body), 
      'Verifying myself: My Bitcoin username is +naval. https://t.co/DdpZv8tMAH #bitcoin', 
      'Should extract proof statement from Twitter page meta tags')

    t.equal(profileServices.github.getProofStatement(naval.github.body), 
      'Verifying that +naval is my Bitcoin username. You can send me #bitcoin here: https://onename.io/naval', 
      'Should extract proof statement from Github page body')

    t.equal(profileServices.twitter.getProofStatement(ken.twitter.body), 
      'Verifying my avatar on Blockstack is owned by the address 1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5', 
      'Should extract address-based proof statement from Twitter page meta tags')

    t.equal(profileServices.github.getProofStatement(ken.github.body), 
      'Verifying my avatar on Blockstack is owned by the address 1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5', 
      'Should extract address-based proof statement from Github page body')

    t.equal(profileServices.instagram.getProofStatement(ken.instagram.body), 
      'Verifying my avatar on Blockstack is owned by the address 1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5', 
      'Should extract address-based proof statement from Instagram meta tags')

    t.equal(profileServices.hackerNews.getProofStatement(ken.hackerNews.body), 
      'Verifying my avatar on Blockstack is owned by the address 1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5', 
      'Should extract address-based proof statement from Hacker News profile')
  })
}

export function runBitcoinAddressBasedProofsUnitTests() {
  test('containsValidBitcoinProofStatement', (t) => {
    t.plan(10)

    const larry = sampleAddressBasedVerifications.larry
    const ken = sampleAddressBasedVerifications.ken

    const facebookProofStatement = profileServices.facebook.getProofStatement(larry.facebook.body)
    const twitterProofStatement = profileServices.twitter.getProofStatement(ken.twitter.body)
    const githubProofStatement = profileServices.github.getProofStatement(ken.github.body)
    const instagramProofStatement = profileServices.instagram.getProofStatement(ken.instagram.body)
    const hackerNewsProofStatement = profileServices.hackerNews.getProofStatement(ken.hackerNews.body)

    t.equals(containsValidBitcoinProofStatement(facebookProofStatement, '1EyuZ8qxdhHjcnTChwQLyQaN3cmdK55DkH', true),
      true, "Facebook post meta tags should contain valid bitcoin address proof statement")

    t.equals(containsValidBitcoinProofStatement(facebookProofStatement, 'differentBitcoinAddress', true),
      false, "Facebook post meta tags should not contain valid bitcoin address proof statement")

    t.equals(containsValidBitcoinProofStatement(twitterProofStatement, '1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5', true),
      true, "Twitter status meta tags should contain valid bitcoin address proof statement")

    t.equals(containsValidBitcoinProofStatement(twitterProofStatement, 'differentBitcoinAddress', true),
      false, "Twitter status meta tags should not contain valid bitcoin address proof statement")

    t.equals(containsValidBitcoinProofStatement(githubProofStatement, '1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5', true),
      true, "Github gist body should contain valid bitcoin address proof statement")

    t.equals(containsValidBitcoinProofStatement(githubProofStatement, 'differentBitcoinAddress', true),
      false, "Github gist body should not contain valid bitcoin address proof statement")

    t.equals(containsValidBitcoinProofStatement(instagramProofStatement, '1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5', true),
      true, "Instagram body should contain valid bitcoin address proof statement")

    t.equals(containsValidBitcoinProofStatement(instagramProofStatement, 'differentBitcoinAddress', true),
      false, "Instagram body should not contain valid bitcoin address proof statement")

    t.equals(containsValidBitcoinProofStatement(hackerNewsProofStatement, '1AtFqXxcckuoEN4iMNNe7n83c5nugxpzb5', true),
      true, "Hacker News body should contain valid bitcoin address proof statement")

    t.equals(containsValidBitcoinProofStatement(hackerNewsProofStatement, 'differentBitcoinAddress', true),
      false, "Hacker News body should not contain valid bitcoin address proof statement")
  })
}

export function runProofUtilsUnitTests() {
  test('containsValidProofStatement', (t) => {
    t.plan(8)

    const naval = sampleVerifications.naval

    t.equal(containsValidProofStatement(naval.facebook.body, 'naval.id'),
      true, "Facebook post body should contain valid proof statement for naval.id")
    t.equal(containsValidProofStatement(naval.github.body, 'naval.id'),
      true, "Github gist post body should contain valid proof statement for naval.id")
    t.equal(containsValidProofStatement(naval.twitter.body, 'naval.id'),
      true, "Twitter post body should contain valid proof statement for naval.id")

    const larry = sampleVerifications.larry

    t.equal(containsValidProofStatement(naval.facebook.body, 'larry.id'),
      false, "Github gist post body should not contain valid proof statement for larry.id")
    t.equal(containsValidProofStatement(naval.github.body, 'larry.id'),
      false, "Github gist post body should not contain valid proof statement for larry.id")
    t.equal(containsValidProofStatement(naval.twitter.body, 'larry.id'),
      false, "Github gist post body should not contain valid proof statement for larry.id")
    t.equal(containsValidProofStatement(larry.facebook.body, 'larry.id'),
      true, "Facebook post body should contain valid proof statement for larry.id")

    t.throws(() => {
      containsValidProofStatement(larry.facebook.body, 'larry')
    }, /Error/, "Using non-fully qualified blockstack name should throw exception")
  })
}

export function runProofServicesUnitTests() {
  test('normalize Facebook URLs', (t) => {
    t.plan(6)
    t.equal(profileServices.facebook.normalizeFacebookUrl(
      {
        service: 'facebook',
        proof_url: "https://www.facebook.com/navalr/posts/10152190734077261",
        identifier: "navalr"
      }),
      "https://www.facebook.com/navalr/posts/10152190734077261",
      "Facebook URL should be normalized")
    t.equal(profileServices.facebook.normalizeFacebookUrl(
      {
        service: 'facebook',
        proof_url: "https://facebook.com/navalr/posts/10152190734077261",
        identifier: "navalr"
      }),
      "https://www.facebook.com/navalr/posts/10152190734077261",
      "Facebook URL should be normalized")
    t.equal(profileServices.facebook.normalizeFacebookUrl(
      {
        service: 'facebook',
        proof_url: "https://www.facebook.com/larrysalibra/posts/10100341028448093",
        identifier: "larrysalibra"
      }),
      "https://www.facebook.com/larrysalibra/posts/10100341028448093",
      "Facebook URL should be normalized")
    t.notEqual(profileServices.facebook.normalizeFacebookUrl(
      {
        service: 'facebook',
        proof_url: "https://www.facebook.com/larry.salibra/posts/10100341028448093",
        identifier: "larry.salibra"
      }),
      "https://www.facebook.com/larrysalibra/posts/10100341028448093",
      "Facebook URL should be normalized")
    t.notEqual(profileServices.facebook.normalizeFacebookUrl(
      {
        service: 'facebook',
        proof_url: "https://facebook.com/larry.salibra/posts/10100341028448093",
        identifier: "larry.salibra"
      }),
      "https://www.facebook.com/larrysalibra/posts/10100341028448093",
      "Facebook URL should be normalized")
    t.equal(profileServices.facebook.normalizeFacebookUrl(
      {
        service: 'facebook',
        proof_url: "https://facebook.com/larrysalibra/posts/10100341028448093",
        identifier: "larrysalibra"
      }),
      "https://www.facebook.com/larrysalibra/posts/10100341028448093",
      "Facebook URL should be normalized")
  })

  test('get proof url', (t) => {
    t.plan(9)
    t.equal(profileServices.facebook.getProofUrl(sampleProofs.naval[1]),
      "https://www.facebook.com/navalr/posts/10152190734077261",
      "Facebook proof URL should match reference")
    t.equal(profileServices.github.getProofUrl(sampleProofs.naval[2]),
      "https://gist.github.com/navalr/f31a74054f859ec0ac6a",
      "Github proof URL should match reference")
    t.equal(profileServices.twitter.getProofUrl(sampleProofs.naval[0]),
      "https://twitter.com/naval/status/486609266212499456",
      "Twitter proof URL should match reference")
    t.equal(profileServices.facebook.getProofUrl(sampleProofs.larry[0]),
      "https://www.facebook.com/larry.salibra/posts/10100341028448093",
      "Facebook proof URL should match reference")
    t.equal(profileServices.hackerNews.getProofUrl(sampleProofs.ken[0]),
      "https://news.ycombinator.com/user?id=yukanl",
      "Hacker News proof URL should match reference")

    t.throws(() => {
      const notLarry = Object.assign({},
        sampleProofs.larry[0], {
          proof_url: 'https://www.facebook.com/not.larry/posts/10100341028448093'
        })
      profileServices.facebook.getProofUrl(notLarry)
    }, /Error/, 'Not having claimed account identifier in Facebook proof URL should throw exception')

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
    }, /Error/, 'Not having claimed account identifier in Hacker News proof URL should throw exception')
  })
}

export function runProofsUnitTests() {
  // Proof utils
  runProofUtilsUnitTests()
  // Proof statements
  runProofStatementUnitTests()
  // Proof address based
  runBitcoinAddressBasedProofsUnitTests()
  // Proof services
  runProofServicesUnitTests()
  // Proof HTML
  testProofs(sampleProfiles.naval, "naval.id", 3)
  testProofs(sampleProfiles.larry, "larry.id", 1)
}
