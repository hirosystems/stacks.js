'use strict'

import { hasprop } from '../../index'

function formatAccount(serviceName, data) {
    let proofUrl
    if (hasprop(data, 'proof.url')) {
        proofUrl = data.proof.url
    }
    return {
        "@type": "Account",
        "service": serviceName,
        "identifier": data.username,
        "proofType": "http",
        "proofUrl": proofUrl
    }
}

export function getPersonFromLegacyFormat(profile) {
    let profileData = {
        "@type": "Person"
    }

    if (hasprop(profile, 'name.formatted')) {
        profileData.name = profile.name.formatted
    }

    if (hasprop(profile, 'bio')) {
        profileData.description = profile.bio
    }

    if (hasprop(profile, 'location.formatted')) {
        profileData.address = {
            "@type": "PostalAddress",
            "addressLocality": profile.location.formatted
        }
    }

    let images = []
    if (hasprop(profile, 'avatar.url')) {
        images.push({
            "@type": "ImageObject",
            "name": "avatar",
            "contentUrl": profile.avatar.url
        })
    }
    if (hasprop(profile, 'cover.url')) {
        images.push({
            "@type": "ImageObject",
            "name": "cover",
            "contentUrl": profile.cover.url
        })
    }
    if (images.length) {
        profileData.image = images
    }

    if (hasprop(profile, 'website')) {
        profileData.website = [{
            "@type": "WebSite",
            "url": profile.website
        }]
    }

    let accounts = []
    if (hasprop(profile, 'bitcoin.address')) {
        accounts.push({
            "@type": "Account",
            "role": "payment",
            "service": "bitcoin",
            "identifier": profile.bitcoin.address
        })
    }
    if (hasprop(profile, 'twitter.username')) {
        accounts.push(formatAccount('twitter', profile.twitter))
    }
    if (hasprop(profile, 'facebook.username')) {
        accounts.push(formatAccount('facebook', profile.facebook))
    }
    if (hasprop(profile, 'github.username')) {
        accounts.push(formatAccount('github', profile.github))
    }

    if (hasprop(profile, 'auth')) {
        if (profile.auth.length > 0) {
            if (hasprop(profile.auth[0], 'publicKeychain')) {
                accounts.push({
                    "@type": "Account",
                    "role": "key",
                    "service": "bip32",
                    "identifier": profile.auth[0].publicKeychain
                })
            }
        }
    }
    if (hasprop(profile, 'pgp.url')) {
        accounts.push({
            "@type": "Account",
            "role": "key",
            "service": "pgp",
            "identifier": profile.pgp.fingerprint,
            "contentUrl": profile.pgp.url
        })
    }
    
    profileData.account = accounts

    return profileData
}