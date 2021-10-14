import { WalletKeyInfoResult } from './keychain';

export const keyInfoTests: Array<[string, WalletKeyInfoResult]> = [
  [
    // Derivation path
    "m/44'/5757'/0'/0/0",
    // Expected result
    {
      privateKey: '25899fab1b9b95cc2d1692529f00fb788e85664df3d14db1a660f33c5f96d8ab01',
      address: 'SP3RBZ4TZ3EK22SZRKGFZYBCKD7WQ5B8FFS0AYVF7',
      btcAddress: '1Nwxfx7VoYAg2mEN35dTRw4H7gte8ajFki',
      wif: 'KxUgLbeVeFZEUUQpc3ncYn5KFB3WH5MVRv3SJ2g5yPwkrXs3QRaP',
      index: 0
    }
  ],
  [
    // Derivation path
    "m/888'/0'/0",
    // Expected result
    {
      privateKey: '0f0936f59a7d55be6bcd1820f798460ac4b3aa50f26c8fa76beb82a19af5110901',
      address: 'SPGJAPK47Z9XY7E7BCEJFAEX9C7WGB0YB74A54MA',
      btcAddress: '142G3fnfn1WZPtnYLYiVGt8aU55GZYxeVP',
      wif: 'KwiwQgTK2412XSdBfcRWJ4xQFbevUHCwGnRCuvjeHjSqceNwS1wW',
      index: 0
    }
  ]
];

export { WalletKeyInfoResult };


