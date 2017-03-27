# Blockstack Profiles

Follow these steps to create and register a profile for a Blockchain ID:

1. Create a JSON profile object
2. Split up the profile into tokens, sign the tokens, and put them in a token file
3. Create a zone file that points to the web location of the profile token file

### Create a profile

```es6
const profileOfNaval = {
  "@context": "http://schema.org/",
  "@type": "Person",
  "name": "Naval Ravikant",
  "description": "Co-founder of AngelList"
}
```

### Sign a profile as a single token

```es6
import { makeECPrivateKey, wrapProfileToken, Person } from 'blockstack'

const privateKey = makeECPrivateKey()

const person = new Person(profileOfNaval)
const token = person.toToken(privateKey)
const tokenFile = [wrapProfileToken(token)]
```

### Verify an individual token

```js
import { verifyProfileToken } from 'blockstack'

try {
  const decodedToken = verifyProfileToken(tokenFile[0].token, publicKey)
} catch(e) {
  console.log(e)
}
```

### Recover a profile from a token file

```js
const recoveredProfile = Person.fromToken(tokenFile, publicKey)
```

### Validate profile schema

```js
const validationResults = Person.validateSchema(recoveredProfile)
```

### Validate a proof

```es6
import { validateProofs } from 'blockstack'

const domainName = "naval.id"
validateProofs(profile, domainName).then((proofs) => {
  console.log(proofs)
})
```