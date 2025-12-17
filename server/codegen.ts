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
          // Note: this file is generated into `src/graphql/generated/`, so entities are 2 levels up.
          Store: '../../db/entities#Store',
          Product: '../../db/entities#Product',
          InventoryItem: '../../db/entities#InventoryItem',
        },
      },
    },
  },
};

export default config;


