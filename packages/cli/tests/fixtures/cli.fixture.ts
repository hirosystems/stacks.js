type ConvertAddressResult = {
  mainnet: {
    STACKS: string;
    BTC: string;
  };
  testnet?: {
    STACKS: string;
    BTC: string;
  };
};
type ConvertAddressTestData = Array<[string, boolean, ConvertAddressResult]>;

export const convertAddress: ConvertAddressTestData = [
  [
    'SP3RBZ4TZ3EK22SZRKGFZYBCKD7WQ5B8FFS0AYVF7', // input
    false, // testnet (-t)
    {
      mainnet: {
        STACKS: 'SP3RBZ4TZ3EK22SZRKGFZYBCKD7WQ5B8FFS0AYVF7',
        BTC: '1Nwxfx7VoYAg2mEN35dTRw4H7gte8ajFki',
      },
    },
  ],
  [
    '1Nwxfx7VoYAg2mEN35dTRw4H7gte8ajFki', // input
    false, // testnet (-t)
    {
      mainnet: {
        STACKS: 'SP3RBZ4TZ3EK22SZRKGFZYBCKD7WQ5B8FFS0AYVF7',
        BTC: '1Nwxfx7VoYAg2mEN35dTRw4H7gte8ajFki',
      },
    },
  ],
  [
    'SPA2MZWV9N67TBYVWTE0PSSKMJ2F6YXW7CBE6YPW', // input
    true, // testnet (-t)
    {
      mainnet: {
        STACKS: 'SPA2MZWV9N67TBYVWTE0PSSKMJ2F6YXW7CBE6YPW',
        BTC: '12qdRgXxgNBNPnDeEChy3fYTbSHQ8nfZfD',
      },
      testnet: {
        STACKS: 'STA2MZWV9N67TBYVWTE0PSSKMJ2F6YXW7DX96QAM',
        BTC: 'mhMaijcwVPcdAthFwmgLsaknTRt72GqQYo',
      },
    },
  ],
  [
    'STA2MZWV9N67TBYVWTE0PSSKMJ2F6YXW7DX96QAM', // input
    false, // testnet (-t)
    {
      mainnet: {
        STACKS: 'SPA2MZWV9N67TBYVWTE0PSSKMJ2F6YXW7CBE6YPW',
        BTC: '12qdRgXxgNBNPnDeEChy3fYTbSHQ8nfZfD',
      },
      testnet: {
        STACKS: 'STA2MZWV9N67TBYVWTE0PSSKMJ2F6YXW7DX96QAM',
        BTC: 'mhMaijcwVPcdAthFwmgLsaknTRt72GqQYo',
      },
    },
  ],
  [
    'mhMaijcwVPcdAthFwmgLsaknTRt72GqQYo', // input
    false, // testnet (-t)
    {
      mainnet: {
        STACKS: 'SPA2MZWV9N67TBYVWTE0PSSKMJ2F6YXW7CBE6YPW',
        BTC: '12qdRgXxgNBNPnDeEChy3fYTbSHQ8nfZfD',
      },
      testnet: {
        STACKS: 'STA2MZWV9N67TBYVWTE0PSSKMJ2F6YXW7DX96QAM',
        BTC: 'mhMaijcwVPcdAthFwmgLsaknTRt72GqQYo',
      },
    },
  ],
];
