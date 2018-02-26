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

### Where profile data is stored

Profile data is stored using Gaia on the user's selected storage provider. 

An example of a profile.json file URL using Blockstack provided storage:
`https://gaia.blockstack.org/hub/1EeZtGNdFrVB2AgLFsZbyBCF7UTZcEWhHk/profile.json`


### Validate a proof

```es6
import { validateProofs } from 'blockstack'

const domainName = "naval.id"
validateProofs(profile, domainName).then((proofs) => {
  console.log(proofs)
})
```

### How proofs are validated
The `validateProofs` function checks each of the proofs listed in the 
profile by fetching the proof URL and verifying the proof message.

The proof message must be of the form:
```
Verifying my Blockstack ID is secured with the address 
1EeZtGNdFrVB2AgLFsZbyBCF7UTZcEWhHk
```

The proof message also must appear in the required location on the 
proof page specific to each type of social media account.

The account from which the proof message is posted must match exactly
the account identifier/username claimed in the user profile. The 
`validateProofs` function will check this in the body of the proof or
in the proof URL depending on the service.

### Adding additional social account validation services
The `Service` class can be extended to provide proof validation service
to additional social account types. You will need to override the 
`getProofStatement(searchText: string)` method which parses the proof
body and returns the proof message text. Additionally, the identifier 
claimed should be verified in the proof URL or in the body by implementing   
`getProofIdentity(searchText: string)` and setting `shouldValidateIdentityInBody()`
to return true.

The following snippet uses the meta tags in the proof page to retrieve the proof message.
```js
static getProofStatement(searchText: string) {
	const $ = cheerio.load(searchText)
	const statement = $('meta[property="og:description"]')
	                    .attr('content')

	if (statement !== undefined && statement.split(':').length > 1) {
	  return statement.split(':')[1].trim().replace('“', '').replace('”', '')
	} else {
	  return ''
	}
}
```

### Currently supported proof validation services
- Facebook
- Twitter
- Instagram
- LinkedIn
- Hacker News
- GitHub

### Profile proof schema
Proofs are stored under the `account` key in the user's profile data
```js
"account": [
	{
	  "@type": "Account",
	  "service": "twitter",
	  "identifier": "naval",
	  "proofType": "http",
	  "proofUrl": "https://twitter.com/naval/status/12345678901234567890"
	}
]
```

