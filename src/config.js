import { network } from './network'
import { levels } from './logger'

const config = {
  network: network.defaults.MAINNET_DEFAULT,
  logLevel: levels[0]
}

export { config }
