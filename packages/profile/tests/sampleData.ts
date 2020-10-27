import * as fs from 'fs'

const TEST_DATA_DIR = './tests/testData'

export const sampleManifests = {
  helloBlockstack: {
    name: 'Hello, Blockstack',
    short_name: 'Hello, Blockstack',
    start_url: 'https://helloblockstack.com',
    display: 'standalone',
    background_color: '#fff',
    description: 'A simple app demonstrating how to log in with Blockstack.',
    icons: [
      {
        src: 'https://raw.githubusercontent.com/blockstack/blockstack-portal/master/app/images/app-hello-blockstack.png',
        sizes: '192x192',
        type: 'image/png'
      }
    ]
  }
}

export const sampleNameRecords = {
  ryan: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/name-records/ryan.json`, 'utf8'))
}

export const sampleProfiles = {
  balloonDog: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/profiles/balloonDog.json`, 'utf8')),
  naval: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/profiles/naval.json`, 'utf8')),
  ryan: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/profiles/ryan.json`, 'utf8')),
  larry: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/profiles/larry.json`, 'utf8')),
  google: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/profiles/google.json`, 'utf8')),
  navalLegacy: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/profiles/naval-legacy.json`, 'utf8')),
  navalLegacyConvert: JSON.parse(
    fs.readFileSync(`${TEST_DATA_DIR}/profiles/naval-legacy-convert.json`, 'utf8')
  )
}

export const sampleTokenFiles = {
  ryan_apr20: {
    url: 'https://blockstack.s3.amazonaws.com/ryan_apr20.id',
    body: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/token-files/ryan_apr20.json`, 'utf8'))
  },
  ryan: {
    url: 'https://blockstack.s3.amazonaws.com/ryan.id',
    body: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/token-files/ryan.json`, 'utf8'))
  }
}

export const sampleProofs = {
  naval: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/profiles/naval.proofs.json`, 'utf8')),
  larry: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/profiles/larry.proofs.json`, 'utf8')),
  ken: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/profiles/ken.proofs.json`, 'utf8')),
  bruno: JSON.parse(fs.readFileSync(`${TEST_DATA_DIR}/profiles/bruno.proofs.json`, 'utf8'))
}

export const sampleVerifications = {
  naval: {
    facebook: {
      url: 'https://www.facebook.com/navalr/posts/10152190734077261',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/naval.verification.facebook.html`, 'utf8')
    },
    github: {
      url: 'https://gist.github.com/navalr/f31a74054f859ec0ac6a',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/naval.verification.github.html`, 'utf8')
    },
    twitter: {
      url: 'https://twitter.com/naval/status/486609266212499456',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/naval.verification.twitter.html`, 'utf8')
    }
  },
  larry: {
    facebook: {
      url: 'https://www.facebook.com/larry.salibra/posts/10100341028448093',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/larry.verification.facebook.html`, 'utf8')
    }
  }
}

export const sampleAddressBasedVerifications = {
  larry: {
    facebook: {
      url: 'https://www.facebook.com/larrysalibra/posts/10100341028448094',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/larry.verification.address.facebook.html`,
                            'utf8')
    }
  },
  ken: {
    github: {
      url: 'https://gist.github.com/yknl/37c763ab7bc6cf89b919212ef3f10676',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/ken.verification.github.html`, 'utf8')
    },
    twitter: {
      url: 'https://twitter.com/YukanL/status/903285763240022017',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/ken.verification.twitter.html`, 'utf8')
    },
    instagram: {
      url: 'https://www.instagram.com/p/BYj6UDwgaX7/',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/ken.verification.instagram.html`, 'utf8')
    },
    instagramRegression: {
      url: 'https://www.instagram.com/p/BYj6UDwgaX7/',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/`
                            + 'ken.verification.instagram.regression.html', 'utf8')
    },
    hackerNews: {
      url: 'https://news.ycombinator.com/user?id=yukanl',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/ken.verification.hackernews.html`, 'utf8')
    },
    linkedIn: {
      url: 'https://www.linkedin.com/feed/update/urn:li:activity:6311587377647222784/',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/ken.verification.linkedin.html`, 'utf8')
    },
    linkedInBroken: {
      url: 'https://www.linkedin.com/feed/update/urn:li:activity:6311587377647222784/',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/ken.verification.linkedinbroken.html`,
                            'utf8')
    }
  },
  oscar: {
    linkedIn: {
      url: 'https://www.linkedin.com/feed/update/urn:li:activity:6504006525630189568/',
      body: fs.readFileSync(`${TEST_DATA_DIR}/profiles/oscar.verification.linkedin.html`, 'utf8')
    }
  }
}
