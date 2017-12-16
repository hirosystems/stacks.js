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
 blockstack.putFile("/message.txt", "Secret hello!", true)
 .then(() => {
    // message.txt exists now, and has the contents "hello world!".
 })
```

## Reading an encrypted file

```JavaScript
 blockstack.getFile("/message.txt", true)
 .then((fileContents) => {
    // get & decrypt the contents of the file /message.txt
    assert(fileContents === "Secret hello!")
 });
```
