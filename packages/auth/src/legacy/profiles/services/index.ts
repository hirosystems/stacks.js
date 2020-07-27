import { Facebook } from './facebook'
import { Github } from './github'
import { Twitter } from './twitter'
import { Instagram } from './instagram'
import { HackerNews } from './hackerNews'
import { LinkedIn } from './linkedIn'
import { Service } from './service'



/** @ignore */
export const profileServices: {
  [serviceName: string]: Service
} = {
  facebook: new Facebook(),
  github: new Github(),
  twitter: new Twitter(),
  instagram: new Instagram(),
  hackerNews: new HackerNews(),
  linkedIn: new LinkedIn()
}
