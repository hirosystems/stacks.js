import {
  createAssetInfo,
  FungibleConditionCode,
  makeContractFungiblePostCondition,
  makeContractNonFungiblePostCondition,
  makeContractSTXPostCondition,
  makeStandardFungiblePostCondition,
  makeStandardNonFungiblePostCondition,
  makeStandardSTXPostCondition,
  NonFungibleConditionCode,
  Pc,
  uintCV,
} from '../src';

const STANDARD_ADDRESS = 'ST1WT20920NVRQ892MS535R7XEMV6KD6M6X2HQPK3';

const CONTRACT_ADDRESS = 'ST13F481SBR0R7Z6NMMH8YV2FJJYXA5JPA0AD3HP9';
const CONTRACT_NAME = 'subnet-v1';

const FT_CONTRACT_ADDRESS = 'ST13F481SBR0R7Z6NMMH8YV2FJJYXA5JPA0AD3HP9';
const FT_CONTRACT_NAME = 'super-token';
const FT_ASSET_NAME = 'SUP';

const NFT_CONTRACT_ADDRESS = 'ST13F481SBR0R7Z6NMMH8YV2FJJYXA5JPA0AD3HP9';
const NFT_CONTRACT_NAME = 'super-nft';
const NFT_TOKEN_NAME = 'super';
const NFT_ASSET_ID = uintCV(21);

describe('pc -- post condition builder', () => {
  test('fully-qualified token name', () => {
    const pcA = Pc.principal(STANDARD_ADDRESS)
      .willSendAsset()
      .nft(`${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME}::${NFT_TOKEN_NAME}`, NFT_ASSET_ID);
    const pcB = Pc.principal(STANDARD_ADDRESS)
      .willSendAsset()
      .nft(`${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME}`, NFT_TOKEN_NAME, NFT_ASSET_ID);
    expect(pcA).toEqual(pcB);
  });

  describe('invalid input', () => {
    test('invalid addresses', () => {
      expect(() => Pc.principal(STANDARD_ADDRESS).willSendEq(100).ustx()).not.toThrow();
      expect(() => Pc.principal('invalid address').willSendEq(100).ustx()).toThrow();
      expect(() => Pc.principal('invalid.address').willSendEq(100).ustx()).toThrow();

      expect(() =>
        Pc.principal(STANDARD_ADDRESS)
          .willSendEq(100)
          .ft('invalid' as any, FT_ASSET_NAME)
      ).toThrow();
      expect(() =>
        Pc.principal(STANDARD_ADDRESS).willSendEq(100).ft('inv.alid', FT_ASSET_NAME)
      ).toThrow();

      expect(() =>
        Pc.principal(STANDARD_ADDRESS)
          .willSendAsset()
          .nft(`${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME}`, NFT_TOKEN_NAME, NFT_ASSET_ID)
      ).not.toThrow();
      expect(() =>
        Pc.principal(STANDARD_ADDRESS)
          .willSendAsset()
          .nft('invalid' as any, NFT_TOKEN_NAME, NFT_ASSET_ID)
      ).toThrow();
      expect(() =>
        Pc.principal(STANDARD_ADDRESS).willSendAsset().nft('inv.alid', NFT_TOKEN_NAME, NFT_ASSET_ID)
      ).toThrow();
    });

    test('invalid fully-qualified token name', () => {
      expect(() =>
        Pc.principal(STANDARD_ADDRESS)
          .willSendAsset()
          .nft(
            // e.g. using ;; instead of ::
            `${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME};;${NFT_TOKEN_NAME}` as any,
            NFT_ASSET_ID
          )
      ).toThrow();

      expect(() =>
        Pc.principal(CONTRACT_ADDRESS)
          .willSendAsset()
          .nft(
            // e.g. using , instead of .
            `${NFT_CONTRACT_ADDRESS},${NFT_CONTRACT_NAME}::${NFT_TOKEN_NAME}` as any,
            NFT_ASSET_ID
          )
      ).toThrow();
    });
  });

  describe('standard principal', () => {
    describe('stx post condition', () => {
      test('100 ustx', () => {
        const pc = Pc.principal(STANDARD_ADDRESS).willSendEq(100).ustx();
        const postCondition = makeStandardSTXPostCondition(
          STANDARD_ADDRESS,
          FungibleConditionCode.Equal,
          100
        );
        expect(pc).toEqual(postCondition);
      });

      test('lte 100 ustx', () => {
        const pc = Pc.principal(STANDARD_ADDRESS).willSendLt(100).ustx();
        const postCondition = makeStandardSTXPostCondition(
          STANDARD_ADDRESS,
          FungibleConditionCode.Less,
          100
        );
        expect(pc).toEqual(postCondition);
      });

      test('lt 100 ustx', () => {
        const pc = Pc.principal(STANDARD_ADDRESS).willSendLt(100).ustx();
        const postCondition = makeStandardSTXPostCondition(
          STANDARD_ADDRESS,
          FungibleConditionCode.Less,
          100
        );
        expect(pc).toEqual(postCondition);
      });

      test('gte 100 ustx', () => {
        const pc = Pc.principal(STANDARD_ADDRESS).willSendGte(100).ustx();
        const postCondition = makeStandardSTXPostCondition(
          STANDARD_ADDRESS,
          FungibleConditionCode.GreaterEqual,
          100
        );
        expect(pc).toEqual(postCondition);
      });

      test('gt 100 ustx', () => {
        const pc = Pc.principal(STANDARD_ADDRESS).willSendGt(100).ustx();
        const postCondition = makeStandardSTXPostCondition(
          STANDARD_ADDRESS,
          FungibleConditionCode.Greater,
          100
        );
        expect(pc).toEqual(postCondition);
      });
    });

    describe('ft post condition', () => {
      test('100 ft', () => {
        const pc = Pc.principal(STANDARD_ADDRESS)
          .willSendEq(100)
          .ft(`${FT_CONTRACT_ADDRESS}.${FT_CONTRACT_NAME}`, FT_ASSET_NAME);
        const postCondition = makeStandardFungiblePostCondition(
          STANDARD_ADDRESS,
          FungibleConditionCode.Equal,
          100,
          createAssetInfo(FT_CONTRACT_ADDRESS, FT_CONTRACT_NAME, FT_ASSET_NAME)
        );
        expect(pc).toEqual(postCondition);
      });

      test('lte 100 ft', () => {
        const pc = Pc.principal(STANDARD_ADDRESS)
          .willSendLt(100)
          .ft(`${FT_CONTRACT_ADDRESS}.${FT_CONTRACT_NAME}`, FT_ASSET_NAME);
        const postCondition = makeStandardFungiblePostCondition(
          STANDARD_ADDRESS,
          FungibleConditionCode.Less,
          100,
          createAssetInfo(FT_CONTRACT_ADDRESS, FT_CONTRACT_NAME, FT_ASSET_NAME)
        );
        expect(pc).toEqual(postCondition);
      });

      test('lt 100 ft', () => {
        const pc = Pc.principal(STANDARD_ADDRESS)
          .willSendLt(100)
          .ft(`${FT_CONTRACT_ADDRESS}.${FT_CONTRACT_NAME}`, FT_ASSET_NAME);
        const postCondition = makeStandardFungiblePostCondition(
          STANDARD_ADDRESS,
          FungibleConditionCode.Less,
          100,
          createAssetInfo(FT_CONTRACT_ADDRESS, FT_CONTRACT_NAME, FT_ASSET_NAME)
        );
        expect(pc).toEqual(postCondition);
      });

      test('gte 100 ft', () => {
        const pc = Pc.principal(STANDARD_ADDRESS)
          .willSendGte(100)
          .ft(`${FT_CONTRACT_ADDRESS}.${FT_CONTRACT_NAME}`, FT_ASSET_NAME);
        const postCondition = makeStandardFungiblePostCondition(
          STANDARD_ADDRESS,
          FungibleConditionCode.GreaterEqual,
          100,
          createAssetInfo(FT_CONTRACT_ADDRESS, FT_CONTRACT_NAME, FT_ASSET_NAME)
        );
        expect(pc).toEqual(postCondition);
      });

      test('gt 100 ft', () => {
        const pc = Pc.principal(STANDARD_ADDRESS)
          .willSendGt(100)
          .ft(`${FT_CONTRACT_ADDRESS}.${FT_CONTRACT_NAME}`, FT_ASSET_NAME);
        const postCondition = makeStandardFungiblePostCondition(
          STANDARD_ADDRESS,
          FungibleConditionCode.Greater,
          100,
          createAssetInfo(FT_CONTRACT_ADDRESS, FT_CONTRACT_NAME, FT_ASSET_NAME)
        );
        expect(pc).toEqual(postCondition);
      });
    });

    describe('nft post condition', () => {
      test('will send nft', () => {
        const pc = Pc.principal(STANDARD_ADDRESS)
          .willSendAsset()
          .nft(`${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME}`, NFT_TOKEN_NAME, NFT_ASSET_ID);
        const postCondition = makeStandardNonFungiblePostCondition(
          STANDARD_ADDRESS,
          NonFungibleConditionCode.Sends,
          createAssetInfo(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_NAME, NFT_TOKEN_NAME),
          NFT_ASSET_ID
        );
        expect(pc).toEqual(postCondition);
      });

      test('will not send nft', () => {
        const pc = Pc.principal(STANDARD_ADDRESS)
          .willNotSendAsset()
          .nft(`${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME}`, NFT_TOKEN_NAME, NFT_ASSET_ID);
        const postCondition = makeStandardNonFungiblePostCondition(
          STANDARD_ADDRESS,
          NonFungibleConditionCode.DoesNotSend,
          createAssetInfo(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_NAME, NFT_TOKEN_NAME),
          NFT_ASSET_ID
        );
        expect(pc).toEqual(postCondition);
      });
    });
  });

  describe('contract principal', () => {
    describe('stx post condition', () => {
      test('100 ustx', () => {
        const pc = Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`).willSendEq(100).ustx();
        const postCondition = makeContractSTXPostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          FungibleConditionCode.Equal,
          100
        );
        expect(pc).toEqual(postCondition);
      });

      test('lte 100 ustx', () => {
        const pc = Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`).willSendLt(100).ustx();
        const postCondition = makeContractSTXPostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          FungibleConditionCode.Less,
          100
        );
        expect(pc).toEqual(postCondition);
      });

      test('lt 100 ustx', () => {
        const pc = Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`).willSendLt(100).ustx();
        const postCondition = makeContractSTXPostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          FungibleConditionCode.Less,
          100
        );
        expect(pc).toEqual(postCondition);
      });

      test('gte 100 ustx', () => {
        const pc = Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`).willSendGte(100).ustx();
        const postCondition = makeContractSTXPostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          FungibleConditionCode.GreaterEqual,
          100
        );
        expect(pc).toEqual(postCondition);
      });

      test('gt 100 ustx', () => {
        const pc = Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`).willSendGt(100).ustx();
        const postCondition = makeContractSTXPostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          FungibleConditionCode.Greater,
          100
        );
        expect(pc).toEqual(postCondition);
      });
    });

    describe('ft post condition', () => {
      test('100 ft', () => {
        const pc = Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
          .willSendEq(100)
          .ft(`${FT_CONTRACT_ADDRESS}.${FT_CONTRACT_NAME}`, FT_ASSET_NAME);
        const postCondition = makeContractFungiblePostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          FungibleConditionCode.Equal,
          100,
          createAssetInfo(FT_CONTRACT_ADDRESS, FT_CONTRACT_NAME, FT_ASSET_NAME)
        );
        expect(pc).toEqual(postCondition);
      });

      test('lte 100 ft', () => {
        const pc = Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
          .willSendLt(100)
          .ft(`${FT_CONTRACT_ADDRESS}.${FT_CONTRACT_NAME}`, FT_ASSET_NAME);
        const postCondition = makeContractFungiblePostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          FungibleConditionCode.Less,
          100,
          createAssetInfo(FT_CONTRACT_ADDRESS, FT_CONTRACT_NAME, FT_ASSET_NAME)
        );
        expect(pc).toEqual(postCondition);
      });

      test('lt 100 ft', () => {
        const pc = Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
          .willSendLt(100)
          .ft(`${FT_CONTRACT_ADDRESS}.${FT_CONTRACT_NAME}`, FT_ASSET_NAME);
        const postCondition = makeContractFungiblePostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          FungibleConditionCode.Less,
          100,
          createAssetInfo(FT_CONTRACT_ADDRESS, FT_CONTRACT_NAME, FT_ASSET_NAME)
        );
        expect(pc).toEqual(postCondition);
      });

      test('gte 100 ft', () => {
        const pc = Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
          .willSendGte(100)
          .ft(`${FT_CONTRACT_ADDRESS}.${FT_CONTRACT_NAME}`, FT_ASSET_NAME);
        const postCondition = makeContractFungiblePostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          FungibleConditionCode.GreaterEqual,
          100,
          createAssetInfo(FT_CONTRACT_ADDRESS, FT_CONTRACT_NAME, FT_ASSET_NAME)
        );
        expect(pc).toEqual(postCondition);
      });

      test('gt 100 ft', () => {
        const pc = Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
          .willSendGt(100)
          .ft(`${FT_CONTRACT_ADDRESS}.${FT_CONTRACT_NAME}`, FT_ASSET_NAME);
        const postCondition = makeContractFungiblePostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          FungibleConditionCode.Greater,
          100,
          createAssetInfo(FT_CONTRACT_ADDRESS, FT_CONTRACT_NAME, FT_ASSET_NAME)
        );
        expect(pc).toEqual(postCondition);
      });
    });

    describe('nft post condition', () => {
      test('will send nft', () => {
        const pc = Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
          .willSendAsset()
          .nft(`${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME}`, NFT_TOKEN_NAME, NFT_ASSET_ID);
        const postCondition = makeContractNonFungiblePostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          NonFungibleConditionCode.Sends,
          createAssetInfo(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_NAME, NFT_TOKEN_NAME),
          NFT_ASSET_ID
        );
        expect(pc).toEqual(postCondition);
      });

      test('will not send nft', () => {
        const pc = Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
          .willNotSendAsset()
          .nft(`${NFT_CONTRACT_ADDRESS}.${NFT_CONTRACT_NAME}`, NFT_TOKEN_NAME, NFT_ASSET_ID);
        const postCondition = makeContractNonFungiblePostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          NonFungibleConditionCode.DoesNotSend,
          createAssetInfo(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_NAME, NFT_TOKEN_NAME),
          NFT_ASSET_ID
        );
        expect(pc).toEqual(postCondition);
      });
    });
  });
});
