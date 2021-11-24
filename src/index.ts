import { ApolloClient } from "apollo-client";
import { split, from } from "apollo-link";
import { createUploadLink } from "apollo-upload-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { SubscriptionClient } from "subscriptions-transport-ws";
import MessageTypes from "subscriptions-transport-ws/dist/message-types";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import { createPersistedQueryLink } from "apollo-link-persisted-queries";
import { setContext } from "apollo-link-context";
import { withClientState } from "apollo-link-state";
import getApolloClientConfig from "./get-apollo-client-config";
import {
  apolloClientBeforeCreate,
  apolloClientAfterCreate,
} from "./apollo-client-hooks";
import { OperationDefinitionNode } from "graphql";



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
export function createApolloClient(context, config) {
  const { app, router, store, urlPath, redirect, hbp } = context;
  const cfg = getApolloClientConfig({
    app,
    router,
    store,
    urlPath,
    redirect,
    hbp,
  });

  let { link, persisting } = cfg;

  const httpEndpoint = config.httpEndpoint || cfg.httpEndpoint;
  const wsEndpoint = config.wsEndpoint || cfg.wsEndpoint || null;

  let wsClient, authLink, stateLink;
  const disableHttp = cfg.websocketsOnly && wsEndpoint;

  // Apollo cache
  const cache = cfg.cache ? cfg.cache : new InMemoryCache(cfg.cacheConfig);

  if (!disableHttp) {
    const httpLink = createUploadLink({
      uri: httpEndpoint,
      ...cfg.httpLinkConfig,
    });

    if (!link) {
      link = httpLink;
    } else if (cfg.defaultHttpLink) {
      link = from([link, httpLink]);
    }

    // HTTP Auth header injection
    authLink = setContext((_, { headers }) => {
      const authorization = cfg.getAuth(hbp);
      const authorizationHeader = authorization ? { authorization } : {};
      return {
        headers: {
          ...headers,
          ...authorizationHeader,
        },
      };
    });

    // Concat all the http link parts
    link = authLink.concat(link);
  }

  // On the server, we don't want WebSockets and Upload links
  if (!cfg.ssr) {
    // If on the client, recover the injected state
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-underscore-dangle
      const state = window["__APOLLO_STATE__"] || null;
      if (state && state[cfg.clientId]) {
        // Restore state
        cache.restore(state[cfg.clientId]);
      }
    }

    if (!disableHttp) {
      let persistingOpts = {};
      if (typeof persisting === "object" && persisting != null) {
        persistingOpts = persisting;
        persisting = true;
      }
      if (persisting === true) {
        link = createPersistedQueryLink(persistingOpts).concat(link);
      }
    }

    // Web socket
    if (wsEndpoint) {
      wsClient = new SubscriptionClient(wsEndpoint, {
        reconnect: true,
        connectionParams: () => {
          const authorization = cfg.getAuth(hbp);
          // console.log(authorization)
          return authorization
            ? { authorization, headers: { authorization } }
            : {};
        },
      });
      // console.log(wsClient)
      // Create the subscription websocket link
      const wsLink = new WebSocketLink(wsClient);

      if (disableHttp) {
        link = wsLink;
      } else {
        link = split(
          // split based on operation type
          ({ query }) => {
            const { kind, operation } = getMainDefinition(
              query
            ) as OperationDefinitionNode;
            return (
              kind === "OperationDefinition" && operation === "subscription"
            );
          },
          wsLink,
          link
        );
      }
    }
  }

  if (cfg.clientState) {
    console.warn(
      "clientState is deprecated, see https://vue-cli-plugin-apollo.netlify.com/guide/client-state.html"
    );
    stateLink = withClientState({
      cache,
      ...cfg.clientState,
    });
    link = from([stateLink, link]);
  }

  const { additionalConfig, typeDefs, resolvers } = cfg;

  // object that will be used to instantiate apollo client
  const apolloClientConfigObj = {
    link,
    cache,
    typeDefs,
    resolvers,
    ...additionalConfig,
  };

  // run hook before creating apollo client instance
  apolloClientBeforeCreate({
    apolloClientConfigObj,
    ...context
  });

  // create an `apollo client` instance
  const apolloClient = new ApolloClient(apolloClientConfigObj);

  // Re-write the client state defaults on cache reset
  if (stateLink) {
    apolloClient.onResetStore(stateLink.writeDefaults);
  }

  if (cfg.onCacheInit) {
    cfg.onCacheInit(cache);
    apolloClient.onResetStore(() => cfg.onCacheInit(cache));
  }

  // run hook after creating apollo client instance
  apolloClientAfterCreate({
    apolloClient,
    ...context
  });

  // return `apollo client` instance
  return {
    apolloClient,
    wsClient,
    stateLink,
  };
}

export function restartWebsockets(wsClient) {
  // Copy current operations
  const operations = Object.assign({}, wsClient.operations);

  // Close connection
  wsClient.close(true);

  // Open a new one
  wsClient.connect();

  // Push all current operations to the new connection
  Object.keys(operations).forEach((id) => {
    wsClient.sendMessage(id, MessageTypes.GQL_START, operations[id].options);
  });
}
