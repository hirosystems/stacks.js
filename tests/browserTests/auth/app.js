/* eslint-disable */
document.addEventListener('DOMContentLoaded', function (event) {
  document.getElementById('signin-button').addEventListener('click', function () {
    blockstack.redirectToSignIn()
  })
  document.getElementById('signout-button').addEventListener('click', function () {
    blockstack.signUserOut(window.location.origin)
  })

  function showProfile(profile) {
    var person = new blockstack.Person(profile)
    document.getElementById('heading-name').innerHTML = person.name()
    document.getElementById('avatar-image').setAttribute('src', person.avatarUrl())
    document.getElementById('section-1').style.display = 'none'
    document.getElementById('section-2').style.display = 'block'
  }

  if (blockstack.isUserSignedIn()) {
    const userData = blockstack.loadUserData()
    showProfile(userData.profile)
  } else if (blockstack.isSignInPending()) {
    blockstack.handlePendingSignIn().then(userData => {
      showProfile(userData.profile)
    })
  }
})
