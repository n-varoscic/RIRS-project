// @ts-check
const js = require('@eslint/js')
const globals = require('globals')
const tseslint = require('typescript-eslint')
const { defineConfig, globalIgnores } = require('eslint/config')

module.exports = defineConfig([
  // Zgrajena koda in samodejno ustvarjen Prisma odjemalec se ne preverjata
  globalIgnores(['dist', 'src/generated']),
  {
    files: ['**/*.{ts,mts}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },
])
