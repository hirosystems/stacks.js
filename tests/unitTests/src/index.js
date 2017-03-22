import { runAuthTests }         from './unitTestsAuth'
import { runProfilesUnitTests } from './unitTestsProfiles'
import { runProofsUnitTests }   from './unitTestsProofs'
import { runUtilsTests }        from './unitTestsUtils'

// Utils tests
runUtilsTests()

// Auth Tests
runAuthTests()

// Profiles Tests
runProfilesUnitTests()

// Proofs Tests
runProofsUnitTests()