function defaultGetAuth(hbp) {
  const token = hbp.auth.getJWTToken();
  // return the headers to the context so httpLink can read them
  // console.log(token)
  return token ? `Bearer ${token}` : "";
}

export default function (
  context /* context contain for example { app, router, store, ssrContext, urlPath, redirect } from boot file */
) {
  return {
    default: {
      // Client ID if using multiple Clients
      clientId: "defaultClient",
      // Enable this if you use Query persisting with Apollo Engine
      persisting: false,
      // Custom starting link.
      // If you want to replace the default HttpLink, set `defaultHttpLink` to false
      link: null,
      // If true, add the default HttpLink.
      // Disable it if you want to replace it with a terminating link using `link` option.
      defaultHttpLink: true,
      httpEndpoint: process.env.GRAPHQL_URI || "",
      // 'apollo-link-http' config
      // https://www.apollographql.com/docs/link/links/http/#options
      httpLinkConfig: {
        // you can define the 'uri' here or using an env variable when
        // running quasar commands, for example:
        // `GRAPHQL_URI=https://prod.example.com/graphql quasar build`
        // `GRAPHQL_URI=https://dev.example.com/graphql quasar dev`
      },
      // Custom Apollo cache implementation (default is apollo-cache-inmemory)
      cache: null,
      // 'apollo-cache-inmemory' config
      // https://www.apollographql.com/docs/react/caching/cache-configuration/#configuring-the-cache
      cacheConfig: {},
      // Url to the Websocket API
      wsEndpoint: process.env.GRAPHQL_WS_URI || "",
      // Only use Websocket for all requests (including queries and mutations)
      websocketsOnly: false,
      // apollo-link-state options
      clientState: null,
      // Local Schema
      typeDefs: undefined,
      // Local Resolvers
      resolvers: undefined,
      // additional config for apollo client
      // https://github.com/apollographql/apollo-client/blob/version-2.6/docs/source/api/apollo-client.mdx#optional-fields
      additionalConfig: {},
      // Hook called when you should write local state in the cache
      onCacheInit: undefined,
      // Token used in localstorage
      tokenName: "apollo-token",
      // Function returning Authorization header token
      getAuth: defaultGetAuth,
      // Is currently Server-Side Rendering or not
      ssr: false,
      dev: {},
      prod: {},
    },

    // you can add more options or override the default config for a specific
    // quasar mode or for dev and prod modes. Examples:

    // ssr: {},

    // dev: {
    //   httpLinkConfig: {
    //     uri: process.env.GRAPHQL_URI || 'http://dev.example.com/graphql'
    //   }
    // },

    // prod: {
    //   httpLinkConfig: {
    //     uri: process.env.GRAPHQL_URI || 'http://prod.example.com/graphql'
    //   }
    // },

    // the following gets merged to the config only when using ssr and on server
    ssrOnServer: {
      additionalConfig: {
        // https://apollo.vuejs.org/guide/ssr.html#create-apollo-client
        ssrMode: true,
      },
    },

    // the following gets merged to the config only when using ssr and on client
    ssrOnClient: {
      additionalConfig: {
        // https://apollo.vuejs.org/guide/ssr.html#create-apollo-client
        ssrForceFetchDelay: 100,
      },
    },
    dev: {},
    prod: {},
  };
}
