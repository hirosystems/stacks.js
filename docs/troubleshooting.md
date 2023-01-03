---
title: Troubleshooting
---

## Common Pitfall: regenerator-runtime

If using @stacks/connect with vite, rollup, svelte, or vue, a package `regenerator-runtime` needs to be manually added to build the project successfully.

`npm install --save-dev regenerator-runtime.`
