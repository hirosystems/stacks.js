import { runAuthTests }         from './unitTestsAuth'
import { runProfilesUnitTests } from './unitTestsProfiles'
import { runProofsUnitTests }   from './unitTestsProofs'
import { runUtilsTests }        from './unitTestsUtils'
import { runEncryptionTests }   from './unitTestsEncryption'
import { runStorageTests }      from './unitTestsStorage'

// Utils tests
runUtilsTests()

// Auth Tests
runAuthTests()

// Profiles Tests
runProfilesUnitTests()

// Proofs Tests
runProofsUnitTests()

// Encryption Tests
runEncryptionTests()

// Storage Tests
runStorageTests()
