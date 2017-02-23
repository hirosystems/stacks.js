import fs from 'fs'

const sampleProfiles = {
  balloonDog: JSON.parse(fs.readFileSync('./docs/profiles/balloonDog.json')),
  naval: JSON.parse(fs.readFileSync('./docs/profiles/naval.json')),
  larry: JSON.parse(fs.readFileSync('./docs/profiles/larry.json')),
  google: JSON.parse(fs.readFileSync('./docs/profiles/google.json')),
  navalLegacy: JSON.parse(fs.readFileSync('./docs/profiles/naval-legacy.json'))
}

const sampleTokenFiles = {
  ryan_apr20: {
    url: "https://blockstack.s3.amazonaws.com/ryan_apr20.id",
    body: JSON.parse(fs.readFileSync('./docs/tokenfiles/ryan_apr20.json'))
  },
  ryan: {
    url: "https://blockstack.s3.amazonaws.com/ryan.id",
    body: JSON.parse(fs.readFileSync('./docs/tokenfiles/ryan.json'), 'utf8')
  }
}

const sampleProofs = {
  naval: JSON.parse(fs.readFileSync('./docs/profiles/naval.proofs.json')),
  larry: JSON.parse(fs.readFileSync('./docs/profiles/larry.proofs.json'))
}

const sampleVerifications = {
  naval: {
    facebook: {
      url: "https://www.facebook.com/navalr/posts/10152190734077261",
      body: fs.readFileSync('./docs/profiles/naval.verification.facebook.html','utf8')
    },
    github: {
      url: "https://gist.github.com/navalr/f31a74054f859ec0ac6a",
      body: fs.readFileSync('./docs/profiles/naval.verification.github.html','utf8')
    },
    twitter: {
      url: "https://twitter.com/naval/status/486609266212499456",
      body: fs.readFileSync('./docs/profiles/naval.verification.twitter.html','utf8')
    }
  },
  larry: {
    facebook: {
      url: "https://www.facebook.com/larrysalibra/posts/10100341028448093",
      body: fs.readFileSync('./docs/profiles/larry.verification.facebook.html','utf8')
    }
  }
}

export { sampleProfiles, sampleProofs, sampleVerifications, sampleTokenFiles }