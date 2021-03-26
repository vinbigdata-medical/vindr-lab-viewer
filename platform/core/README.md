<!-- prettier-ignore-start -->
This library offers pre-packaged solutions for features common to Web-based
medical imaging viewers. For example:

- Hotkeys
- DICOM Web
- Hanging Protocols
- Managing a study's measurements
- Managing a study's DICOM metadata
- A flexible pattern for extensions
- And many others

It does this while remaining decoupled from any particular view library or
rendering logic.

### Install

> This library is pre- v1.0. All realeases until a v1.0 have the possibility of
> introducing breaking changes. Please depend on an "exact" version in your
> projects to prevent issues caused by loose versioning.

```
// with npm
npm i @ohif/core --save-exact

// with yarn
yarn add @ohif/core --exact
```

### Usage

Usage is dependent on the feature(s) you want to leverage. The bulk of
`@ohif/core`'s features are "pure" and can be imported and used in place.

_Example: retrieving study metadata from a server_

```js
import { studies } from '@ohif/core';

const studiesMetadata = await studies.retrieveStudiesMetadata(
  server, // Object
  studyInstanceUIDs, // Array
  seriesInstanceUIDs // Array (optional)
);
```

<!-- prettier-ignore-end -->
