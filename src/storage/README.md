# Blockstack Storage

_Note: Blockstack Gaia Storage APIs and on-disk format will change in
upcoming pre-releases breaking backward compatibility. File encryption is currently
opt-in on a file by file basis._

_Certain storage features such as and collections are not implemented in the current
version. These features will be rolled out in future updates._

## Creating a file

```JavaScript
 blockstack.putFile("/hello.txt", "hello world!")
 .then(() => {
    // /hello.txt exists now, and has the contents "hello world!".
 })
```

## Reading a file

```JavaScript
 blockstack.getFile("/hello.txt")
 .then((fileContents) => {
    // get the contents of the file /hello.txt
    assert(fileContents === "hello world!")
 });
```

## Deleting a file

```JavaScript
 blockstack.deleteFile("/hello.txt")
 .then(() => {
    // /hello.txt is now removed.
 })
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

 blockstack.getFile("/message.txt", true, options)
 .then((fileContents) => {
    // get & decrypt the contents of the file /message.txt
    assert(fileContents === "Secret hello!")
 });
```

## Creating a publicly readable file

In order to create publicly readable files on behalf of the user, 
the app must request the `app_index` scope during authentication.

```JavaScript
 let options = { 
   public: true 
 }

 blockstack.putFile("/message.txt", "hello world!", options)
 .then(() => {
    // message.txt exists now, and has the contents "hello world!".
    // it is also listed in the user's app index file for your app
    // and is discoverable
 })
```

## Reading a public file of another user
```JavaScript
 let options = { 
   user: 'ryan.id', // the Blockstack ID of the user for which to lookup the file
   app: 'BlockstackApp.com' // origin of the app this file is stored for
 }

 blockstack.getFile("/message.txt", true, options)
 .then((fileContents) => {
    // get the contents of the file /message.txt
    assert(fileContents === "hello world!")
 });
```
