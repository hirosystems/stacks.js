'use strict'

import queryString from 'query-string'
import base64url from 'base64url'
import request from 'request'
import { decodeToken } from 'jsontokens'

export class AuthAgent {
  constructor(identityProviderURL, nameResolverURL,
              currentHostURL=window.location.origin) {
    this.storageLabel = 'blockstack'
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
    return window.localStorage.getItem(this.storageLabel) ? true : false
  }

  requestLogin() {
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

  isLoginPending() {
    return this.getAuthResponseToken() ? true : false
  }

  completeLogin(callbackFunction) {
    const authResponseToken = this.getAuthResponseToken()
    const username = AuthAgent.getUsernameFromToken(authResponseToken)
    const requestURL = this.nameResolverURL + username
    request(requestURL, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        const profile = JSON.parse(body)[username].profile
        const session = {
          username: username,
          profile: profile,
          authResponseToken: authResponseToken
        }
        window.localStorage.setItem(this.storageLabel, JSON.stringify(session))
        callbackFunction(session)
      }
    })
  }

  loadSession(callbackFunction) {
    const session = JSON.parse(localStorage.getItem(authAgent.storageLabel))
    callbackFunction(session)
  }

  logout() {
    window.localStorage.removeItem(this.storageLabel)
    window.location = this.currentHost
  }
}