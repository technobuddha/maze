<!-- markdown-lint-disable MD041
     🚨
     🚨 CHANGES TO THIS FILE WILL BE OVERRIDDEN
     🚨
-->

# Agents

## Unit Testing

- All unit tests are run using Vitest.
- There is no need to import `describe`, `test`, or `expect` from "vitest", they are defined using tsconfig "types" field.
- Tests should be placed in the `__tests__` folder next to the code being tested.
- Test files should be named with a `.test.ts` or `.test.tsx` suffix.
- Use a `describe` block to group tests for a specific functionality (e.g. function or class).
  The describe block should be named after the functionality being tested.
- The `expect` method is extended with `jest-extended` and `jest-matcher-deep-close-to`
- `toBeTrue()` and `toBeFalse()` are preferred over `toBe(true)` and `toBe(false)`

## Documentation

- All Functions, Classes, Types, Interfaces and Constants are documented using [TypeDoc](https://typedoc.org/).
- Documentation should either include a `@group` and `@category` tag or be marked as @internal.
- Types and Interfaces document their properties as comments above the property definition. Not as a `@property` tag.
- Type arguments are documents with `@typeParam` not `@template`
- When asked to add documentation (for instance the simple command `doc` which should document the
  current file). No changes should be made to code, only comments.
- Do not remove eslint disable comments when adding documentation.
- **For functions with destructured parameters, document ONLY the main parameter with a single `@param` tag. Do NOT use nested `@param` tags like `@param options.entrance`. Instead, document the parameter structure using inline comments within the type definition or method signature.**

## Code

- Do not use `any`. Use a better type, or `unknown`
