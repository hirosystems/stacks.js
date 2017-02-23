import { runProofsUnitTests } from './proofsUnitTests'
import { runUtilsUnitTests } from './utilsUnitTests'
import { runServicesUnitTests } from './servicesUnitTests'
import { runProfilesUnitTests } from './profilesUnitTests'

/* Profiles Tests */
runProfilesUnitTests()

/* Proofs Tests */
runUtilsUnitTests()
runServicesUnitTests()
runProofsUnitTests()