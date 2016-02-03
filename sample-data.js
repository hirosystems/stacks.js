var profileDirectory = {
    navalChecksums: [{
        field: 'pgp[0].publicKey',
        hash: 'e508f0c2c455ab79a4fabc4b51aa537e123c08abee40a87c47e6705a2bbae4ae',
        algorithm: 'SHA256'
    }],
    balloondog_art: {
      "@context": "http://schema.org/",
      "@type": "CreativeWork",
      "name": "Balloon Dog",
      "creator": [
        {
          "@type": "Person",
          "name": "Jeff Koons",
          "id": "therealjeffkoons.id"
        }
      ],
      "dateCreated": "1994-05-09T00:00:00-0400",
      "datePublished": "2015-12-10T14:44:26-0500"
    },
    google_id: {
      "@context": "http://schema.org/",
      "@type": "Organization",
      "name": "Google",
      "legalName": "Google Inc.",
      "email": "hello@google.org",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Mountain View, CA",
        "postalCode": "94043",
        "streetAddress": "1600 Amphitheatre Parkway"
      },
      "employee": [
        {
          "@type": "Person",
          "name": "Larry Page",
          "id": "larrypage.id"
        },
        {
          "@type": "Person",
          "name": "Sergey Brin",
          "id": "sergeybrin.id"
        }
      ],
      "image": [
        {
          "@type": "ImageObject",
          "name": "logo",
          "contentUrl": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
        }
      ],
      "parentOrganization": {
        "@type": "Organization",
        "name": "Alphabet Inc.",
        "id": "alphabet.id"
      }
    },
    naval_profile: {
        "@context": "http://schema.org/",
        "@type": "Person",
        "name": "Naval Ravikant",
        "givenName": "Naval",
        "familyName": "Ravikant",
        "description": "Co-founder of AngelList",
        "image": [
            {
                "@type": "ImageObject",
                "name": "avatar",
                "contentUrl": "https://pbs.twimg.com/profile_images/3696617328/667874c5936764d93d56ccc76a2bcc13.jpeg"
            },
            {
                "@type": "ImageObject",
                "name": "background",
                "contentUrl": "https://pbs.twimg.com/profile_banners/745273/1355705777/web_retina"
            }
        ],
        "website": [
            {
                "@type": "WebSite",
                "url": "angel.co"
            }
        ],
        "account": [
            {
                "@type": "Account",
                "service": "facebook",
                "identifier": "navalr",
                "proofType": "http",
                "proofUrl": "https://facebook.com/navalr/posts/10152190734077261"
            },
            {
                "@type": "Account",
                "service": "twitter",
                "identifier": "naval",
                "proofType": "http",
                "proofUrl": "https://twitter.com/naval/status/486609266212499456"
            },
            {
                "@type": "Account",
                "service": "github",
                "identifier": "navalr",
                "proofType": "http",
                "proofUrl": "https://gist.github.com/navalr/f31a74054f859ec0ac6a"
            },
            {
                "@type": "Account",
                "service": "bitcoin",
                "role": "payment",
                "identifier": "1919UrhYyhs471ps8CFcJ3DRpWSda8qtSk",
                "proofType": "signature",
                "proofMessage": "Verifying that +naval is my blockchain ID.",
                "proofSignature": "ICuRA+Dq5Dn8AiY9P+mcLzGyibPgG0ec9CphtMk512uPdB5eAncDSHhQZY/7kycvl6PLFEuR+j3OM/K2Vey1+EU="
            },
            {
                "@type": "Account",
                "service": "openbazaar",
                "role": "storage",
                "data": {
                    "guid": "34e57db64ce7435ab0f759oca31386527c670bd1"
                }
            }
        ],
        "worksFor": [
            {
                "@type": "Organization",
                "id": "angellist.id"
            }
        ],
        "knows": [
            {
                "@type": "Person",
                "id": "muneeb.id"
            },
            {
                "@type": "Person",
                "id": "ryan.id"
            }
        ],
        "birthDate": "1973-01-01",
        "taxID": "000-00-0000",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "16 Maiden Ln",
            "addressLocality": "San Francisco, CA",
            "postalCode": "94108",
            "addressCountry": "United States"
        }
    },
    naval_id: {
      name: "Naval Ravikant",
      givenName: "Naval",
      familyName: "Ravikant",
      description: "Co-founder of AngelList",
      avatarImageUrl: "https://pbs.twimg.com/profile_images/3696617328/667874c5936764d93d56ccc76a2bcc13.jpeg",
      backgroundImageUrl: "https://pbs.twimg.com/profile_banners/745273/1355705777/web_retina",
      website: "angel.co",
      facebookUsername: "navalr",
      facebookProofUrl: "https://facebook.com/navalr/posts/10152190734077261",
      twitterUsername: "naval",
      twitterProofUrl: "https://twitter.com/naval/status/486609266212499456",
      githubUsername: "navalr",
      githubProofUrl: "https://gist.github.com/navalr/f31a74054f859ec0ac6a",
      bitcoinAddress: "1919UrhYyhs471ps8CFcJ3DRpWSda8qtSk",
      bitcoinProofMessage: "Verifying that +naval is my blockchain ID.",
      bitcoinProofSignature: "ICuRA+Dq5Dn8AiY9P+mcLzGyibPgG0ec9CphtMk512uPdB5eAncDSHhQZY/7kycvl6PLFEuR+j3OM/K2Vey1+EU=",
      appData: "openbazaar={\"guid\":\"34e57db64ce7435ab0f759oca31386527c670bd1\"}",
      worksFor: "angellist.id",
      knows: "muneeb.id, ryan.id",
      streetAddress: "16 Maiden Ln",
      addressLocality: "San Francisco, CA",
      postalCode: "94108",
      addressCountry: "United States",
      birthDate: "1973-01-01",
      taxID: "000-00-0000"
    },
    naval_v2: {
      "twitter": {
        "username": "naval", 
        "proof": {
          "url": "https://twitter.com/naval/status/486609266212499456"
        }
      }, 
      "angellist": {
        "username": "naval"
      }, 
      "bitcoin": {
        "address": "1919UrhYyhs471ps8CFcJ3DRpWSda8qtSk"
      }, 
      "github": {
        "username": "navalr", 
        "proof": {
          "url": "https://gist.github.com/navalr/f31a74054f859ec0ac6a"
        }
      }, 
      "website": "https://angel.co/naval", 
      "pgp": {
        "url": "https://s3.amazonaws.com/pk9/naval", 
        "fingerprint": "07354EDF5C6CF2572847840D8FA3F960B62B7C41"
      }, 
      "v": "0.2", 
      "name": {
        "formatted": "Naval Ravikant"
      }, 
      "twitterUsername": "naval", 
      "graph": {
        "url": "https://s3.amazonaws.com/grph/naval"
      }, 
      "cover": {
        "url": "https://pbs.twimg.com/profile_banners/745273/1355705777/web_retina"
      }, 
      "avatar": {
        "url": "https://pbs.twimg.com/profile_images/3696617328/667874c5936764d93d56ccc76a2bcc13.jpeg"
      }, 
      "bio": "Co-founder AngelList \u2022 Founder Epinions, Vast \u2022 Author Startupboy, Venture Hacks \u2022 Investor Twitter, Uber, Yammer, Postmates", 
      "facebook": {
        "username": "navalr", 
        "proof": {
          "url": "https://facebook.com/navalr/posts/10152190734077261"
        }
      }, 
      "location": {
        "formatted": "San Francisco, CA"
      }
    },
    ryan_id: {
        "name": "Ryan Shea",
        "givenName": "Ryan",
        "familyName": "Shea",
        "description": "Co-founder of Onename",
        "avatarImageUrl": "https://s3.amazonaws.com/kd4/ryan",
        "backgroundImageUrl": "https://s3.amazonaws.com/dx3/ryan",
        "website": "shea.io, onename.com",
        "facebookUsername": "ryaneshea",
        "facebookProofUrl": "https://facebook.com/ryaneshea/posts/10153086767027713",
        "twitterUsername": "ryaneshea",
        "twitterProofUrl": "https://twitter.com/ryaneshea/status/597815798850269184",
        "githubUsername": "shea256",
        "githubProofUrl": "https://gist.github.com/shea256/8920fd8c54674ef9d9af",
        "instagramUsername": "ryaneshea",
        "venmoUsername": "ryanshea",
        "bitcoinAddress": "14zHpYa8Y1JPVvw1hoC9SqpqHjwu8PC53P",
        "bitcoinProofMessage": "Verifying that +ryan is my blockchain ID.",
        "bitcoinProofSignature": "ICuRA+Dq5Dn8AiY9P+mcLzGyibPgG0ec9CphtMk512uPdB5eAncDSHhQZY/7kycvl6PLFEuR+j3OM/K2Vey1+EU=",
        "appData": 'openbazaar={"guid":"34e57db64ce7435ab0f759oca31386527c670bd1"}',
        "worksFor": "onename.id",
        "knows": "muneeb.id, glepage.id, brianhoffman.id, judecn.id",
        "authPublicKeychain": "xpub661MyMwAqRbcFQVrQr4Q4kPjaP4JjWaf39fBVKjPdK6oGBayE46GAmKzo5UDPQdLSM9DufZiP8eauy56XNuHicBySvZp7J5wsyQVpi2axzZ, xpub69W5QnTxuA3VPKvRA4TSSjvAD7CXDmBk9VHrsrEk3XcSCQUdqDAcPHj8UwQd8WagErMaXmkSnjiAMauivRruU66yVdCURwUAt7YBtqt8FEf",
        "pgpPublicKey": '-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: GnuPG v2\n\n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\nh+o=\n=PSWa\n-----END PGP PUBLIC KEY BLOCK-----',
        "pgpProofMessage": '-----BEGIN PGP SIGNED MESSAGE-----\nHash: SHA256\n\nVerifying that +ryan is my blockchain ID.\n-----BEGIN PGP SIGNATURE-----\nVersion: GnuPG v2\n\niQIcBAEBCAAGBQJWGA3wAAoJEITNNEV0mTvHunAP/Av60VTqPCm7ONgjTKk/ZLXa\nekU4MYzHpy1YrBhzZUK1uzXpguwn/e1ojcz56xcS39Ae9UbkkMqnOB6ONAG/Gt8K\n7/bMFrSbYnlle4Vzihz7I+NFDb+hZEjNsI6GlYuy1HUv0TbTvGJLsjc++WLne0lL\n7so39mZeEEcc/TY4dJMhd0yTnnwJ42stwnajjOwahMN07fK+RarjOkhDjcadJXww\nMP79f5QB67emqg8hpHK30uu/DsxwpwSHB54dyVV2Ebzl6F3BUzKTEOR/yy0FEzlm\nZFqVUxim/OBRQCrTYjG0dsALnjveHgNcnYBsR6jG+iIQXErH7vT69MFvbr5R0yLv\nFsP8SHMja2idHWpuK07P4XhSaauj1yPEcXIYapx69epNKHn/Nl3AO0OgmtE87oUI\nilHuez0IMvWpQgPrAcwR+nyEx/yyZuMyGM1jzjhr9ra3psBAssA8mepPLY7jIWko\n9fqh0XWK4NGcMwKtPBlv/lz/ifubFDM7/YjezmZeEsyPeuodx4CboXv7Gy+3ub2u\nTW2tvvE+8u8HgRaCoDFizO0/YTH7hWsMoMemmD2C2Lzg8N1naJ4uNmObiNzJSXA6\nkGUBbu8vTAo9IbzenokhTS7RIiRYyola99tzQNoatkvdkjGayFTUlg/0Xs9OFl8i\nk3vNjXaNc63eTqaeBZxX\n=Yqby\n-----END PGP SIGNATURE-----\n',
        "streetAddress": "154 Grand St",
        "addressLocality": "New York, NY",
        "postalCode": "10013",
        "addressCountry": "United States",
        "birthDate": "1990-01-01",
        "taxID": "000-00-0000"
    },
    ryan_flat: {
      "name": "Ryan Shea",
      "givenName": "Ryan",
      "familyName": "Shea",
      "description": "Co-founder of Onename",
      "image[0].@type": "ImageObject",
      "image[0].name": "avatar",
      "image[0].contentUrl": "https://pbs.twimg.com/profile_images/3696617328/667874c5936764d93d56ccc76a2bcc13.jpeg",
      "account[0].@type": "Account",
      "account[0].service": "facebook",
      "account[0].identifier": "navalr",
      "account[0].proofType": "http",
      "account[0].proofUrl": "https://facebook.com/navalr/posts/10152190734077261"
    },
    ryan_v2: {
      "github": {
        "username": "shea256", 
        "proof": {
          "url": "https://gist.github.com/shea256/8920fd8c54674ef9d9af"
        }
      }, 
      "auth": [
        {
          "publicKeychain": "xpub661MyMwAqRbcFQVrQr4Q4kPjaP4JjWaf39fBVKjPdK6oGBayE46GAmKzo5UDPQdLSM9DufZiP8eauy56XNuHicBySvZp7J5wsyQVpi2axzZ"
        }
      ], 
      "v": "0.2", 
      "facebook": {
        "username": "ryaneshea", 
        "proof": {
          "url": "https://facebook.com/ryaneshea/posts/10153086767027713"
        }
      }, 
      "bio": "Co-founder of Onename (YC S14, USV). Working on decentralized identity.", 
      "location": {
        "formatted": "New York"
      }, 
      "pgp": {
        "url": "https://s3.amazonaws.com/pk9/ryan", 
        "fingerprint": "1E4329E6634C75730D4D88C0638F2769D55B9837"
      }, 
      "bitcoin": {
        "address": "1LFS37yRSibwbf8CnXeCn5t1GKeTEZMmu9"
      }, 
      "cover": {
        "url": "https://s3.amazonaws.com/dx3/ryan"
      }, 
      "name": {
        "formatted": "Ryan Shea"
      }, 
      "website": "http://shea.io", 
      "avatar": {
        "url": "https://s3.amazonaws.com/kd4/ryan"
      }, 
      "twitter": {
        "username": "ryaneshea", 
        "proof": {
          "url": "https://twitter.com/ryaneshea/status/597815798850269184"
        }
      }
    }
}

module.exports = profileDirectory