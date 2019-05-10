# Using the library

This reference describes the Blockstack Javascript Software Developer Kit (SDK) reference. For complete Blockstack documentation, see [docs.blockstack.org](https://docs.blockstack.org/). There is also reference material available for both the [iOS SDK](https://blockstack.github.io/blockstack-ios/) and [Android SDK](https://blockstack.github.io/blockstack-android/).



## Install the Library

    $ npm install blockstack


## Quickstart: Build an application

1.  Install `blockstack.js` with `npm`.

    ```bash
    npm install blockstack --save
    ```

2. Import Blockstack into your project.

    ```js
    import * as blockstack from 'blockstack'
    ```

3. Wire up a sign in button.

    ```js
    document.getElementById('signin-button').addEventListener('click', function() {
      blockstack.redirectToSignIn()
    })
    ```

4. Wire up a sign out button.

    ```js
    document.getElementById('signout-button').addEventListener('click', function() {
      blockstack.signUserOut(window.location.origin)
    })
    ```

5. Include the logic to load user data and to handle the authentication
   response.

    ```js
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
      blockstack.handlePendingSignIn()
      .then(userData => {
        showProfile(userData.profile)
      })
    }
    ```

6. Create a `manifest.json` file

    ```json
    {
      "name": "Hello, Blockstack",
      "start_url": "localhost:5000",
      "description": "A simple demo of Blockstack Auth",
      "icons": [{
        "src": "https://helloblockstack.com/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      }]
    }
    ```

    Make sure your `manifest.json` file has appropriate CORS headers so that it
    can be fetched via an http `GET` from any origin.

7. Serve your application

## Add the library without a package manager

You can import `blockstack.js` as a script without using a package manager. To securely use the latest distribution of `blockstack.js` from a CDN, add the following `script` declaration in your application. 

[[include:script-dist-file.md]]
