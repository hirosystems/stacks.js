'use strict'

export function containsValidProofStatement(searchText, fqdn) {
  searchText = searchText.toLowerCase()

  if (fqdn.split('.').length != 2) {
    throw new Error("Please provide the fully qualified Blockstack name.")
  }

  let username = null

  // support legacy Blockstack ID proofs
  if (fqdn.endsWith('.id')) {
    username = fqdn.split('.id')[0]
  }

  const verificationStyles = username != null ? [
      `verifying myself: my bitcoin username is +${username}`,
      `verifying myself: my bitcoin username is ${username}`,
      `verifying myself: my openname is ${username}`,
      `verifying that +${username} is my bitcoin username`,
      `verifying that ${username} is my bitcoin username`,
      `verifying that ${username} is my openname`,
      `verifying that +${username} is my openname`,
      `verifying i am +${username} on my passcard`,
      `verifying that +${username} is my blockchain id`,
      `verifying that "${fqdn}" is my blockstack id`, // id
      `verifying that ${fqdn} is my blockstack id`,
      `verifying that &quot;${fqdn}&quot; is my blockstack id`
  ] : [ // only these formats are valid for non-.id tlds
    `verifying that "${fqdn}" is my blockstack id`, // id
    `verifying that ${fqdn} is my blockstack id`,
    `verifying that &quot;${fqdn}&quot; is my blockstack id`
  ]

  for (let i = 0; i < verificationStyles.length; i++) {
    let verificationStyle = verificationStyles[i]
    if (searchText.includes(verificationStyle)) {
      return true
    }
  }

  if (username != null &&
      searchText.includes("verifymyonename") &&
      searchText.includes(`+${username}`)) {
    return true
  }

  return false
}