"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restartWebsockets = exports.createApolloClient = void 0;
var apollo_client_1 = require("apollo-client");
var apollo_link_1 = require("apollo-link");
var apollo_upload_client_1 = require("apollo-upload-client");
var apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
var subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
var message_types_1 = __importDefault(require("subscriptions-transport-ws/dist/message-types"));
var apollo_link_ws_1 = require("apollo-link-ws");
var apollo_utilities_1 = require("apollo-utilities");
var apollo_link_persisted_queries_1 = require("apollo-link-persisted-queries");
var apollo_link_context_1 = require("apollo-link-context");
var apollo_link_state_1 = require("apollo-link-state");
function defaultGetAuth(tokenName) {
    if (typeof window !== "undefined") {
        // get the authentication token from local storage if it exists
        var token = window.localStorage.getItem(tokenName);
        // return the headers to the context so httpLink can read them
        return token ? "Bearer " + token : "";
        // return true
    }
    return "";
}
function createApolloClient(config, hbpInstance) {
    if (hbpInstance === void 0) { hbpInstance = null; }
    // Client ID if using multiple Clients
    var clientId = config.clientId ? config.clientId : "defaultClient";
    // Enable this if you use Query persisting with Apollo Engine
    var persisting = config.persisting ? config.persisting : false;
    // Custom starting link.
    // If you want to replace the default HttpLink, set `defaultHttpLink` to false
    var link = config.link ? config.link : null;
    // If true, add the default HttpLink.
    // Disable it if you want to replace it with a terminating link using `link` option.
    var defaultHttpLink = config.defaultHttpLink
        ? config.defaultHttpLink
        : true;
    var httpEndpoint = config.httpEndpoint;
    // 'apollo-link-http' config
    // https://www.apollographql.com/docs/link/links/http/#options
    var httpLinkConfig = config.httpEndpoint
        ? config.httpEndpoint
        : {
        // you can define the 'uri' here or using an env variable when
        // running quasar commands, for example:
        // `GRAPHQL_URI=https://prod.example.com/graphql quasar build`
        // `GRAPHQL_URI=https://dev.example.com/graphql quasar dev`
        };
    // 'apollo-cache-inmemory' config
    // https://www.apollographql.com/docs/react/caching/cache-configuration/#configuring-the-cache
    var cacheConfig = config.cacheConfig ? config.cacheConfig : {};
    // Custom Apollo cache implementation (default is apollo-cache-inmemory)
    var cache = config.cache ? config.cache : new apollo_cache_inmemory_1.InMemoryCache(cacheConfig);
    // Url to the Websocket API
    var wsEndpoint = config.wsEndpoint ? config.wsEndpoint : "";
    // Only use Websocket for all requests (including queries and mutations)
    var websocketsOnly = config.websocketsOnly ? config.websocketsOnly : false;
    // apollo-link-state options
    var clientState = config.clientState ? config.clientState : null;
    // Local Schema
    var typeDefs = config.typeDefs ? config.typeDefs : undefined;
    // Local Resolvers
    var resolvers = config.resolvers ? config.resolvers : undefined;
    // additional config for apollo client
    // https://github.com/apollographql/apollo-client/blob/version-2.6/docs/source/api/apollo-client.mdx#optional-fields
    var additionalConfig = config.additionalConfig
        ? config.additionalConfig
        : {};
    // Hook called when you should write local state in the cache
    var onCacheInit = config.onCacheInit ? config.onCacheInit : undefined;
    // Token used in localstorage
    var tokenName = config.tokenName ? config.tokenName : "apollo-token";
    // Function returning Authorization header token
    var getAuth = config.getAuth ? config.getAuth : defaultGetAuth;
    // Is currently Server-Side Rendering or not
    var ssr = false;
    var apolloClientBeforeCreate = config.apolloClientBeforeCreate
        ? config.apolloClientBeforeCreate
        : null;
    var apolloClientAfterCreate = config.apolloClientAfterCreate
        ? config.apolloClientAfterCreate
        : null;
    var disableHttp = websocketsOnly && wsEndpoint;
    if (!disableHttp) {
        var httpLink = (0, apollo_upload_client_1.createUploadLink)(__assign({ uri: httpEndpoint }, httpLinkConfig));
        if (!link) {
            link = httpLink;
        }
        else if (defaultHttpLink) {
            link = (0, apollo_link_1.from)([link, httpLink]);
        }
        // HTTP Auth header injection
        var authLink = (0, apollo_link_context_1.setContext)(function (_, _a) {
            var headers = _a.headers;
            // implementation for HBP
            var authorization = hbpInstance
                ? getAuth(hbpInstance)
                : getAuth(tokenName);
            var authorizationHeader = authorization ? { authorization: authorization } : {};
            return {
                headers: __assign(__assign({}, headers), authorizationHeader),
            };
        });
        // Concat all the http link parts
        link = authLink.concat(link);
    }
    var wsClient, stateLink;
    // On the server, we don't want WebSockets and Upload links
    if (!ssr) {
        // If on the client, recover the injected state
        if (typeof window !== "undefined") {
            // eslint-disable-next-line no-underscore-dangle
            var state = window["__APOLLO_STATE__"] || null;
            if (state && state[clientId]) {
                // Restore state
                cache.restore(state[clientId]);
            }
        }
        if (!disableHttp) {
            var persistingOpts = {};
            if (typeof persisting === "object" && persisting != null) {
                persistingOpts = persisting;
                persisting = true;
            }
            if (persisting === true) {
                link = (0, apollo_link_persisted_queries_1.createPersistedQueryLink)(persistingOpts).concat(link);
            }
        }
        // Web socket
        if (wsEndpoint) {
            wsClient = new subscriptions_transport_ws_1.SubscriptionClient(wsEndpoint, {
                reconnect: true,
                connectionParams: function () {
                    var authorization = hbpInstance
                        ? getAuth(hbpInstance)
                        : getAuth(tokenName);
                    return authorization
                        ? { authorization: authorization, headers: { authorization: authorization } }
                        : {};
                },
            });
            // Create the subscription websocket link
            var wsLink = new apollo_link_ws_1.WebSocketLink(wsClient);
            if (disableHttp) {
                link = wsLink;
            }
            else {
                link = (0, apollo_link_1.split)(
                // split based on operation type
                function (_a) {
                    var query = _a.query;
                    var _b = (0, apollo_utilities_1.getMainDefinition)(query), kind = _b.kind, operation = _b.operation;
                    return (kind === "OperationDefinition" && operation === "subscription");
                }, wsLink, link);
            }
        }
    }
    if (clientState) {
        console.warn("clientState is deprecated, see https://vue-cli-plugin-apollo.netlify.com/guide/client-state.html");
        stateLink = (0, apollo_link_state_1.withClientState)(__assign({ cache: cache }, clientState));
        link = (0, apollo_link_1.from)([stateLink, link]);
    }
    // const { additionalConfig, typeDefs, resolvers } = cfg;
    // object that will be used to instantiate apollo client
    var apolloClientConfigObj = __assign({ link: link, cache: cache, typeDefs: typeDefs, resolvers: resolvers }, additionalConfig);
    // run hook before creating apollo client instance
    if (apolloClientBeforeCreate) {
        var clientBeforeCreate = function (clientConfigObj, callback) {
            // the original function handling that lead to some results
            var result = clientConfigObj;
            callback(result);
        };
        clientBeforeCreate(apolloClientConfigObj, apolloClientBeforeCreate);
    }
    // create an `apollo client` instance
    var apolloClient = new apollo_client_1.ApolloClient(apolloClientConfigObj);
    // Re-write the client state defaults on cache reset
    if (stateLink) {
        apolloClient.onResetStore(stateLink.writeDefaults);
    }
    if (onCacheInit) {
        onCacheInit(cache);
        apolloClient.onResetStore(function () { return onCacheInit(cache); });
    }
    // run hook after creating apollo client instance
    if (apolloClientAfterCreate) {
        var clientAfterCreate = function (apolloClient, callback) {
            // the original function handling that lead to some results
            var result = apolloClient;
            callback(result);
        };
        clientAfterCreate(apolloClient, apolloClientAfterCreate);
    }
    // return `apollo client` instance
    return {
        apolloClient: apolloClient,
        wsClient: wsClient,
        stateLink: stateLink,
    };
}
exports.createApolloClient = createApolloClient;
function restartWebsockets(wsClient) {
    // Copy current operations
    var operations = Object.assign({}, wsClient.operations);
    // Close connection
    wsClient.close(true);
    // Open a new one
    wsClient.connect();
    // Push all current operations to the new connection
    Object.keys(operations).forEach(function (id) {
        wsClient.sendMessage(id, message_types_1.default.GQL_START, operations[id].options);
    });
}
exports.restartWebsockets = restartWebsockets;
//# sourceMappingURL=index.js.map