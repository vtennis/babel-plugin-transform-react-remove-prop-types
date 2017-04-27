# babel-plugin-transform-react-remove-prop-types

> Remove unnecessary React propTypes from the production build.

[![npm version](https://img.shields.io/npm/v/babel-plugin-transform-react-remove-prop-types.svg?style=flat-square)](https://www.npmjs.com/package/babel-plugin-transform-react-remove-prop-types)
[![npm downloads](https://img.shields.io/npm/dm/babel-plugin-transform-react-remove-prop-types.svg?style=flat-square)](https://www.npmjs.com/package/babel-plugin-transform-react-remove-prop-types)
[![Build Status](https://travis-ci.org/oliviertassinari/babel-plugin-transform-react-remove-prop-types.svg?branch=master)](https://travis-ci.org/oliviertassinari/babel-plugin-transform-react-remove-prop-types)

[![Dependencies](https://img.shields.io/david/oliviertassinari/babel-plugin-transform-react-remove-prop-types.svg?style=flat-square)](https://david-dm.org/oliviertassinari/babel-plugin-transform-react-remove-prop-types)
[![DevDependencies](https://img.shields.io/david/dev/oliviertassinari/babel-plugin-transform-react-remove-prop-types.svg?style=flat-square)](https://david-dm.org/oliviertassinari/babel-plugin-transform-react-remove-prop-types#info=devDependencies&view=list)

## Installation

```sh
npm install --save-dev babel-plugin-transform-react-remove-prop-types
```

## The problem solved

Remove React `propTypes` from the production build, as they are only used in development.
You can **save bandwidth** by removing them.

## Example

**In**
```jsx
const Baz = (props) => (
  <div {...props} />
);

Baz.propTypes = {
  className: PropTypes.string
};
```

**Out**
```jsx
const Baz = (props) => (
  <div {...props} />
);
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

without options:
```json
{
  "env": {
    "production": {
      "plugins": ["transform-react-remove-prop-types"]
    }
  }
}
```

with options:
```json
{
  "env": {
    "production": {
      "plugins": [
        ["transform-react-remove-prop-types", {
          "mode": "wrap",
          "ignoreFilenames": ["node_modules"]
        }]
      ]
    }
  }
}
```

### Via CLI

```sh
babel --plugins transform-react-remove-prop-types script.js
```

### Via Node API

without options:
```js
require('babel-core').transform('code', {
  plugins: [
    'transform-react-remove-prop-types',
  ],
});
```

with options:
```js
require('babel-core').transform('code', {
  plugins: [
    [
      'transform-react-remove-prop-types',
      {
        mode: 'wrap',
        ignoreFilenames: ['node_modules'],
      },
    ],
  ],
});
```

## Options

### `mode`

 - `remove` (default):
the `propTypes` definitions are removed from the source code.
 - `wrap`:
the `propTypes` definitions are wrapped with the following code:
```js
Component.propTypes = process.env.NODE_ENV !== "production" ? {
  // ...
} : {};
```
Accessing `Component.propTypes.className` won't throw. It's a tradeoff between the size of the output file and the likelihood libraries like [react-native-hyperlink](https://github.com/obipawan/react-native-hyperlink/pull/11) breaks.
 - `unsafe-wrap`:
the `propTypes` definitions are wrapped with the following code:
```js
if (process.env.NODE_ENV !== "production") {
  Component.propTypes = {
    // ...
  }
}
```
Accessing `Component.propTypes.className` will throw.

The *wrap* modes are targeting React libraries like [material-ui](https://github.com/callemall/material-ui) or [react-native-web](https://github.com/necolas/react-native-web).
They are not intended to be used by application authors.

### `removeImport`

 - `true`: the import statements are removed as well. This option only works if `mode` is set to `remove`:
```js
import PropTypes from 'prop-types'
```
 - `false` (default): does not remove the import statements.

### `ignoreFilenames`

This filter generates a regular expression.
Any filenames containing one of the array's strings will be ignored.
By **default**, we match everything.

Following the [Is it safe?](#user-content-is-it-safe) section, you might encounter a component
depending on the `propTypes` at runtime to work.
For this reason, we provide an array options to filter out some files and folders.
For instance, you can ignore all the npm modules:
```js
ignoreFilenames: ['node_modules'],
```

### `additionalLibraries`

This option gives the possibility to remove other `propTypes` in addition to the canonical `prop-types`.

For instance, by default
```js
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
```
will result in the latter not to be removed, while with:
```js
additionalLibraries: ['react-immutable-proptypes'],
```
both will be removed.


## Is it safe?

If you are using the `propTypes` in a conventionnal way,
i.e by using them to perform type checking on the properties, that plugin should be **safe to use**.

However, some libraries are accessing the `propTypes` on the component directly.
For instance [react-native-vector-icons](https://github.com/oblador/react-native-vector-icons/blob/3d1f2a5b7175d6e4c8985676940240776543ff60/lib/icon-button.js#L59) use them to split the properties between two components:
```js
const touchableProps = pick(restProps, Object.keys(TouchableHighlight.propTypes));
```
:warning: The plugin is breaking that code if he end-up removing `TouchableHighlight.propTypes`.

Make sure you are:
- Not using that pattern in your souce code.
If you do, explicitly **export** the `propTypes` to work around that limitation.
- Not parsing the `node_modules`.
If you do, test that your code is still working before shipping into production.

[eslint-plugin-react has a rule forbid-foreign-prop-types](https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/forbid-foreign-prop-types.md) that can help you make this plugin safer to use.

## License

MIT
