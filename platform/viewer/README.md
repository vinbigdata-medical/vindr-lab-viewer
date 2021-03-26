### Setup

_Requirements:_

- [NodeJS & NPM](https://nodejs.org/en/download/)
- [Yarn](https://yarnpkg.com/lang/en/docs/install/)

_Steps:_

1. Fork this repository
2. Clone your forked repository (your `origin`)

- `git clone git@github.com:YOUR_GITHUB_USERNAME/vinlab-viewers.git`

3. Add this repo as a `remote` named `upstream`

- `git remote add upstream https://github.com/vinbigdata-medical/vinlab-viewers.git`

### Developing Locally

In your cloned repository's root folder, run:

```js
// Restore dependencies
yarn install

// Stands up local server to host Viewer.
// Viewer connects to our public cloud PACS by default
yarn start
```

### E2E Tests

Using [Cypress](https://www.cypress.io/) to create End-to-End tests and check
whether the application flow is performing correctly, ensuring that the
integrated components are working as expected.

#### Why Cypress?

Cypress is a next generation front end testing tool built for the modern web.
With Cypress is easy to set up, write, run and debug tests

It allow us to write different types of tests:

- End-to-End tests
- Integration tests
- Unit tets

All tests must be in `./cypress/integration` folder.

Commands to run the tests:

```js
// Open Cypress Dashboard that provides insight into what happened when your tests ran
yarn test:e2e

// Run all tests using Electron browser headless
yarn test:e2e:local

// Run all tests in CI mode
yarn run test:e2e:ci
```
