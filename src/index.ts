import { ApolloClient } from "apollo-client";
import { HttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import getApolloClientConfig from "./get-apollo-client-config";
import {
  apolloClientBeforeCreate,
  apolloClientAfterCreate,
} from "./apollo-client-hooks";

// function that returns an 'apollo client' instance
export function createApolloClient({
  app,
  router,
  store,
  urlPath,
  redirect,
  ssrContext,
}) {
  const cfg = getApolloClientConfig({
    app,
    router,
    store,
    urlPath,
    ssrContext,
    redirect,
  });

  // create apollo client link
  const link = new HttpLink(cfg.httpLinkConfig);

  // create apollo client cache
  const cache = new InMemoryCache(cfg.cacheConfig);

  // object that will be used to instantiate apollo client
  const apolloClientConfigObj = { link, cache, ...cfg.additionalConfig };

  // run hook before creating apollo client instance
  apolloClientBeforeCreate({
    apolloClientConfigObj,
    app,
    router,
    store,
    urlPath,
    redirect,
  });

  // create an `apollo client` instance
  const apolloClient = new ApolloClient(apolloClientConfigObj);

  // run hook after creating apollo client instance
  apolloClientAfterCreate({
    apolloClient,
    app,
    router,
    store,
    urlPath,
    redirect,
  });

  // return `apollo client` instance
  return apolloClient;
}
