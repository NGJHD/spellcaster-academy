import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default defineConfig(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.strict, reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    // R3F scene code mutates three.js objects imperatively inside useFrame by design (CLAUDE.md §4.4),
    // which the React Compiler immutability rule cannot distinguish from mutating React state.
    files: ['src/scene/**/*.{ts,tsx}', 'src/enemies/**/*.{ts,tsx}', 'src/player/**/*.{ts,tsx}', 'src/spells/**/*.{ts,tsx}'],
    rules: { 'react-hooks/immutability': 'off' },
  },
);
