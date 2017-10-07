import { runAuthTests }         from './unitTestsAuth'
import { runProfilesUnitTests } from './unitTestsProfiles'
import { runProofsUnitTests }   from './unitTestsProofs'
import { runUtilsTests }        from './unitTestsUtils'
import { runKeyfilesUnitTests } from './unitTestsKeyfiles'

// Utils tests
runUtilsTests()

// keyfile tests 
runKeyfilesUnitTests()

// Auth Tests
runAuthTests()

// Profiles Tests
runProfilesUnitTests()

// Proofs Tests
runProofsUnitTests()

