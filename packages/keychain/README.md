# @stacks/keychain

Create and manage keys/wallets for the Stacks blockchain.

## Installation

```
npm install @stacks/keychain
```
## Mnemonic

### Generate encrypted mnemonic

```typescript
import { decrypt, generateEncryptedMnemonicRootKeychain } from '@stacks/keychain';

const password = '427706da374f435f959283de93652375';
const twelveWorder = await generateEncryptedMnemonicRootKeychain(password, 128);
const twentyFourWorder = await generateEncryptedMnemonicRootKeychain(password, 256);

const twelveWordDecrypted = await decrypt(twelveWorder.encryptedMnemonicPhrase, password);
console.log(twelveWordDecrypted);
  
const twentyFourWordDecrypted = await decrypt(twentyFourWorder.encryptedMnemonicPhrase, password);
console.log(twentyFourWordDecrypted);
```

### Restore keychain from mnemonic
```typescript
import { deriveRootKeychainFromMnemonic } from '@stacks/keychain';

const phrase =
    'eternal army wreck noodle click shock include orchard jungle only middle forget idle pulse give empower iron curtain silent blush blossom chef animal sphere';

const rootNode = await deriveRootKeychainFromMnemonic(phrase);
const privateKey = rootNode.privateKey?.toString('hex');
// privateKey
```

## Encryption
### Encrypt and decrypt
```typescript
import { decrypt, encrypt } from '@stacks/keychain';

const phrase = 'vivid oxygen neutral wheat find thumb cigar wheel board kiwi portion business';
const password = 'supersecret';

const encryptedText = await encrypt(phrase, password);
const plainTextBuffer = await decrypt(encryptedText, password);
console.log(plainTextBuffer);
```

## Wallet 
### Generate and restore wallet
```typescript
import keychain, { decrypt } from '@stacks/keychain';
import { ChainID } from '@stacks/transactions';
import { Buffer } from '@stacks/common';

const password = 'password';
const generated = await keychain.Wallet.generate(password, ChainID.Testnet);

const encryptedBackupPhrase = generated.encryptedBackupPhrase;

const plainTextBuffer = await decrypt(Buffer.from(encryptedBackupPhrase, 'hex'), password);

const backupPhrase = plainTextBuffer.toString();

const restored = await keychain.Wallet.restore(password, backupPhrase, ChainID.Mainnet);

console.log(restored.identityPublicKeychain === generated.identityPublicKeychain);
// true
```

### Get profile from auth response
```typescript
import keychain from '@stacks/keychain';
import { ChainID } from '@stacks/transactions';
import { getPublicKeyFromPrivate, makeECPrivateKey } from '@stacks/encryption';
import { decodeToken } from 'jsontokens';

const password = 'password';
const generated = await keychain.Wallet.generate(password, ChainID.Testnet);
const [identity] = generated.identities;

const appDomain = 'https://banter.pub';
const gaiaUrl = 'https://hub.blockstack.org';
const transitPrivateKey = makeECPrivateKey();
const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey);

const authResponse = await identity.makeAuthResponse({
  appDomain,
  gaiaUrl,
  transitPublicKey,
  scopes: ['publish_data'],
});
const decoded = decodeToken(authResponse);
console.log(decoded);
```
### Get a STX address
```typescript
import keychain from '@stacks/keychain';
import { ChainID, TransactionVersion } from '@stacks/transactions';

const password = 'password';
const generated = await keychain.Wallet.generate(password, ChainID.Testnet);
const signer = generated.getSigner();
const mainnetAddress = signer.getSTXAddress(TransactionVersion.Mainnet);
console.log(mainnetAddress);

const testnetAddress = signer.getSTXAddress(TransactionVersion.Testnet);
console.log(testnetAddress);
```
