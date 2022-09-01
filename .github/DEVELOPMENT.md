## Adding dependencies

This repo uses Lerna [hoisting](https://github.com/lerna/lerna/blob/main/doc/hoist.md) for package dependencies.

In order to install a new dependency to a package, the [`lerna add`](https://github.com/lerna/lerna/tree/main/commands/add) command must be used, rather than `npm install <package>`.

For example, the following command installs `lodash` as a dependency to the `@stacks/storage` package:

```shell
# Run within the root directory
npx lerna add lodash --scope @stacks/storage
```

Add `--dev` to install as a development dependency:

```shell
npx lerna add lodash --scope @stacks/storage --dev
```
