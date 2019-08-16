# Pull Request Template

## Description

Describe the changes that where made in this pull request. When possible start with a user story - short, simple descriptions of a feature told from the perspective of the person who desires the new capability. Be sure to also include the following information:


1. Motivation for change
2. What was changed
3. How does this impact application developers
4. Link to relevant issues and documentation
5. Provide examples of use cases with code samples and applicable acceptance criteria

Example:
*As a Blockstack developer, I would like to encrypt files using the app private key. This is needed because storing unencrypted files is unacceptable. This pull request adds the* `*encryptContent*` *function which will take a string and encrypt it using the app private key.

```
encryptContent('my data')

// Running the above should result in the following encrypted data object
{"iv":"c927faf8a37288a7787d5252fca1a1de",  "ephemeralPK":"03186eb470dc0060db7addf642dc0a8d4b5a35649ac2f971058db34ef8a7e81208","cipherText":"d614d629a66b49b470966aa59ae49d17","mac":"8868c09614a6e6921561fbd564658b68844303d3f68d2ce0817d93ee9fe7354c","wasString":true}
```

For details refer to issue #123* 


## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] API reference/documentation update
- [ ] Other


## Does this introduce a breaking change?
List the APIs or describe the functionality that this PR breaks.
Workarounds for or expected timeline for deprecation

## Are documentation updates required?
## Testing information

Provide context on how tests should be performed.

1. Is testing required for this change?
2. If it’s a bug fix, list steps to reproduce the bug
3. Briefly mention affected code paths
4. List other affected projects if possible
5. Things to watch out for when testing

## Checklist
- [ ] Code is commented where needed
- [ ] Unit test coverage for new or modified code paths
- [ ] `npm run test` passes
- [ ] Changelog is updated
- [ ] Tag 1 of @yknl or @zone117x for review