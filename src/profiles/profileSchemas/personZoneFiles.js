'use strict'

import { makeZoneFile, parseZoneFile } from 'zone-file'

import { Person } from './person'
import { getTokenFileUrl } from '../profileZoneFiles'
import { extractProfile } from '../profileTokens'

export function resolveZoneFileToPerson(zoneFile, publicKeyOrAddress, callback) {
  let zoneFileJson = null
  try {
    zoneFileJson = parseZoneFile(zoneFile)
    if (!zoneFileJson.hasOwnProperty('$origin')) {
      zoneFileJson = null
      throw('zone file is missing an origin')
    }
  } catch(e) {
  }

  let tokenFileUrl = null
  if (zoneFileJson && Object.keys(zoneFileJson).length > 0) {
    tokenFileUrl = getTokenFileUrl(zoneFileJson)
  } else {
    let profile = null
    try {
      profile = JSON.parse(zoneFile)
      const person = Person.fromLegacyFormat(profile)
      profile = person.profile()
    } catch (error) {
      console.warn(error)
    }
    callback(profile)
    return
  }

  if (tokenFileUrl) {
    fetch(tokenFileUrl)
      .then((response) => response.text())
      .then((responseText) => JSON.parse(responseText))
      .then((responseJson) => {

        let tokenRecords = responseJson
        let token = tokenRecords[0].token
        let profile = extractProfile(token, publicKeyOrAddress)

        callback(profile)
        return
      })
      .catch((error) => {
        console.warn(error)
      })
  } else {
    console.warn('Token file url not found')
    callback({})
    return
  }
}