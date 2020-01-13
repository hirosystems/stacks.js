module.exports = {
  "extends": [
    "eslint:recommended",
    "airbnb-base",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier/@typescript-eslint"

  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json",
    "tsconfigRootDir": __dirname
  },
  "plugins": [
    "import",
    "@typescript-eslint"
  ],
  "settings": {
    "import/parsers": {
      "@typescript-eslint/parser": [ ".ts" ]
    },
    "import/resolver": { "typescript": {} }
  },
  "env": {
    "browser": true,
    "node": true
  },
  "rules": {
    "no-tabs": 0,
    "no-restricted-globals": 0,
    "no-buffer-constructor": 0,
    "no-mixed-operators": 0,
    "no-plusplus": 0,
    "no-bitwise": 0,
    "prefer-promise-reject-errors": 0,
    "class-methods-use-this": 0,
    "prefer-destructuring": 0,
    "no-prototype-builtins": 0,
    "comma-dangle": "off",
    "quotes": [2, "single"],
    "eol-last": 2,
    "no-debugger": 1,
    "no-mixed-requires": 0,
    "no-underscore-dangle": 0,
    "no-multi-spaces": 0,
    "no-trailing-spaces": 0,
    "no-extra-boolean-cast": 0,
    "no-undef": 2,
    "no-var": 2,
    "no-param-reassign": 0,
    "no-else-return": 0,
    "no-console": 0,
    "prefer-const": 2,
    "new-cap": 0,
    "semi": 0,
    "valid-jsdoc": "off",
    "object-curly-newline": "off",    
    "arrow-parens": "off",
    "function-paren-newline": 0,
    "max-classes-per-file": "off",
    "prefer-object-spread": "off",
    "no-multiple-empty-lines": "off",
    "no-shadow": "off",
    "no-use-before-define": "off",
    "no-return-await": "off",
    "no-useless-constructor": "off",
    "indent": [2, 2, {
      "FunctionDeclaration" : { "parameters": "first" },
      "FunctionExpression" : { "parameters": "first" },
      "ObjectExpression": "first",
      "ArrayExpression": "first",
      "ImportDeclaration": "first",
      "CallExpression": { "arguments": "first" }
    }],
    "@typescript-eslint/explicit-member-accessibility": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/class-name-casing": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/member-delimiter-style": "off",
    "@typescript-eslint/no-angle-bracket-type-assertion": "off",
    "@typescript-eslint/prefer-interface": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/ban-ts-ignore": "off",
    "@typescript-eslint/consistent-type-assertions": "off",
    "@typescript-eslint/prefer-regexp-exec": "off",
    "@typescript-eslint/no-useless-constructor": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/require-await": "error",
    "@typescript-eslint/await-thenable": "error",


    // TODO: enable these when reasonable
    "@typescript-eslint/promise-function-async": "off",
    "@typescript-eslint/prefer-includes": "off",
    "@typescript-eslint/prefer-string-starts-ends-with": "off",
    // ---


    "import/no-unresolved": "error",
    "import/named": "error",
    "import/prefer-default-export": "off",

    // TODO: enable these when reasonable -- these can help module dependencies be easier to bundle w/ tree-shaking.
    "import/no-cycle": "off",
    // ---

    "import/no-self-import": "error",
    "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
    "import/no-unused-modules": ["error", { "missingExports": true }],
    "import/export": "error",
    "import/no-extraneous-dependencies": "error",
    "import/no-duplicates": "error",
    "import/no-unassigned-import": "error",
    "import/order": "error",

    "import/no-nodejs-modules": ["error", { "allow": [

    ]}],

    // ---- Enforce some blockstack.js specific rules ----

    "no-restricted-globals": ["error", {
        "name": "fetch",
        "message": "Use `privateFetch` instead."
      }
    ],

    "no-restricted-modules": ["error", {
        "name": "crypto",
        "message": "Use a specific module from `./src/encryption/` "
      }
    ]

    // ----
  }
}
