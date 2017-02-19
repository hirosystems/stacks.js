'use strict'

import { Facebook } from './facebook'
import { Github } from './github'
import { Twitter } from './twitter'



let services = {
  "facebook": Facebook,
  "github": Github,
  "twitter": Twitter
}

export { services }
