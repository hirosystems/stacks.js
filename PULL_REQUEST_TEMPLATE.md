# Pull Request Template

## Description

Describe the changes that where made in this pull request. When possible start with a user story - short, simple descriptions of a feature told from the perspective of the person who desires the new capability. Be sure to also include the following information:


1. Motivation for change
2. What was changed
3. How does this impact application developers
4. Link to relevant issues and documentation
5. Code examples for new API functions 

Example:
*As a Blockstack developer, I would like to encrypt files using the app private key. This is needed because storing unencrypted files is unacceptable. This pull request adds the* `*encryptContent*` *function which will take a string and encrypt it using the app private key. For details refer to issue #123* 


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