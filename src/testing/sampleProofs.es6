import fs from 'fs'

const sampleProofs = {
  naval: JSON.parse(fs.readFileSync('./docs/profiles/naval.proofs.json')),
}

export { sampleProofs }
