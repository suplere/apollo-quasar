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
import { OperationDefinitionNode } from "graphql";
import { ApolloConfig } from "./types";

function defaultGetAuth(tokenName) {
  if (typeof window !== "undefined") {
    // get the authentication token from local storage if it exists
    const token = window.localStorage.getItem(tokenName);
    // return the headers to the context so httpLink can read them
    return token ? `Bearer ${token}` : "";
    // return true
  }
  return "";
}

export function createApolloClient(config: ApolloConfig, hbpInstance = null) {
  // Client ID if using multiple Clients
  const clientId = config.clientId ? config.clientId : "defaultClient";
  // Enable this if you use Query persisting with Apollo Engine
  let persisting = config.persisting ? config.persisting : false;
  // Custom starting link.
  // If you want to replace the default HttpLink, set `defaultHttpLink` to false
  let link = config.link ? config.link : null;
  // If true, add the default HttpLink.
  // Disable it if you want to replace it with a terminating link using `link` option.
  const defaultHttpLink = config.defaultHttpLink
    ? config.defaultHttpLink
    : true;
  const httpEndpoint = config.httpEndpoint;
  // 'apollo-link-http' config
  // https://www.apollographql.com/docs/link/links/http/#options
  const httpLinkConfig = config.httpEndpoint
    ? config.httpEndpoint
    : {
        // you can define the 'uri' here or using an env variable when
        // running quasar commands, for example:
        // `GRAPHQL_URI=https://prod.example.com/graphql quasar build`
        // `GRAPHQL_URI=https://dev.example.com/graphql quasar dev`
      };
  // 'apollo-cache-inmemory' config
  // https://www.apollographql.com/docs/react/caching/cache-configuration/#configuring-the-cache
  const cacheConfig = config.cacheConfig ? config.cacheConfig : {};
  // Custom Apollo cache implementation (default is apollo-cache-inmemory)
  const cache = config.cache ? config.cache : new InMemoryCache(cacheConfig);
  // Url to the Websocket API
  const wsEndpoint = config.wsEndpoint ? config.wsEndpoint : "";
  // Only use Websocket for all requests (including queries and mutations)
  const websocketsOnly = config.websocketsOnly ? config.websocketsOnly : false;
  // apollo-link-state options
  const clientState = config.clientState ? config.clientState : null;
  // Local Schema
  const typeDefs = config.typeDefs ? config.typeDefs : undefined;
  // Local Resolvers
  const resolvers = config.resolvers ? config.resolvers : undefined;
  // additional config for apollo client
  // https://github.com/apollographql/apollo-client/blob/version-2.6/docs/source/api/apollo-client.mdx#optional-fields
  const additionalConfig = config.additionalConfig
    ? config.additionalConfig
    : {};
  // Hook called when you should write local state in the cache
  const onCacheInit = config.onCacheInit ? config.onCacheInit : undefined;
  // Token used in localstorage
  const tokenName = config.tokenName ? config.tokenName : "apollo-token";
  // Function returning Authorization header token
  const getAuth = config.getAuth ? config.getAuth : defaultGetAuth;
  // Is currently Server-Side Rendering or not
  const ssr = false;
  const apolloClientBeforeCreate = config.apolloClientBeforeCreate
    ? config.apolloClientBeforeCreate
    : null;
  const apolloClientAfterCreate = config.apolloClientAfterCreate
    ? config.apolloClientAfterCreate
    : null;  

  const disableHttp = websocketsOnly && wsEndpoint;

  if (!disableHttp) {
    const httpLink = createUploadLink({
      uri: httpEndpoint,
      ...httpLinkConfig,
    });

    if (!link) {
      link = httpLink;
    } else if (defaultHttpLink) {
      link = from([link, httpLink]);
    }

    // HTTP Auth header injection
    const authLink = setContext((_, { headers }) => {
      // implementation for HBP
      const authorization = hbpInstance
        ? getAuth(hbpInstance)
        : getAuth(tokenName);
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

  let wsClient, stateLink;
  // On the server, we don't want WebSockets and Upload links
  if (!ssr) {
    // If on the client, recover the injected state
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-underscore-dangle
      const state = window["__APOLLO_STATE__"] || null;
      if (state && state[clientId]) {
        // Restore state
        cache.restore(state[clientId]);
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
          const authorization = hbpInstance
            ? getAuth(hbpInstance)
            : getAuth(tokenName);
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

  if (clientState) {
    console.warn(
      "clientState is deprecated, see https://vue-cli-plugin-apollo.netlify.com/guide/client-state.html"
    );
    stateLink = withClientState({
      cache,
      ...clientState,
    });
    link = from([stateLink, link]);
  }

  // const { additionalConfig, typeDefs, resolvers } = cfg;

  // object that will be used to instantiate apollo client
  const apolloClientConfigObj = {
    link,
    cache,
    typeDefs,
    resolvers,
    ...additionalConfig,
  };

  // run hook before creating apollo client instance
  if (apolloClientBeforeCreate) {
    const clientBeforeCreate = (clientConfigObj, callback) => {
      // the original function handling that lead to some results
      const result = clientConfigObj;
      callback(result);
    };
    clientBeforeCreate(apolloClientConfigObj, apolloClientBeforeCreate);
  }

  // create an `apollo client` instance
  const apolloClient = new ApolloClient(apolloClientConfigObj);

  // Re-write the client state defaults on cache reset
  if (stateLink) {
    apolloClient.onResetStore(stateLink.writeDefaults);
  }

  if (onCacheInit) {
    onCacheInit(cache);
    apolloClient.onResetStore(() => onCacheInit(cache));
  }

  // run hook after creating apollo client instance
  if (apolloClientAfterCreate) {
    const clientAfterCreate = (apolloClient, callback) => {
      // the original function handling that lead to some results
      const result = apolloClient;
      callback(result);
    };
    clientAfterCreate(apolloClient, apolloClientAfterCreate);
  }

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
