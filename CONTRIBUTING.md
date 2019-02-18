# Maintainers
This repo is currently maintained by Ken Liao (@yknl). 

# Issues
Github issues marked [help-wanted](https://github.com/blockstack/blockstack.js/labels/help-wanted)
are great places to start. Please ask in a github issue or slack before embarking
on larger issues that aren't labeled as help wanted or adding additional
functionality so that we can make sure your contribution can be included!

# Pull Request 

## Submitting
This repository uses the [git flow branching mode](http://nvie.com/posts/a-successful-git-branching-model/).

The latest released code as deployed to npm is in `master` and the latest delivered development
changes for the next release are in `develop`.

We use the [git-flow-avh](https://github.com/petervanderdoes/gitflow-avh) plugin.

Pull request requirements:

1. Describe exactly what the goal of the PR is (and link to any relevant issues)
2. Describe how that goal was achieved through the submitted implementation.
3. The code must be lint-free and pass the unit tests by running `$ npm run test`
4. The code should contain [flow static type annotations](https://flow.org)
5. Contain tests that cover any and all new functionality or code changes.
6. Describe how the new functionality can be tested manually.
7. Document any new features or endpoints, and describe how developers would be expected to interact with them. 
8. PR authors should agree to our contributor's agreement.

## Reviewers
Ken Liao (@yknl)
Hank Stoever (@hstove)
Aaron Blankstein (@kantai)
Matthew Little (@zone117x)

All pull requests require at least 2 reviewer approvals before it can be merged.

# Documentation
Documentation in this repo is automatically generated from code comments via `documentation.js`. It is the responsibility of the pull request author to verify documentation builds correctly. 

# Reviewing Pull Requests
A PR reviewer is responsible for ensuring the following:

1. All code changes are covered by automated tests. 

2. Authentication and Gaia storage continues to work properly when integrated in both the Blockstack Browser and apps.

3. Compatibility breaking changes are documented.