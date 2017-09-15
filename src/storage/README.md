# Blockstack Storage

_Note: Blockstack Gaia Storage APIs and on-disk format will change in
upcoming pre-releases breaking backward compatibility. Certain storage features
such as file encryption and collections are not implemented in the current
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
