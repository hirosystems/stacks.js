import { utf8ToBytes } from '@stacks/common';
import { decryptECIES, encryptECIES, signECDSA, verifyECDSA } from '../src/ec';
import { getPublicKeyFromPrivate, publicKeyToBtcAddress } from '../src/keys';

test('Private key to address', () => {
  const privateKey = '00cdce6b5f87d38f2a830cae0da82162e1b487f07c5affa8130f01fe1a2a25fb01';
  const expectedAddress = '1WykMawQRnLh7SWmmoRL4qTDNCgAsVRF1';

  const publicKey = getPublicKeyFromPrivate(privateKey);
  const address = publicKeyToBtcAddress(publicKey);

  expect(address).toEqual(expectedAddress);
});

test('Encrypt and decrypt string', async () => {
  const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229';
  const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69';

  const testString = 'all work and no play makes jack a dull boy';

  const cipherObj = await encryptECIES(publicKey, utf8ToBytes(testString), true);
  const deciphered = await decryptECIES(privateKey, cipherObj);

  expect(deciphered).toEqual(testString);
});

test('Sign content using ECDSA', () => {
  const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229';
  const testString = 'all work and no play makes jack a dull boy';

  const sigObj = signECDSA(privateKey, testString);
  const result = verifyECDSA(testString, sigObj.publicKey, sigObj.signature);

  expect(result).toBeTruthy();
});
