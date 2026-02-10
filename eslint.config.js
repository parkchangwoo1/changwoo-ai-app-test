import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  // FSD: shared → entities, features, widgets, pages, app 금지
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@/entities', '@/entities/*'], message: 'FSD 위반: shared는 entities를 import할 수 없습니다.', allowTypeImports: true },
          { group: ['@/features', '@/features/*'], message: 'FSD 위반: shared는 features를 import할 수 없습니다.' },
          { group: ['@/widgets', '@/widgets/*'], message: 'FSD 위반: shared는 widgets를 import할 수 없습니다.' },
          { group: ['@/pages', '@/pages/*'], message: 'FSD 위반: shared는 pages를 import할 수 없습니다.' },
          { group: ['@/app', '@/app/*'], message: 'FSD 위반: shared는 app을 import할 수 없습니다.' },
        ],
      }],
    },
  },

  // FSD: entities → features, widgets, pages, app 금지
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@/features', '@/features/*'], message: 'FSD 위반: entities는 features를 import할 수 없습니다.' },
          { group: ['@/widgets', '@/widgets/*'], message: 'FSD 위반: entities는 widgets를 import할 수 없습니다.' },
          { group: ['@/pages', '@/pages/*'], message: 'FSD 위반: entities는 pages를 import할 수 없습니다.' },
          { group: ['@/app', '@/app/*'], message: 'FSD 위반: entities는 app을 import할 수 없습니다.' },
        ],
      }],
    },
  },

  // FSD: features → widgets, pages, app 금지
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@/widgets', '@/widgets/*'], message: 'FSD 위반: features는 widgets를 import할 수 없습니다.' },
          { group: ['@/pages', '@/pages/*'], message: 'FSD 위반: features는 pages를 import할 수 없습니다.' },
          { group: ['@/app', '@/app/*'], message: 'FSD 위반: features는 app을 import할 수 없습니다.' },
        ],
      }],
    },
  },

  // FSD: widgets → pages, app 금지
  {
    files: ['src/widgets/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@/pages', '@/pages/*'], message: 'FSD 위반: widgets는 pages를 import할 수 없습니다.' },
          { group: ['@/app', '@/app/*'], message: 'FSD 위반: widgets는 app을 import할 수 없습니다.' },
        ],
      }],
    },
  },

  // FSD: pages → app 금지
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@/app', '@/app/*'], message: 'FSD 위반: pages는 app을 import할 수 없습니다.' },
        ],
      }],
    },
  },
])
