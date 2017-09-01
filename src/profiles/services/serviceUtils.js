export function containsValidProofStatement(searchText, identifier) {
  searchText = searchText.toLowerCase()

  if (identifier.split('.').length !== 2) {
    throw new Error('Please provide the fully qualified Blockstack name.')
  }

  let username = null

  // support legacy Blockstack ID proofs
  if (identifier.endsWith('.id')) {
    username = identifier.split('.id')[0]
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
    `verifying that "${identifier}" is my blockstack id`, // id
    `verifying that ${identifier} is my blockstack id`,
    `verifying that &quot;${identifier}&quot; is my blockstack id`
  ] : [ // only these formats are valid for non-.id tlds
    `verifying that "${identifier}" is my blockstack id`, // id
    `verifying that ${identifier} is my blockstack id`,
    `verifying that &quot;${identifier}&quot; is my blockstack id`
  ]

  for (let i = 0; i < verificationStyles.length; i++) {
    const verificationStyle = verificationStyles[i]
    if (searchText.includes(verificationStyle)) {
      return true
    }
  }

  if (username != null &&
      searchText.includes('verifymyonename') &&
      searchText.includes(`+${username}`)) {
    return true
  }

  return false
}

export function containsValidBitcoinProofStatement(proofStatement, identifier) {
  proofStatement = proofStatement.split(identifier)[0].toLowerCase() + identifier

  const verificationStyles = [
    `verifying my avatar on blockstack is owned by the address ${identifier}`
  ]

  for (let i = 0; i < verificationStyles.length; i++) {
    const verificationStyle = verificationStyles[i]
    if (proofStatement.includes(verificationStyle)) {
      return true
    }
  }

  return false
}
