import { AddressVersion } from '@stacks/transactions'
import { DidType, StacksNetworkDeployment } from './types'

export const DID_METHOD_PREFIX = 'did:stack:v2'

/*
 * If a subdomain has been transferred to this address (i.e. this addresss is listed as the current owner),
 * it is considered revoked (the derived DID is therefore considered deactivated).
 */

export const SUBDOMAIN_REVOKED_ADDR = '1111111111111111111114oLvT2'

/**
 * The BNS contract is deployed at these addresses
 */

export const BNS_ADDRESSES = {
  main: 'SP000000000000000000002Q6VF78.bns',
  test: 'ST000000000000000000002AMW42H.bns',
}

/**
 * The ID of the Stacks transaction in which the BNS contract was deployed.
 * Used to represent DIDs based on migrated BNS names
 * @see - https://github.com/jolocom/stacks-did-resolver/blob/main/docs/DID_Method_Spec.md#35-migration-from-legacy-stack-v1-dids
 */

export const BNS_CONTRACT_DEPLOY_TXID = {
  test: '55bb3a37f9b2e8c58905c95099d5fc21aa47d073a918f3b30cc5abe4e3be44c6',
  main: 'd8a9a4528ae833e1894eee676af8d218f8facbf95e166472df2c1a64219b5dfb',
}

/**
 * Version byte used to denote off-chain DIDs. As documented here:
 * @see https://github.com/jolocom/stacks-did-resolver/blob/main/docs/DID_Method_Spec.md#22-address-encoding
 */

export const OffChainAddressVersion = {
  mainnet: 17,
  testnet: 18,
}

export const versionByteToDidType = {
  [AddressVersion.MainnetSingleSig]: {
    type: DidType.onChain,
    deployment: StacksNetworkDeployment.main,
  },
  [AddressVersion.TestnetSingleSig]: {
    type: DidType.onChain,
    deployment: StacksNetworkDeployment.test,
  },
  [OffChainAddressVersion.mainnet]: {
    type: DidType.offChain,
    deployment: StacksNetworkDeployment.main,
  },
  [OffChainAddressVersion.testnet]: {
    type: DidType.offChain,
    deployment: StacksNetworkDeployment.test,
  },
}
