export type MakeKeychainResult = {
  mnemonic: string,
  keyInfo: {
    privateKey: string;
    address: string;
    btcAddress: string;
    wif: string;
    index: number;
  };
};

export type WalletKeyInfoResult = {
  privateKey: string;
  address: string;
  btcAddress: string;
  wif: string;
  index: number;
};

export const makekeychainTests: Array<[string, MakeKeychainResult]> = [
  [
    // Derivation Path
    "m/44'/5757'/0'/0/0",
    // Expected result
    {
      mnemonic: 'vivid oxygen neutral wheat find thumb cigar wheel board kiwi portion business',
      keyInfo: {
        privateKey: 'd1124855494c883c5e1df0201be40a835f08ae5fc3a6520224b2239db94a818001',
        address: 'ST1J28031BYDX19TYXSNDG9Q4HDB2TBDAM921Y7MS',
        btcAddress: 'mpeSzfUTBba7qzKNcg8ojNm4GAfwmNPX8X',
        wif: 'L4E7pXmqdm8C8TakpX7YDDmFopaQw32Ak6V5BpRFNDJmo7wjGVqc',
        index: 0
      }
    }
  ],
  [
    // Derivation Path
    "m/888'/0'/0",
    // Expected result
    {
      mnemonic: 'vivid oxygen neutral wheat find thumb cigar wheel board kiwi portion business',
      keyInfo: {
        privateKey: 'd4d30d4fdaa59e166865b836548015c2780063b82e7b2a364c8a2e32df7139ce01',
        address: 'ST1WT20920NVRQ892MS535R7XEMV6KD6M6X2HQPK3',
        btcAddress: 'mrc4w3oQZ39Yvkimk9DDJQnHFjv1e336mg',
        wif: 'L4MQx6c6ZmoiwFYUHnmt39THRGeQnPmfA2AFobwWmssZJabi3qXm',
        index: 0
      }
    }
  ]
];

export const keyInfoTests: Array<[string, WalletKeyInfoResult]> = [
  [
    // Derivation Path
    "m/44'/5757'/0'/0/0",
    // Expected result
    {
      privateKey: 'd1124855494c883c5e1df0201be40a835f08ae5fc3a6520224b2239db94a818001',
      address: 'ST1J28031BYDX19TYXSNDG9Q4HDB2TBDAM921Y7MS',
      btcAddress: 'mpeSzfUTBba7qzKNcg8ojNm4GAfwmNPX8X',
      wif: 'L4E7pXmqdm8C8TakpX7YDDmFopaQw32Ak6V5BpRFNDJmo7wjGVqc',
      index: 0
    }
  ],
  [
    // Derivation Path
    "m/888'/0'/0",
    // Expected result
    {
      privateKey: 'd4d30d4fdaa59e166865b836548015c2780063b82e7b2a364c8a2e32df7139ce01',
      address: 'ST1WT20920NVRQ892MS535R7XEMV6KD6M6X2HQPK3',
      btcAddress: 'mrc4w3oQZ39Yvkimk9DDJQnHFjv1e336mg',
      wif: 'L4MQx6c6ZmoiwFYUHnmt39THRGeQnPmfA2AFobwWmssZJabi3qXm',
      index: 0
    }
  ]
];


