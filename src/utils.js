'use strict'

/**
 * Time
 */

export function nextYear() {
  return new Date(
    new Date().setFullYear(
      new Date().getFullYear() + 1
    )
  )
}

export function nextMonth() {
  return new Date(
    new Date().setMonth(
      new Date().getMonth() + 1
    )
  )
}

export function nextHour() {
  return new Date(
    new Date().setHours(
      new Date().getHours() + 1
    )
  )
}

/**
 * UUIDs
 */

export function makeUUID4() {
  let d = new Date().getTime()
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now(); //use high-precision timer if available
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = (d + Math.random() * 16) % 16 | 0
    d = Math.floor(d / 16)
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

/**
 * Properties
 */

/**
  * Determines whether a given object has a certain nested property
  * @param {Object} obj - the object to be checked
  * @param {String} path - the nested pathway to check
  *
  * Author: Miguel Mota <hello@miguelmota.com> (http://www.miguelmota.com/)
  */
export function hasprop(obj, path) {
  if (arguments.length === 1 && (typeof obj === 'object' || obj instanceof Object)) {
    return function(path) {
      return hasprop(obj, path)
    }
  }

  if (!(typeof obj === 'object' || obj instanceof Object) || obj === null) {
    return false
  }

  let props = [];

  if (Array.isArray(path)) {
    props = path
  } else {
    if (!(typeof path === 'string' || path instanceof String)) {
      return false
    }

    props = (path.match(/(\[(.*?)\]|[0-9a-zA-Z_$]+)/gi)||props).map(function(match) {
      return match.replace(/[\[\]]/gi,'')
    })
  }

  let size = props.length
  let last = props[size - 1]
  let head = obj

  for (let i = 0; i < size; i += 1) {
    if (typeof head[props[i]] === 'undefined' ||
        head[props[i]] === null) {
      return false
    }
    head = head[props[i]]
    if (typeof head !== 'undefined') {
      if (props[i] === last && i === size - 1) {
        return true
      }
    }
  }

  return false
}