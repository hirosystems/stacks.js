# Blockstack Storage

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
