// Airbnb JavaScript style guide (https://github.com/airbnb/javascript),
// via its official config, eslint-config-airbnb-base.
// .cjs because package.json sets "type": "module".
module.exports = {
  root: true,
  extends: ['airbnb-base'],
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    // airbnb-base targets ES2018; the code uses top-level await, ??, ?. and ??=
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  // Each override below is a conflict with Node or Mongoose, not a style
  // preference. Everything else is Airbnb as published.
  rules: {
    // Airbnb wants './app' without '.js' (a bundler/CommonJS convention).
    // Node's ES modules require the extension, so keep it.
    'import/extensions': ['error', 'ignorePackages', { js: 'always' }],
    // The import plugin can't read package.json "exports" maps, so it thinks
    // dotenv/config doesn't exist. It does.
    'import/no-unresolved': [
      'error',
      { commonjs: true, caseSensitive: true, ignore: ['^dotenv/config$'] },
    ],
    // _id and __v are MongoDB/Mongoose field names; we can't rename them.
    'no-underscore-dangle': [
      'error',
      {
        allow: ['_id', '__v'],
        allowAfterThis: false,
        allowAfterSuper: false,
        enforceInMethodNames: true,
      },
    ],
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      env: { jest: true },
    },
  ],
};
