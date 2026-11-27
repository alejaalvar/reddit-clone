// Airbnb JavaScript style guide, React version (eslint-config-airbnb),
// matching backend/.eslintrc.cjs. .cjs because package.json sets "type": "module".
module.exports = {
  root: true,
  extends: ['airbnb', 'airbnb/hooks'],
  env: {
    browser: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: ['dist'],
  rules: {
    // Same as the backend: keep the extension on relative imports (Vite needs .jsx)
    'import/extensions': [
      'error',
      'ignorePackages',
      { js: 'always', jsx: 'always' },
    ],
    // The import plugin can't read package.json "exports" maps, so it wrongly
    // flags packages like vite and react-router. Check only our own relative
    // imports; Vite already fails the build if a package import is wrong.
    'import/no-unresolved': ['error', { ignore: ['^[^./]'] }],
    // React 17+ JSX transform: no need to import React in every file
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    // React 19 ignores propTypes, so these would add boilerplate that does nothing
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
  },
  overrides: [
    {
      // Test files and test helpers may import devDependencies (Vitest, Testing Library)
      files: ['src/test/**', '**/*.test.{js,jsx}'],
      rules: {
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      },
    },
  ],
};
