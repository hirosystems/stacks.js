import { hexToBytes } from '@stacks/common';
import { PoXAddressVersion } from '../src/constants';
import { decodeBtcAddress, poxAddressToBtcAddress, poxAddressToTuple } from '../src/utils';

export const BTC_ADDRESS_CASES = [
  // privateKey: cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df
  // generated using `bitcoinjs-lib` and `bip-schnorr` packages, verified against `micro-btc-signer`
  {
    format: 'p2pkh',
    expectedHash: '164247d6f2b425ac5771423ae6c80c754f7172b0',
    address: '132hGUmTRtYQFq7gHVsBCfbwFp4eNsQvBi',
    expectedVersion: 0,
    expectedLength: 20,
    mockedResult: `0x0a0c000000050c64656c6567617465642d746f091266697273742d7265776172642d6379636c6501000000000000000000000000000000330b6c6f636b2d706572696f64010000000000000000000000000000000108706f782d616464720c00000002096861736862797465730200000014164247d6f2b425ac5771423ae6c80c754f7172b00776657273696f6e020000000100127265776172642d7365742d696e64657865730b000000010100000000000000000000000000000000`,
  },
  {
    format: 'p2sh',
    expectedHash: '22662a21bb732892ac097e901eb876eec9a7fc4b',
    address: '34puHau4ZYdxJrUwy3eYT6ySpwQJxx4rkS',
    expectedVersion: 1,
    expectedLength: 20,
    mockedResult: `0x0a0c000000050c64656c6567617465642d746f091266697273742d7265776172642d6379636c6501000000000000000000000000000000350b6c6f636b2d706572696f64010000000000000000000000000000000108706f782d616464720c0000000209686173686279746573020000001422662a21bb732892ac097e901eb876eec9a7fc4b0776657273696f6e020000000101127265776172642d7365742d696e64657865730b000000010100000000000000000000000000000000`,
  },
  {
    format: 'p2sh-p2wpkh',
    expectedHash: 'ea198195595aa5ea4b9dd5b3d84cb0387be6ca77',
    address: '3P2pbdfGvBSMuSZZFBartXTtngAzVVGm1N',
    expectedVersion: 1, // 'p2sh-p2wpkh' can't be detected
    expectedLength: 20,
    mockedResult: `0x0a0c000000050c64656c6567617465642d746f091266697273742d7265776172642d6379636c6501000000000000000000000000000000370b6c6f636b2d706572696f64010000000000000000000000000000000108706f782d616464720c00000002096861736862797465730200000014ea198195595aa5ea4b9dd5b3d84cb0387be6ca770776657273696f6e020000000101127265776172642d7365742d696e64657865730b000000010100000000000000000000000000000000`,
  },
  {
    format: 'p2sh-p2wsh',
    expectedHash: '25b8d40efb9428c2a49a1a93ae92e32605347c02',
    address: '358ULjuieeSJFfKuwhL4Dk6RETiu85jKN6',
    expectedVersion: 1, // 'p2sh-p2wsh' can't be detected
    expectedLength: 20,
    mockedResult: `0x0a0c000000050c64656c6567617465642d746f091266697273742d7265776172642d6379636c6501000000000000000000000000000000390b6c6f636b2d706572696f64010000000000000000000000000000000108706f782d616464720c0000000209686173686279746573020000001425b8d40efb9428c2a49a1a93ae92e32605347c020776657273696f6e020000000101127265776172642d7365742d696e64657865730b000000010100000000000000000000000000000000`,
  },
  {
    format: 'p2wpkh',
    expectedHash: '164247d6f2b425ac5771423ae6c80c754f7172b0',
    address: 'bc1qzepy04hjksj6c4m3ggawdjqvw48hzu4sy24ghc',
    expectedVersion: 4,
    expectedLength: 20,
    mockedResult: `0x0a0c000000050c64656c6567617465642d746f091266697273742d7265776172642d6379636c65010000000000000000000000000000003b0b6c6f636b2d706572696f64010000000000000000000000000000000108706f782d616464720c00000002096861736862797465730200000014164247d6f2b425ac5771423ae6c80c754f7172b00776657273696f6e020000000104127265776172642d7365742d696e64657865730b000000010100000000000000000000000000000000`,
  },
  {
    format: 'p2wsh',
    expectedHash: 'c08c09f2973284c3600b8ff63d3252e54904f9baa976c189a767bf19644f6804',
    address: 'bc1qczxqnu5hx2zvxcqt3lmr6vjju4ysf7d649mvrzd8v7l3jez0dqzqgz0ewt',
    expectedVersion: 5,
    expectedLength: 32,
    mockedResult: `0x0a0c000000050c64656c6567617465642d746f091266697273742d7265776172642d6379636c65010000000000000000000000000000003d0b6c6f636b2d706572696f64010000000000000000000000000000000108706f782d616464720c00000002096861736862797465730200000020c08c09f2973284c3600b8ff63d3252e54904f9baa976c189a767bf19644f68040776657273696f6e020000000105127265776172642d7365742d696e64657865730b000000010100000000000000000000000000000000`,
  },
  {
    format: 'p2tr',
    expectedHash: '3b7fb17fe9edd45acd6eeac679539c6625e221edcaf25ae2cab0c767dbaac140',
    address: 'bc1p8dlmzllfah294ntwatr8j5uuvcj7yg0dete94ck2krrk0ka2c9qqwwn4dr',
    expectedVersion: 6,
    expectedLength: 32,
    mockedResult: `0x0a0c000000050c64656c6567617465642d746f091266697273742d7265776172642d6379636c65010000000000000000000000000000003f0b6c6f636b2d706572696f64010000000000000000000000000000000108706f782d616464720c000000020968617368627974657302000000203b7fb17fe9edd45acd6eeac679539c6625e221edcaf25ae2cab0c767dbaac1400776657273696f6e020000000106127265776172642d7365742d696e64657865730b000000010100000000000000000000000000000000`,
  },
];

test.each(BTC_ADDRESS_CASES)(
  'parsing btc address $format',
  ({ address, expectedVersion, expectedHash, expectedLength }) => {
    const decoded = decodeBtcAddress(address);
    expect(decoded.version).toBe(expectedVersion);
    expect(decoded.data).toEqual(expectedHash);
    expect(decoded.data).toHaveLength(expectedLength * 2);

    const tuple = poxAddressToTuple(address);
    expect(hexToBytes(tuple.value['version'].value)).toHaveLength(1);
    expect(hexToBytes(tuple.value['version'].value)[0]).toBe(expectedVersion);
    expect(tuple.value['hashbytes'].value).toEqual(expectedHash);
    expect(hexToBytes(tuple.value['hashbytes'].value)).toHaveLength(expectedLength);
  }
);

// Additional test vectors taken from https://github.com/hirosystems/stacks-blockchain-api/blob/ae0eb65c4d6901db172f2b4ea751817d8ef8c05c/src/tests/helpers-tests.ts#L193-L530
const BTC_ADDRESS_CASES_API = [
  {
    // Test vector from https://github.com/bitcoinjs/bitcoinjs-lib/blob/54259d301960cefddc259d64012bb4a7c2366d48/test/fixtures/address.json#L3-L9
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
    address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
    network: 'mainnet',
    format: 'p2pkh',
  },
  {
    // Test vector from https://github.com/bitcoinjs/bitcoinjs-lib/blob/54259d301960cefddc259d64012bb4a7c2366d48/test/fixtures/address.json#L31-L37
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
    address: 'mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r',
    network: 'testnet',
    format: 'p2pkh',
  },
  {
    privateKey: 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01',
    publicKey: '03797dd653040d344fd048c1ad05d4cbcb2178b30c6a0c4276994795f3e833da41',
    hash: '164247d6f2b425ac5771423ae6c80c754f7172b0',
    address: 'mhYeZXrSEuyf2wbJ14qZ2apG7ofMLDj9Ss',
    network: 'testnet',
    format: 'p2pkh',
  },
  {
    // Test vector from https://github.com/bitcoinjs/bitcoinjs-lib/blob/54259d301960cefddc259d64012bb4a7c2366d48/test/fixtures/address.json#L11-L15
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: 'cd7b44d0b03f2d026d1e586d7ae18903b0d385f6',
    address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
    network: 'mainnet',
    format: 'p2sh-p2pkh',
  },
  {
    // Test vector from https://github.com/trezor-graveyard/bitcoinjs-trezor/blob/13b1c0be67abfea0bddbf5360548630c82331ce9/test/fixtures/address.json#L39-L43
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: 'cd7b44d0b03f2d026d1e586d7ae18903b0d385f6',
    address: '2NByiBUaEXrhmqAsg7BbLpcQSAQs1EDwt5w',
    network: 'testnet',
    format: 'p2sh-p2pkh',
  },
  {
    privateKey: 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01',
    publicKey: '03797dd653040d344fd048c1ad05d4cbcb2178b30c6a0c4276994795f3e833da41',
    hash: '4691925d1f667ba02c5244ac4873c035ae692db8',
    address: '2MygMgDLGPjN9wfEW8gaS1CqAwnuzLdNheW',
    network: 'testnet',
    format: 'p2sh-p2pkh',
  },
  // Test vectors from https://github.com/bitcoinjs/bitcoinjs-message/blob/c43430f4c03c292c719e7801e425d887cbdf7464/test/fixtures.json#L117
  {
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: 'bcfeb728b584253d5f3f70bcb780e9ef218a68f4',
    address: '3JvL6Ymt8MVWiCNHC7oWU6nLeHNJKLZGLN',
    network: 'mainnet',
    format: 'p2sh-p2wpkh',
  },
  {
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: 'bcfeb728b584253d5f3f70bcb780e9ef218a68f4',
    address: '2NAUYAHhujozruyzpsFRP63mbrdaU5wnEpN',
    network: 'testnet',
    format: 'p2sh-p2wpkh',
  },
  {
    privateKey: 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01',
    publicKey: '03797dd653040d344fd048c1ad05d4cbcb2178b30c6a0c4276994795f3e833da41',
    hash: 'ea198195595aa5ea4b9dd5b3d84cb0387be6ca77',
    address: '2NEb2fNbJXdwi7EC6vKCjWUTA12PABNniQM',
    network: 'testnet',
    format: 'p2sh-p2wpkh',
  },
  {
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: '1a027ab82ae61bf90602223514dc6b6bc1d097ee',
    address: '344YToRR99ER5CRo975kXTUAnYcBrVxQYm',
    network: 'mainnet',
    format: 'p2sh-p2wsh',
  },
  {
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: '1a027ab82ae61bf90602223514dc6b6bc1d097ee',
    address: '2MuckXYMSkbjmGz4LpEhd9QTRztpMceVskG',
    network: 'testnet',
    format: 'p2sh-p2wsh',
  },
  {
    privateKey: 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01',
    publicKey: '03797dd653040d344fd048c1ad05d4cbcb2178b30c6a0c4276994795f3e833da41',
    hash: '25b8d40efb9428c2a49a1a93ae92e32605347c02',
    address: '2MvggQUqkG6weTSxTcpwvqh5gSow4zKjkcL',
    network: 'testnet',
    format: 'p2sh-p2wsh',
  },
  // Test vectors from https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki#examples
  {
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
    address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    network: 'mainnet',
    format: 'p2wpkh',
  },
  {
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
    address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    network: 'testnet',
    format: 'p2wpkh',
  },
  {
    privateKey: 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01',
    publicKey: '03797dd653040d344fd048c1ad05d4cbcb2178b30c6a0c4276994795f3e833da41',
    hash: '164247d6f2b425ac5771423ae6c80c754f7172b0',
    address: 'tb1qzepy04hjksj6c4m3ggawdjqvw48hzu4swvwmvt',
    network: 'testnet',
    format: 'p2wpkh',
  },
  {
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: '28205333db922f66e8a941b4a32d66de5cea03d9cda46e3e6658935272b9b24f',
    address: 'bc1q9qs9xv7mjghkd69fgx62xttxmeww5q7eekjxu0nxtzf4yu4ekf8s4plngs',
    network: 'mainnet',
    format: 'p2wsh',
  },
  {
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: '28205333db922f66e8a941b4a32d66de5cea03d9cda46e3e6658935272b9b24f',
    address: 'tb1q9qs9xv7mjghkd69fgx62xttxmeww5q7eekjxu0nxtzf4yu4ekf8szffujl',
    network: 'testnet',
    format: 'p2wsh',
  },
  {
    privateKey: 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01',
    publicKey: '03797dd653040d344fd048c1ad05d4cbcb2178b30c6a0c4276994795f3e833da41',
    hash: 'c08c09f2973284c3600b8ff63d3252e54904f9baa976c189a767bf19644f6804',
    address: 'tb1qczxqnu5hx2zvxcqt3lmr6vjju4ysf7d649mvrzd8v7l3jez0dqzql2ek5y',
    network: 'testnet',
    format: 'p2wsh',
  },
  {
    // Test vector from https://github.com/chaintope/bitcoinrb/blob/c6d2cf564f069e37301b7ba5cd2ff8a25b94dbfe/spec/bitcoin/taproot/simple_builder_spec.rb#L31
    privateKey: '0000000000000000000000000000000000000000000000000000000000000001',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    hash: 'da4710964f7852695de2da025290e24af6d8c281de5a0b902b7135fd9fd74d21',
    address: 'bc1pmfr3p9j00pfxjh0zmgp99y8zftmd3s5pmedqhyptwy6lm87hf5sspknck9',
    network: 'mainnet',
    format: 'p2tr',
  },
  {
    // Test vector from locally verified regtest/krypton accounts
    privateKey: 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01',
    publicKey: '03797dd653040d344fd048c1ad05d4cbcb2178b30c6a0c4276994795f3e833da41',
    hash: '3b7fb17fe9edd45acd6eeac679539c6625e221edcaf25ae2cab0c767dbaac140',
    address: 'tb1p8dlmzllfah294ntwatr8j5uuvcj7yg0dete94ck2krrk0ka2c9qqex96hv',
    network: 'testnet',
    format: 'p2tr',
  },
] as const;

const FORMAT_TO_VERSION = {
  p2pkh: PoXAddressVersion.P2PKH,
  p2sh: PoXAddressVersion.P2SH,
  'p2sh-p2pkh': PoXAddressVersion.P2SH, // non-multisig P2SH
  'p2sh-p2wpkh': PoXAddressVersion.P2SH,
  'p2sh-p2wsh': PoXAddressVersion.P2SH,
  p2wpkh: PoXAddressVersion.P2WPKH,
  p2wsh: PoXAddressVersion.P2WSH,
  p2tr: PoXAddressVersion.P2TR,
};
test.each(BTC_ADDRESS_CASES_API)(
  'decoding and encoding btc address $format',
  ({ address, hash, format, network }) => {
    const decoded = decodeBtcAddress(address);
    expect(decoded.data).toBe(hash);
    expect(decoded.version).toBe(FORMAT_TO_VERSION[format]);

    const encoded1 = poxAddressToBtcAddress(decoded.version, decoded.data, network);
    expect(encoded1).toBe(address);

    const encoded2 = poxAddressToBtcAddress(poxAddressToTuple(address), network);
    expect(encoded2).toBe(address);
  }
);

const BTC_ADDRESS_CASES_HASH = [
  // Test vectors taken from https://github.com/trezor-graveyard/bitcoinjs-trezor/blob/13b1c0be67abfea0bddbf5360548630c82331ce9/test/fixtures/address.json
  {
    hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
    address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
  },
  {
    hash: 'cd7b44d0b03f2d026d1e586d7ae18903b0d385f6',
    address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
  },
  {
    hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
    address: 'mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r',
  },
  {
    hash: 'cd7b44d0b03f2d026d1e586d7ae18903b0d385f6',
    address: '2NByiBUaEXrhmqAsg7BbLpcQSAQs1EDwt5w',
  },
  {
    hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
    address: 'BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4',
  },
  {
    hash: '1863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262',
    address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
  },
  {
    hash: '000000c4a5cad46221b2a187905e5266362b99d5e91c6ce24d165dab93e86433',
    address: 'tb1qqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesrxh6hy',
  },
];

test.each(BTC_ADDRESS_CASES_HASH)('decoding btc address hash', ({ address, hash }) => {
  const decoded = decodeBtcAddress(address);
  expect(decoded.data).toBe(hash);
});

const BTC_ADDRESS_CASES_INVALID_POX_ADDRESS = [
  {
    hash: '751e76e8199196d454941c45d1b3a323',
    address: 'bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj',
  },
  {
    hash: '751e',
    address: 'BC1SW50QA3JX3S',
  },
  {
    hash: '332bdfb31f688c0be0137c7c038a6d0fea0de0b6',
    address: 'MCZjFcwYJwwYqXAbd3bbnxaCVGs81cp43Z',
  },
  {
    hash: '6ac624143d19a3c91d2ac5605f0aebdfeac5b826',
    address: 'LUxXFcwXFPpRZdMv4aYu6bDwPdC2skQ5YW',
  },
  {
    hash: '751e76e8199196d454941c45d1b3a323f1433bd6751e76e8199196d454941c45d1b3a323f1433bd6',
    address: 'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7k7grplx',
  },
];

test.each(BTC_ADDRESS_CASES_INVALID_POX_ADDRESS)(
  'decoding valid btc address, but invalid for pox, throws',
  ({ address }) => {
    expect(() => decodeBtcAddress(address)).toThrow();
  }
);
