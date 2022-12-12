# @stacks/encryption

Encryption functions used by Stacks.js packages.

## Installation

```
npm install @stacks/encryption
```

### Encrypt and decrypt string

```typescript
import { encryptECIES, decryptECIES } from '@stacks/encryption';
import { utf8ToBytes } from '@stacks/common';

const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229';
const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69';

const testString = 'all work and no play makes jack a dull boy';

// Encrypt string with public key
const cipherObj = await encryptECIES(publicKey, utf8ToBytes(testString), true);

// Decrypt the cipher with private key to get the message
const deciphered = await decryptECIES(privateKey, cipherObj);
console.log(deciphered);
```

### Sign content using ECDSA

```typescript
import { signECDSA, verifyECDSA } from '@stacks/encryption';

const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229';
const testString = 'all work and no play makes jack a dull boy';

const sigObj = signECDSA(privateKey, testString);
// Verify content using ECDSA
const result = verifyECDSA(testString, sigObj.publicKey, sigObj.signature);
console.log(result); // true
```

### `encryptMnemonic` and `decryptMnemonic`

```typescript
import { bytesToHex, hexToBytes } from '@stacks/common';
import { encryptMnemonic, decryptMnemonic } from '@stacks/encryption';

const rawPhrase = 'march eager husband pilot waste rely exclude taste twist donkey actress scene';
const rawPassword = 'rawPassword';
const mockSalt = hexToBytes('ff'.repeat(16));

// Encrypt a raw mnemonic phrase to be password protected
const encoded = await encryptMnemonic(rawPhrase, rawPassword, { getRandomBytes: () => mockSalt });

// Decrypt an encrypted mnemonic phrase with a password
const decoded = await decryptMnemonic(bytesToHex(encoded), rawPassword);

console.log(decoded);
```

### Private key to address

```typescript
import { getPublicKeyFromPrivate, publicKeyToBtcAddress } from '@stacks/encryption';

const privateKey = '00cdce6b5f87d38f2a830cae0da82162e1b487f07c5affa8130f01fe1a2a25fb01';
const expectedAddress = '1WykMawQRnLh7SWmmoRL4qTDNCgAsVRF1';

const publicKey = getPublicKeyFromPrivate(privateKey);
const address = publicKeyToBtcAddress(publicKey);
console.log(address === expectedAddress); // true
```

### Make private key

```typescript
import { makeECPrivateKey, publicKeyToBtcAddress } from '@stacks/encryption';
import { SECP256K1Client } from 'jsontokens';

const privateKey = makeECPrivateKey();
// Private key is also usable with the jsontokens package
const publicKey = SECP256K1Client.derivePublicKey(privateKey);
const address = publicKeyToBtcAddress(publicKey);
console.log(address);
```
