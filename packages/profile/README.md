# @stacks/profile

Functions for manipulating user profiles.

## Installation

```
npm install @stacks/profile
```

### Get profile from token

```typescript
import { extractProfile } from '@stacks/profile';

// Token received after signin in browser using auth or connect package
const token = '<insert profile token here>';

const profile = extractProfile(token);
// profile
```

### Verify profile token

```typescript
import { verifyProfileToken } from '@stacks/profile';

// Token received after signin in browser using auth or connect package
const token = '<insert profile token here>';
const publicKey = '<insert public key>';

const decodedToken = verifyProfileToken(token, publicKey);
// decodedToken if verified successfully
// Otherwise throws an error if token verification fails
```

### Make zonefile

```typescript
import { makeProfileZoneFile } from '@stacks/profile';

const fileUrl = 'https://mq9.s3.amazonaws.com/naval.id/profile.json';
const origin = 'naval.id';
const zoneFile = makeProfileZoneFile(origin, fileUrl);
// zoneFile contents
```
### Profile to token

```typescript
import { signProfileToken, verifyProfileToken, extractProfile } from '@stacks/profile';

// Token received after signin in browser using auth or connect
const token = '<insert profile token here>';
const profile = extractProfile(token);
// warning: Do not expose your private key by hard coding in code. Use env variables to load private keys.  
const privateKey = '<private key>'; // process.env.privateKey
const publicKey = '<public key>';

const signedToken = signProfileToken(profile, privateKey);
const decodedToken = verifyProfileToken(signedToken, publicKey);
// decodedToken if verified successfully
// Otherwise throws an error if token verification fails
```

### Profile Validation

```typescript
import { extractProfile, Profile } from '@stacks/profile';

// Token received after signin in browser using auth or connect
const token = '<insert profile token here>';
// warning: Do not expose your private key by hard coding in code. Use env variables to load private keys.
const privateKey = '<private key>'; // process.env.privateKey
const publicKey = '<public key>';

const profile = extractProfile(token);

const profileObject = new Profile(profile);
console.log(profileObject);

const validationResults = Profile.validateSchema(profile);
console.log(validationResults.valid);

const profileJson = profileObject.toJSON();
console.log(profileJson);

const tokenRecords = profileObject.toToken(privateKey);
console.log(tokenRecords);

const profileFromToken = Profile.fromToken(tokenRecords, publicKey);
console.log(profileFromToken);
```
