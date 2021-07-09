import {  encodeStacksV2Did, buildDidDoc } from "../src/utils/"
import { getResolver } from "../src/"
import * as chai from "chai"
import { expect } from "chai"
import { testNames, testSubdomains } from "./integration/data"
import {
  compressPublicKey,
  publicKeyToAddress,
  randomBytes,
} from "@stacks/transactions"
import { getKeyPair } from "../src/registrar/utils"
import {
  BNS_CONTRACT_DEPLOY_TXID,
  OffChainAddressVersion,
} from "../src/constants"
import { StacksMainnet, StacksTestnet, StacksMocknet } from "@stacks/network"
import { identity } from "ramda"

const getTestDids = () => {
  try {
    const {
      onChainDids,
      offChainDids,
    } = require("./integration/artifacts.json")
    return { onChainDids, offChainDids }
  } catch {
    console.error(
      "No DIDs found in artifacts.json, make sure to run yarn test:setup"
    )
    process.exit(0)
  }
}

var chaiAsPromised = require("chai-as-promised")

chai.use(chaiAsPromised)
chai.should()

const mocknetResolve = getResolver(new StacksMocknet())

describe("did:stack:v2 resolver", () => {
  const { simple, revoked, rotated } = getTestDids().onChainDids
  describe("On-chain Stacks v2 DIDs", () => {
    it("correctly resolves newly created Stacks v2 DID", async () => {
      return expect(mocknetResolve(simple)).to.eventually.deep.eq(
        buildDidDoc({
          did: simple,
          publicKey: testNames.simple.keypair.publicKey.data.toString("hex"),
        })
      )
    })

    it("Should correctly resolve v2 DID after the key was rotated", async () => {
      return expect(mocknetResolve(rotated)).to.eventually.deep.eq(
        buildDidDoc({
          did: rotated,
          publicKey:
            testNames.rotated.newKeypair.publicKey.data.toString("hex"),
        })
      )
    })

    it("Should fail to resolve v2 DID after name was revoked", async () => {
      return expect(mocknetResolve(revoked)).rejectedWith(
        "DIDDeactivated: Underlying BNS name revoked"
      )
    })
    it("Should correctly resolve v2 DID based on migrated name", async () => {
      const testAddr = "SPWA58Z5C5JJW2TTJEM8VZA71NJW2KXXB2HA1V16"
      const testDid = encodeStacksV2Did({
        address: testAddr,
        anchorTxId: BNS_CONTRACT_DEPLOY_TXID.main,
      }).cata(_ => '', identity)

      const mainnetResolve = getResolver(new StacksMainnet())
      return expect(mainnetResolve(testDid)).to.eventually.include({
        id: testDid,
      })
    })

    it.skip("Should fail to resolve v2 DID based on expired name", async () => {
      const testAddr = "SP15XBGYRVMKF1TWPXE6A3M0T2A87VYSVF9VFSZ1A"
      const testDid = encodeStacksV2Did({
        address: testAddr,
        anchorTxId: BNS_CONTRACT_DEPLOY_TXID.main,
      }).cata(_ => '', identity)

      const mainnetResolve = getResolver(new StacksMainnet())

      return expect(mainnetResolve(testDid)).rejectedWith(
        "Name bound to DID expired"
      )
    })
  })

  describe("Off-chain Stacks v2 DIDs", () => {
    const { simple, rotated, revoked } = getTestDids().offChainDids

    before(() => {
      if (!simple || !revoked || !rotated) {
        throw new Error(
          "No DIDs found in artifacts.json, make sure to run setup.ts before running this test"
        )
      }
    })

    it("correctly resolve off-chain Stacks v2 DID", async () => {
      const compressedPublicKey = compressPublicKey(
        testSubdomains.simple.keypair.publicKey.data
      )

      return expect(mocknetResolve(simple)).to.eventually.deep.eq(
        buildDidDoc({
          did: simple,
          publicKey: compressedPublicKey.data.toString("hex"),
        })
      )
    })

    it("correctly resolve a off-chain Stacks v2 DID after key rotation", async () => {
      const compressedPublicKey = compressPublicKey(
        testSubdomains.rotated.newKeypair.publicKey.data
      )

      return expect(mocknetResolve(rotated)).to.eventually.deep.eq(
        buildDidDoc({
          did: rotated,
          publicKey: compressedPublicKey.data.toString("hex"),
        })
      )
    })

    it("correctly fails to resolve a off-chain Stacks v2 DID after it was revoked", async () => {
      return expect(mocknetResolve(revoked)).rejectedWith(
        "InvalidSignedProfileToken: Token issuer public key does not match the verifying value"
      )
    })

    it("fails to resolve non-existent valid DID", async () => {
      const mockTxId = randomBytes(32).toString("hex")
      const randomAddress = publicKeyToAddress(
        OffChainAddressVersion.testnet,
        getKeyPair().publicKey
      )

      return expect(
        mocknetResolve(
          encodeStacksV2Did({ address: randomAddress, anchorTxId: mockTxId }).cata(_ => '', identity)
        )
      ).rejectedWith("could not find transaction by ID")
    })
  })
})
