import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * Note: we point at the SDL file in `server/` for local development.
 * Generated output is committed into `web/src/graphql/generated/` so Docker builds
 * do not need access to the server schema file.
 */
const config: CodegenConfig = {
  schema: '../server/src/graphql/schema.graphql',
  documents: ['src/**/*.{ts,tsx,graphql}'],
  config: {
    useTypeImports: true,
    enumsAsTypes: true,
  },
  generates: {
    'src/graphql/generated/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: false,
      },
      plugins: [],
    },
    'src/graphql/generated/urql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-urql'],
      config: {
        useTypeImports: true,
        withHooks: true,
        reactHooksVersion: 18,
        gqlImport: 'urql#gql',
        enumsAsTypes: true,
      },
    },
  },
  ignoreNoDocuments: false,
};

export default config;
