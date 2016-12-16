'use strict'

import queryString from 'queryString'
import base64url from 'base64url'
import request from 'request'
import { decodeToken } from 'jsontokens'

export class AuthAgent {
  constructor(identityProviderURL, blockstackResolverURL) {
    this.identityProviderURL = identityProviderURL
    this.blockstackResolverURL = blockstackResolverURL
    this.localStorageKeyName = 'blockstack'
    this.currentHost = window.location.origin
  }

  static getUsernameFromToken(authResponseToken) {
    var decodedToken = decodeToken(authResponseToken)
    var decodedBlockstackID = decodedToken.payload.issuer.username
    return decodedBlockstackID.split('.')[0]
  }

  isUserLoggedIn() {
    return window.localStorage.getItem(localStorageKeyName) ? true : false
  }

  requestAuthentication() {
    const payload = {
      appURI: this.currentHost,
      issuedAt: new Date().getTime()
    }
    const authRequest = base64url.encode(JSON.stringify(payload))
    window.location = identityHost + "?authRequest=" + authRequest
  }

  getAuthResponseToken() {
    const queryDict = queryString.parse(location.search)
    return queryDict.authResponse
  }

  loadUser(authResponseToken, callbackFunction) {
    const username = AuthAgent.getUsernameFromToken(authResponseToken)
    const requestURL = this.blockstackResolverURL + username
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
    window.localStorage.removeItem(localStorageKeyName)
    window.location = this.currentHost
  }
}