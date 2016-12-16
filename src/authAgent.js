'use strict'

import queryString from 'query-string'
import base64url from 'base64url'
import request from 'request'
import { decodeToken } from 'jsontokens'

export class AuthAgent {
  constructor(identityProviderURL, nameResolverURL, currentHostURL) {
    if (currentHostURL === null) {
      currentHostURL = window.location.origin
    }
    this.localStorageKeyName = 'blockstack'
    this.identityProviderURL = identityProviderURL
    this.nameResolverURL = nameResolverURL
    this.currentHost = currentHostURL
  }

  static getUsernameFromToken(authResponseToken) {
    var decodedToken = decodeToken(authResponseToken)
    var decodedBlockstackID = decodedToken.payload.issuer.username
    return decodedBlockstackID.split('.')[0]
  }

  isUserLoggedIn() {
    return window.localStorage.getItem(this.localStorageKeyName) ? true : false
  }

  requestAuthentication() {
    const payload = {
      appURI: this.currentHost,
      issuedAt: new Date().getTime()
    }
    const authRequest = base64url.encode(JSON.stringify(payload))
    window.location = this.identityProviderURL + "?authRequest=" + authRequest
  }

  getAuthResponseToken() {
    const queryDict = queryString.parse(location.search)
    return queryDict.authResponse
  }

  loadUser(authResponseToken, callbackFunction) {
    const username = AuthAgent.getUsernameFromToken(authResponseToken)
    const requestURL = this.nameResolverURL + username
    request(requestURL, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        const profile = JSON.parse(body)[username].profile
        callbackFunction(username, profile)
      }
    })
  }

  recordSession(authResponseToken, username, profile) {
    const blockstackData = {
      profile: profile,
      username: username,
      authResponseToken: authResponseToken,
    }
    window.localStorage.setItem(
      this.localStorageKeyName, JSON.stringify(blockstackData))
  }

  logout() {
    window.localStorage.removeItem(this.localStorageKeyName)
    window.location = this.currentHost
  }
}