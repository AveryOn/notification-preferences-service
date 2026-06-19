import eslint from '@eslint/js'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '.nyc_output/',
      '.vitest/',
      '.husky/**',
      'test-results/',
      'drizzle/meta/_journal.json',
      'logs/',
      'docker-data/',
      'postgres-data/',
      'tmp/',
      'temp/',
      '.cache/**'
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'eslint.config.ts',
            'tsup.config.ts',
            'drizzle.config.ts',
            'scripts/generate-project-source.mjs',
            'scripts/run-seed.ts'
          ]
        },
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports'
        }
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off'
    }
  }
)
