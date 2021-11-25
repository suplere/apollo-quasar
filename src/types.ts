export interface ApolloConfig {
  clientId?: string;
  persisting?: boolean;
  link?: any;
  defaultHttpLink?: boolean;
  httpEndpoint: string;
  httpLinkConfig?: any;
  cache?: any;
  cacheConfig?: any;
  wsEndpoint: string;
  websocketsOnly?: boolean;
  clientState?: any;
  typeDefs?: any;
  resolvers?: any;
  additionalConfig?: any;
  onCacheInit?: any;
  tokenName?: string;
  getAuth?: any;
  apolloClientBeforeCreate?: any;
  apolloClientAfterCreate?: any;
}