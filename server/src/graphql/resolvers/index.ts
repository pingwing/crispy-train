import type { Resolvers } from '../types';

export const resolvers: Resolvers = {
  Query: {
    _health: async () => 'ok',
  },
};


