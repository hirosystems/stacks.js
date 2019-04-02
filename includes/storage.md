## Work with Storage

> **Notes**:

> 1) Blockstack Gaia Storage APIs and on-disk format will change in
upcoming pre-releases breaking backward compatibility. File encryption is currently
opt-in on a file by file basis.

>2) Certain storage features such as and collections are not implemented in the current
version. These features will be rolled out in future updates.

## Creating a file

```JavaScript
let options = {
  encrypt: false
}
 blockstack.putFile("/hello.txt", "hello world!", options)
 .then(() => {
    // /hello.txt exists now, and has the contents "hello world!".
 })
```

## Reading a file

```JavaScript
 let options = {
   decrypt: false
 }
 
 blockstack.getFile("/hello.txt", options)
 .then((fileContents) => {
    // get the contents of the file /hello.txt
    assert(fileContents === "hello world!")
 });
```

## Creating an encrypted file

```JavaScript
 let options = {
   encrypt: true
 }

 blockstack.putFile("/message.txt", "Secret hello!", options)
 .then(() => {
    // message.txt exists now, and has the contents "hello world!".
 })
```

## Reading an encrypted file

```JavaScript
 let options = {
   decrypt: true
 }

 blockstack.getFile("/message.txt", options)
 .then((fileContents) => {
    // get & decrypt the contents of the file /message.txt
    assert(fileContents === "Secret hello!")
 });
```

## Reading another user's unencrypted file
In order for files to be publicly readable, the app must request
the `publish_data` scope during authentication.

```JavaScript
 let options = {
   user: 'ryan.id', // the Blockstack ID of the user for which to lookup the file
   app: 'http://BlockstackApp.com' // origin of the app this file is stored for
 }

 blockstack.getFile("/message.txt", options)
 .then((fileContents) => {
    // get the contents of the file /message.txt
    assert(fileContents === "hello world!")
 });
```

## Deleting a file

_Note: deleteFile is currently not implemented. For now, we recommend
writing an empty file to wipe data_

```JavaScript
 blockstack.deleteFile("/hello.txt")
 .then(() => {
    // /hello.txt is now removed.
 })
```
