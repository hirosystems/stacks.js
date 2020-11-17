import './setup';
import { getWallet } from './helpers';
import { TransactionVersion } from '@stacks/transactions';

const getSigner = async () => {
  const wallet = await getWallet();
  return wallet.getSigner();
};

test('can get a STX address', async () => {
  const signer = await getSigner();
  expect(signer.getSTXAddress(TransactionVersion.Mainnet)).toEqual(
    'SP384CVPNDTYA0E92TKJZQTYXQHNZSWGCAG7SAPVB'
  );
  expect(signer.getSTXAddress(TransactionVersion.Testnet)).toEqual(
    'ST384CVPNDTYA0E92TKJZQTYXQHNZSWGCAH0ER64E'
  );
});
