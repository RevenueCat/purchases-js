# RCBilling JS

JS SDK for RC Billing.

# Development

## Install the library in a local project

- Clone the repository
- Install dependencies
- Build the library

```bash
npm install
npm run build:dev
```

Then in your local project you can do:

```bash
npm i ../path/to/rcbilling-js
```

## Running tests

```bash
npm test
```

# Publishing a new version

- Update the version in `package.json`
- Add a new entry in `CHANGELOG.md` including all the PR merged and crediting the authors
- Commit the changes in main
- Create a new tag with the version number and push:

```
git tag v[version_number]
git push origin v[version_number]
```
