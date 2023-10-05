---
title: FAQs
---

#### **What are Post Conditions?**

In computer programming, a post-condition is a condition (or a predicate) that must always be true just after the execution of some section of code or after an operation. And on Stacks, transactions are secured by post-conditions. Thus, if a post-condition check fails on a Clarity smart contract then the entire transaction is reverted.

In addition, the Stacks blockchain supports an "allow" or "deny" mode for evaluating post-conditions: in "allow" mode, other asset transfers not covered by the post-conditions are permitted, but in "deny" mode, no other asset transfers are permitted besides those named in the post-conditions.

Post-conditions are defined by the user being different from others safety features available in the Clarity Programming Language like __asserts__ and __try__.

#### **How to fix the regenerator-runtime?**

If using @stacks/connect with vite, rollup, svelte, or vue a package `regenerator-runtime` needs to be manually added to successfully build the project.

(Fix is in progress)

#### **How to fix the BigInt or how to fix if BigInt doesn’t support X?**

BigInt’s work in all modern browsers, but some bundlers try to optimize them incorrectly. If you are targeting browsers that are too outdated, BigInts might fail.
To solve this set your project `browserslist` to the following [package.json](https://github.com/hirosystems/stacks.js-starters/blob/efb93261b59494f4eb34a7cb5db5d82a84bd3b7c/templates/template-react/package.json#L34-L40)

