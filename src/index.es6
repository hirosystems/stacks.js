'use strict'

/*
 * Profiles
 */
import { signToken, wrapToken, signTokenRecords } from './tokenSigning'
import { verifyToken, verifyTokenRecord, getProfileFromTokens } from './tokenVerifying'

import { Profile } from './profile'
import { Person, Organization, CreativeWork, getPersonFromLegacyFormat } from './identities'

import { makeZoneFileForHostedProfile } from './zoneFiles'
import { nextYear } from './utils'

/*
 * Proofs
 */
import { validateProofs } from './proofs'

export {
  signToken,
  wrapToken,
  signTokenRecords,
  verifyToken,
  verifyTokenRecord,
  getProfileFromTokens,
  makeZoneFileForHostedProfile,
  Profile,
  Person,
  Organization,
  CreativeWork,
  nextYear,
  validateProofs
}