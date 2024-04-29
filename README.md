# Prebundle

Prebundle 3rd party dependencies, output a single js file, a package.json file and the dts files.

Based on [ncc](https://github.com/vercel/ncc) and [rollup-plugin-dts](https://www.npmjs.com/package/rollup-plugin-dts).

<p>
  <a href="https://npmjs.com/package/prebundle">
   <img src="https://img.shields.io/npm/v/prebundle?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
</p>

## Motivation

Prebundle is used to:

- Reduce dependencies of core packages, install faster.
- Improve stability by locking the sub-dependency version .
- Fix peer dependency warning of some packages.

## Command

Run following command to prebundle all dependencies:

```bash
npx prebundle
```

Run following command to prebundle single dependencies:

```bash
npx prebundle <pkgName>

# For example, prebundle commander
npx prebundle commander
```

## Dependency Config

Supported dependency config:

### externals

Externals to leave as requires of the build.

```ts
// prebundle.config.mjs
export default {
  dependencies: [
    {
      name: 'foo',
      externals: {
        webpack: '../webpack',
      },
    },
  ],
};
```

You can also configure `externals` for all packages like this:

```ts
// prebundle.config.mjs
export default {
  externals: {
    webpack: '../webpack',
  },
  dependencies: [{ name: 'foo' }, { name: 'foo' }],
};
```

### dtsExternals

Externals for dts.

```ts
// prebundle.config.mjs
export default {
  dependencies: [
    {
      name: 'foo',
      dtsExternals: ['webpack'],
    },
  ],
};
```

### minify

Whether to minify the code, default `false`.

```ts
// prebundle.config.mjs
export default {
  dependencies: [
    {
      name: 'foo',
      minify: false,
    },
  ],
};
```

### packageJsonField

Copy extra fields from original package.json to target package.json.

```ts
// prebundle.config.mjs
export default {
  dependencies: [
    {
      name: 'foo',
      packageJsonField: ['options'],
    },
  ],
};
```

Following fields will be copied by default:

- `name`
- `author`
- `version`
- `funding`
- `license`
- `types`
- `typing`
- `typings`

### beforeBundle

Callback before bundle.

```ts
// prebundle.config.mjs
export default {
  dependencies: [
    {
      name: 'foo',
      beforeBundle(task) {
        console.log('do something');
      },
    },
  ],
};
```

### emitFiles

Emit extra entry files to map imports.

```ts
// prebundle.config.mjs
export default {
  dependencies: [
    {
      name: 'foo',
      emitFiles: [
        {
          path: 'foo.js',
          content: `module.exports = require('./').foo;`,
        },
      ],
    },
  ],
};
```

### ignoreDts

Ignore the original .d.ts declaration file, then generate a fake .d.ts file.

This can be used to reduce file size for the packages that do not require type definitions, such as webpack plugin.

```ts
// prebundle.config.mjs
export default {
  dependencies: [
    {
      name: 'foo',
      ignoreDts: true,
    },
  ],
};
```

### target

Target ECMAScript version, default `es2021`.

```ts
// prebundle.config.mjs
export default {
  dependencies: [
    {
      name: 'foo',
      target: 'es2015',
    },
  ],
};
```
