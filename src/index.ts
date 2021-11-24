import { ApolloClient } from "apollo-client";
import { HttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import getApolloClientConfig from "./get-apollo-client-config";
import {
  apolloClientBeforeCreate,
  apolloClientAfterCreate,
} from "./apollo-client-hooks";

// function that returns an 'apollo client' instance
// context {
//   app,
//   router,
//   store,
//   urlPath,
//   redirect,
//   ssrContext = null,
//   hbp
// }
export function createApolloClient(context) {
  const cfg = getApolloClientConfig(context);

  // create apollo client link
  const link = new HttpLink(cfg.httpLinkConfig);

  // create apollo client cache
  const cache = new InMemoryCache(cfg.cacheConfig);

  // object that will be used to instantiate apollo client
  const apolloClientConfigObj = { link, cache, ...cfg.additionalConfig };

  // run hook before creating apollo client instance
  apolloClientBeforeCreate({
    apolloClientConfigObj,
    ...context
  });

  // create an `apollo client` instance
  const apolloClient = new ApolloClient(apolloClientConfigObj);

  // run hook after creating apollo client instance
  apolloClientAfterCreate({
    apolloClient,
    ...context,
  });

  // return `apollo client` instance
  return apolloClient;
}
