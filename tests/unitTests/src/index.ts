import { runAuthTests }         from './unitTestsAuth'
import { runProfilesUnitTests } from './unitTestsProfiles'
import { runProofsUnitTests }   from './unitTestsProofs'
import { runUtilsTests }        from './unitTestsUtils'
import { runEncryptionTests }   from './unitTestsEncryption'
import { runStorageTests }      from './unitTestsStorage'
import { runOperationsTests }   from './unitTestsOperations'
import { runWalletTests }       from './unitTestsWallet'
import { runErrorsTests }       from './unitTestsErrors'
import { runNetworkTests }      from './unitTestsNetwork'

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

// Operations Tests
runOperationsTests()

runWalletTests()

// Errors Tests
runErrorsTests()

// network tests 
runNetworkTests()
