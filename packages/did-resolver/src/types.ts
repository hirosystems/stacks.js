export enum DidType {
  onChain = 'onChain',
  offChain = 'offChain',
}

export enum StacksNetworkDeployment {
  test = 'test',
  main = 'main',
}

export type StacksV2DID = {
  prefix: 'did:stack:v2'
  address: string
  anchorTxId: string
  metadata: {
    type: DidType
    deployment: StacksNetworkDeployment
  }
}
