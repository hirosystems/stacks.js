import { buildResolve } from './resolver'
import { parseStacksDID, encodeStacksDid } from './utils'
export { buildResolve }

// Default DID resolution function configured for resolving DIDs against the Stacks V2 main network.
export const resolve = buildResolve()

// TODO Should these throw as oppose to returning a Either instance?
export const utils = {
  parseStacksDID,
  encodeStacksDid,
}
