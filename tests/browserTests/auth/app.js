document.getElementById('signin-button').addEventListener('click', function() {
  var authRequest = blockstack.makeAuthRequest()
  blockstack.redirectUserToSignIn(authRequest)
})
document.getElementById('signout-button').addEventListener('click', function() {
  blockstack.signUserOut(window.location.origin)
})

function showProfile(profile) {
  var person = new blockstack.Person(profile)
  document.getElementById('heading-name').html(person.name())
  document.getElementById('avatar-image').attr('src', person.avatarUrl())
  document.getElementById('section-1').hide()
  document.getElementById('section-2').show()
}

if (blockstack.isUserSignedIn()) {
  blockstack.loadUserData(function(userData) {
    showProfile(userData.profile)
  })
} else if (blockstack.isSignInPending()) {
  blockstack.signUserIn(function(userData) {
    window.location = window.location.origin
  })
}