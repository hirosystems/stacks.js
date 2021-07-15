import { createStacksPrivateKey, makeRandomPrivKey, getPublicKey } from '@blockstack/stacks-transactions';

// Random key
const privateKey = makeRandomPrivKey();
// Get public key from private
const publicKey = getPublicKey(privateKey);

console.log({privateKey, publicKey})

