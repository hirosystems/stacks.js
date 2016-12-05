

export function containsValidProofStatement(searchText, username) {
  searchText = searchText.toLowerCase()

  const verificationStyles = [
      `verifying myself: my bitcoin username is +${username}`,
      `verifying myself: my bitcoin username is ${username}`,
      `verifying myself: my openname is ${username}`,
      `verifying that +${username} is my bitcoin username`,
      `verifying that ${username} is my bitcoin username`,
      `verifying that ${username} is my openname`,
      `verifying that +${username} is my openname`,
      `verifying i am +${username} on my passcard`,
      `verifying that +${username} is my blockchain id`,
      `verifying that "${username}.id" is my blockstack id`,
      `verifying that ${username}.id is my blockstack id`
  ]

  for(let i = 0; i < verificationStyles.length; i++) {
    let verificationStyle = verificationStyles[i]

    if(searchText.includes(verificationStyle))
      return true

  }

  if(searchText.includes("verifymyonename") && searchText.includes(`+${username}`))
    return true

  return false
}
