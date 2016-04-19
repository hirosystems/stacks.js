'use strict'

export function getName(profile) {
  let name = ''
  if (profile.givenName || profile.familyName) {
    if (profile.givenName) {
      name = profile.givenName
    }
    if (profile.familyName) {
      name += ' ' + profile.familyName
    }
  } else if (profile.name) {
    name = profile.name
  }
  return name
}

export function getNameParts(profile) {
  let givenName = '',
      familyName = ''
  if (profile.givenName || profile.familyName) {
    if (profile.givenName) {
      givenName = profile.givenName
    }
    if (profile.familyName) {
      familyName = profile.familyName
    }
  } else if (profile.name) {
    let nameParts = profile.name.split(' ')
    givenName = nameParts[0]
    if (nameParts.length > 1) {
      familyName = nameParts[1]
    }
  }
  return givenName, familyName
}

export function getVerifiedAccounts(profile, verifications) {
  let filteredAccounts = []
  if (profile.hasOwnProperty('account') && verifications) {
    profile.account.map(function(account) {
      let proofUrl = ''
      verifications.map(function(verification) {
        if (verification.hasOwnProperty('proof_url')) {
          verification.proofUrl = verification.proof_url
        }
        if (verification.valid
            && verification.service === account.service
            && verification.identifier === account.identifier
            && verification.proofUrl) {
          proofUrl = verification.proofUrl
        }
      })
      account.proofUrl = proofUrl
      if (account.identifier && account.service) {
        filteredAccounts.push(account)
      }
    })
  }
  return filteredAccounts
}

export function getAvatarUrl(profile) {
  let avatarContentUrl = null
  if (profile.image) {
    profile.image.map(function(image) {
      if (image.name === 'avatar') {
        avatarContentUrl = image.contentUrl
        return
      }
    })
  }
  return avatarContentUrl
}