import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/graphql/schema.graphql',
  generates: {
    'src/graphql/generated/resolvers-types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        useTypeImports: true,
        contextType: '../types#GraphQLContext',
        mappers: {
          // Map GraphQL types to domain classes (avoid collisions with schema type names).
          Store: '../../domain#StoreDomain',
          Product: '../../domain#ProductDomain',
          InventoryItem: '../../domain#InventoryItemDomain',
        },
      },
    },
  },
};

export default config;


