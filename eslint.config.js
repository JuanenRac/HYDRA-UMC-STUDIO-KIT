// =============================================================================
// HYDRA-UMC-STUDIO-KIT - eslint.config.js
// Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
// GPL-3.0-or-later - see LICENSE
// =============================================================================
// `npm run lint`: the recommended rules for JavaScript and TypeScript. The type checker (`npm run typecheck`) stays the place for type errors, so the
// rules that need type information are not switched on here. The package must not depend on a framework: importing React is an error.
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'no-restricted-imports': ['error', { patterns: ['react', 'react/*', 'react-dom', 'react-dom/*'] }],
    },
  },
  {
    // the tests build partial fakes of fetch and of the storage; typing every one would hide what they check
    files: ['tests/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: { ...globals.node } },
  },
)
