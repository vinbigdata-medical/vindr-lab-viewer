## Install

> This component library is pre- v1.0. All realeases until a v1.0 have the
> possibility of introducing breaking changes. Please depend on an "exact"
> version in your projects to prevent issues caused by loose versioning.

```bash
// with npm
npm i @ohif/ui --save-exact

// with yarn
yarn add @ohif/ui --exact
```

## Usage

```jsx
import React, { Component } from 'react';
import { LayoutButton } from '@ohif/ui';

class Example extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedCell: {
        className: 'hover',
        col: 1,
        row: 1,
      },
    };
  }

  render() {
    return (
      <LayoutButton
        selectedCell={this.state.selectedCell}
        onChange={cell => this.setState({ selectedCell: cell })}
      />
    );
  }
}
```

## Developing Locally

_Restore dependencies after cloning:_

```bash
# Restore workspace dependencies (from repository root)
yarn install

# From project root
yarn run dev:ui

# OR from this project's directory
yarn run dev

```
