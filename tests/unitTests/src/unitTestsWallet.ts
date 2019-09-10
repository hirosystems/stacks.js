import * as test from 'tape-promise/tape'

import {
  BlockstackWallet
} from '../../../src'

function testsBlockstackWallet() {
  const testSeedHex = 'f17a104387a5b9c67d7c1c17a1a4724a16fdf830e5bbd6fdd214c0e08d9530aeb'
        + 'dd82b89f79dd437c6e9631ee0e3a8bf1a798921bea5528f7213861598ae82ea'
  const testSeedB58 = 'xprv9s21ZrQH143K2CAwLa4tExWuD7SFXfobGmrrEv2oNK2T7xNeDhP9TzjMJQCok'
        + '8LtGVCC2YnnS6oqCpZhLrg47aDUHSApjCHBEuTrdpipBDp'
  const identityXPUB = 'xpub6AbghT45LYjE6By2mnYQHzcMbpeCwoHFFTCZak74P7pDoh372EA8Mm18oNSH'
        + 'PeMyBWoMdr8ZFK3gXYYYjHszxvabSS7AH5FX5KaJMe6D1cB'
  const bitcoinXPUB = 'xpub6BmWvbzfwJMy4nxkWeHmxsJghoEa1gBBimGStKj36hsaZz6VGkXVnwig3cPeU'
        + 'm69UZ6TwePZRVKrzpBTc4a2CECMwVFhNo5vhEDie1KYsCj'
  const bitcoinAddress = '1QU3Q5CAXAbfKBg52wWYUjhBEcfBy8bUR'

  const identityKeyPairs = [
    {
      address: '1E3DgiNVoRQH32VW6T6USsAgcLroquV9xy',
      appsNodeKey: 'xprvA1bXJqMaKqHFnYB3LyLmtJMXgpCKisknF2EuVBrNs6UkvR3U4W2vtdEK9'
      + 'ESFx82YoX6Xi491prYxxbhFDhEjyRTsjdjFkhPPhRQQQbz92Qh',
      key: 'd15b27a6ee8d03fce15ed2a4dbe7fa9c815f579b8c9d3216b17e34453001d382',
      keyID: '0371807cd3c27d0432001964e98df7d1891a95eb7898f1ec1f04441068c8f0c780',
      salt: 'e61f9eb10842fc3e237fba6319947de93fb630df963342914339b96790563a5a'
    },
    {
      address: '1LXzzDwbERa58j5yxGhnMzXRqmQ7VvRgp2',
      appsNodeKey: 'xprvA27uFVTAx5ysXnsN8k37NtfKjaTyUXV7BZpKos9F46pto1RoinJXT2e1b'
      + 'ndpbUAzGYBXywDqgGzFahjjn6CHzp28QwPpoWkDo7KUiFM8m1c',
      key: '7ca8429187ffebd3338df6d52a5ae61b4a11dc841dfc85a36917a4b84f2867f7',
      keyID: '03e383deae2bf5c012201cfd6055553df9af2faa25d9c10621e0320715f874977f',
      salt: 'e61f9eb10842fc3e237fba6319947de93fb630df963342914339b96790563a5a'
    },
    {
      address: '1MrxgFwM5togyBu33D1mVhmvwow6aad4yh',
      appsNodeKey: 'xprvA2E794MSWMUyXQpG5FpXggAWHqoUtETNGRsT6YXzhB9w4grfrPUBHDryh'
      + 'T797Zfyt3oTw13VmgtnezzxyZRYpMNUxEQ7gU8ovX3oBALrNhn',
      key: '71fd05726002fba53eb7aa96d2a88509993a1defc9a244bc1a6463cc08b6577b',
      keyID: '02ba6e095fd2022e4a232c13546e660f8b08df8a1591705ebc2f71d0de34d5c8e5',
      salt: 'e61f9eb10842fc3e237fba6319947de93fb630df963342914339b96790563a5a'
    },
    {
      address: '16GoKCtovu6a5qf2ufzZzrMJ4jofVDhagz',
      appsNodeKey: 'xprv9zyD1NBWffvSp5iWVkeUW7kPRsMwUMdd17pmAZHNg4ijVHnx4JaW7bQf'
      + 'NJjvjZSq9LA3NqYsGfwHVuvBiJi5iPTRYCntahTFsggoW4HtT6y',
      key: '4925cc9d9d286c9ab5013618c67beea7e105b156ad481c2fcc26342d0ee661d9',
      keyID: '03b26b91d716c4aa2e1b1bd526b7151f897a01c6d2bc4140a10e2f0758971cbc98',
      salt: 'e61f9eb10842fc3e237fba6319947de93fb630df963342914339b96790563a5a'
    }
  ]

  const expectedLegacyAppSK = 'b21aaf76b684cc1b6bf8c48bcec5df1adb68a7a6970e66c86fc0e86e09b4d244'
  // I derived the following expected App SK by manually computing the derivation path from the
  //  sha256 output.
  const expectedNewAppSK    = '3168aefff6aa53959a002112821384c41f39f538c0e8727a798bb40beb62ca5e'

  const wallets = [BlockstackWallet.fromSeedBuffer(Buffer.from(testSeedHex, 'hex')),
                   BlockstackWallet.fromBase58(testSeedB58)]
  wallets
    .forEach((wallet) => {
      test('wallet matches browser 0.26.2 implementation', (t) => {
        t.plan(6)
        t.equals(wallet.getIdentityPublicKeychain().toBase58(), identityXPUB, 'id xpub is correct')
        t.equals(wallet.getBitcoinPublicKeychain().toBase58(), bitcoinXPUB, 'btc xpub is correct')
        t.equals(wallet.getBitcoinAddress(0), bitcoinAddress, 'btc address correct')
        t.deepEquals(
          [0, 1, 2, 3].map(index => wallet.getIdentityKeyPair(index, true)),
          identityKeyPairs, 'keypairs generated correctly'
        )
        const idKeyPair = wallet.getIdentityKeyPair(0, false)
        t.equals(BlockstackWallet.getLegacyAppPrivateKey(idKeyPair.appsNodeKey,
                                                         idKeyPair.salt,
                                                         'https://blockstack-todos.appartisan.com'),
                 expectedLegacyAppSK,
                 'blockstack-todos app legacy private key correct')
        t.equals(BlockstackWallet.getAppPrivateKey(idKeyPair.appsNodeKey,
                                                   'potato potato',
                                                   'carrot carrot carrot'),
                 expectedNewAppSK,
                 'blockstack-todos app private key correct')
      })
    })
}

export function runWalletTests() {
  testsBlockstackWallet()
}
