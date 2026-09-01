import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    '.claude/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // ExtendScript for Adobe Illustrator, not JavaScript/JSX — the `.jsx` extension is what the
    // Illustrator scripting host expects, and ESLint has no dialect for its syntax.
    'data/bulletin-import/extractor/extract-text-frames.jsx',
  ]),
])

export default eslintConfig
