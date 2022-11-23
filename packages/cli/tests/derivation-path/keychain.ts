export type MakeKeychainResult = {
  mnemonic: string;
  keyInfo: {
    privateKey: string;
    publicKey: string;
    address: string;
    btcAddress: string;
    wif: string;
    index: number;
  };
};

export type WalletKeyInfoResult = {
  privateKey: string;
  publicKey: string;
  address: string;
  btcAddress: string;
  wif: string;
  index: number;
};

export const makekeychainTestsMainnet: Array<[string, MakeKeychainResult]> = [
  [
    // Derivation Path
    "m/44'/5757'/0'/0/0",
    // Expected result
    {
      mnemonic: 'vivid oxygen neutral wheat find thumb cigar wheel board kiwi portion business',
      keyInfo: {
        privateKey: 'd1124855494c883c5e1df0201be40a835f08ae5fc3a6520224b2239db94a818001',
        publicKey: '027e7176a9eb25f609b44368967e146c4f96941d23727b87cfe8370b8147e016af',
        address: 'SP1J28031BYDX19TYXSNDG9Q4HDB2TBDAM8JJR59C',
        btcAddress: '1A8VhcPUNa8s4sqku7ARuTYjQB5EvPKQoP',
        wif: 'L4E7pXmqdm8C8TakpX7YDDmFopaQw32Ak6V5BpRFNDJmo7wjGVqc',
        index: 0,
      },
    },
  ],
  [
    // Derivation Path
    "m/888'/0'/0",
    // Expected result
    {
      mnemonic: 'vivid oxygen neutral wheat find thumb cigar wheel board kiwi portion business',
      keyInfo: {
        privateKey: 'd4d30d4fdaa59e166865b836548015c2780063b82e7b2a364c8a2e32df7139ce01',
        publicKey: '028b270e6799b6d3fe99c1a6ada647000d797868a610c19b1636a779d1e591cc52',
        address: 'SP1WT20920NVRQ892MS535R7XEMV6KD6M6W1H7N2X',
        btcAddress: '1C67dziRk1iJ9eFA2aEqUVZxPkKJhfyibr',
        wif: 'L4MQx6c6ZmoiwFYUHnmt39THRGeQnPmfA2AFobwWmssZJabi3qXm',
        index: 0,
      },
    },
  ],
];

export const makekeychainTestsTestnet: Array<[string, MakeKeychainResult]> = [
  [
    // Derivation Path
    "m/44'/5757'/0'/0/0",
    // Expected result
    {
      mnemonic: 'vivid oxygen neutral wheat find thumb cigar wheel board kiwi portion business',
      keyInfo: {
        privateKey: 'd1124855494c883c5e1df0201be40a835f08ae5fc3a6520224b2239db94a818001',
        publicKey: '027e7176a9eb25f609b44368967e146c4f96941d23727b87cfe8370b8147e016af',
        address: 'ST1J28031BYDX19TYXSNDG9Q4HDB2TBDAM921Y7MS',
        btcAddress: 'mpeSzfUTBba7qzKNcg8ojNm4GAfwmNPX8X',
        wif: 'cUb7HSmh4ppTHu42CvvfaYGKS3spbV7rp8dYJEsksKxn3s4zqRJD',
        index: 0,
      },
    },
  ],
  [
    // Derivation Path
    "m/888'/0'/0",
    // Expected result
    {
      mnemonic: 'vivid oxygen neutral wheat find thumb cigar wheel board kiwi portion business',
      keyInfo: {
        privateKey: 'd4d30d4fdaa59e166865b836548015c2780063b82e7b2a364c8a2e32df7139ce01',
        publicKey: '028b270e6799b6d3fe99c1a6ada647000d797868a610c19b1636a779d1e591cc52',
        address: 'ST1WT20920NVRQ892MS535R7XEMV6KD6M6X2HQPK3',
        btcAddress: 'mrc4w3oQZ39Yvkimk9DDJQnHFjv1e336mg',
        wif: 'cUiQR1bwzqVz6h1jgCb1QTxM3VwpSqsME4Jiv2Q2GzXZZKjjSNHg',
        index: 0,
      },
    },
  ],
];

export const keyInfoTests: Array<[string, WalletKeyInfoResult]> = [
  [
    // Derivation Path
    "m/44'/5757'/0'/0/0",
    // Expected result
    {
      privateKey: 'd1124855494c883c5e1df0201be40a835f08ae5fc3a6520224b2239db94a818001',
      publicKey: '027e7176a9eb25f609b44368967e146c4f96941d23727b87cfe8370b8147e016af',
      address: 'ST1J28031BYDX19TYXSNDG9Q4HDB2TBDAM921Y7MS',
      btcAddress: 'mpeSzfUTBba7qzKNcg8ojNm4GAfwmNPX8X',
      wif: 'cUb7HSmh4ppTHu42CvvfaYGKS3spbV7rp8dYJEsksKxn3s4zqRJD',
      index: 0,
    },
  ],
  [
    // Derivation Path
    "m/888'/0'/0",
    // Expected result
    {
      privateKey: 'd4d30d4fdaa59e166865b836548015c2780063b82e7b2a364c8a2e32df7139ce01',
      publicKey: '028b270e6799b6d3fe99c1a6ada647000d797868a610c19b1636a779d1e591cc52',
      address: 'ST1WT20920NVRQ892MS535R7XEMV6KD6M6X2HQPK3',
      btcAddress: 'mrc4w3oQZ39Yvkimk9DDJQnHFjv1e336mg',
      wif: 'cUiQR1bwzqVz6h1jgCb1QTxM3VwpSqsME4Jiv2Q2GzXZZKjjSNHg',
      index: 0,
    },
  ],
];
