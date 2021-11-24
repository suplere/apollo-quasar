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
var get_apollo_client_config_1 = __importDefault(require("./get-apollo-client-config"));
var apollo_client_hooks_1 = require("./apollo-client-hooks");
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
function createApolloClient(context, config) {
    var app = context.app, router = context.router, store = context.store, urlPath = context.urlPath, redirect = context.redirect, hbp = context.hbp;
    var cfg = (0, get_apollo_client_config_1.default)({
        app: app,
        router: router,
        store: store,
        urlPath: urlPath,
        redirect: redirect,
        hbp: hbp,
    });
    var link = cfg.link, persisting = cfg.persisting;
    var httpEndpoint = config.httpEndpoint || cfg.httpEndpoint;
    var wsEndpoint = config.wsEndpoint || cfg.wsEndpoint || null;
    var wsClient, authLink, stateLink;
    var disableHttp = cfg.websocketsOnly && wsEndpoint;
    // Apollo cache
    var cache = cfg.cache ? cfg.cache : new apollo_cache_inmemory_1.InMemoryCache(cfg.cacheConfig);
    if (!disableHttp) {
        var httpLink = (0, apollo_upload_client_1.createUploadLink)(__assign({ uri: httpEndpoint }, cfg.httpLinkConfig));
        if (!link) {
            link = httpLink;
        }
        else if (cfg.defaultHttpLink) {
            link = (0, apollo_link_1.from)([link, httpLink]);
        }
        // HTTP Auth header injection
        authLink = (0, apollo_link_context_1.setContext)(function (_, _a) {
            var headers = _a.headers;
            var authorization = cfg.getAuth(hbp);
            var authorizationHeader = authorization ? { authorization: authorization } : {};
            return {
                headers: __assign(__assign({}, headers), authorizationHeader),
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
            var state = window["__APOLLO_STATE__"] || null;
            if (state && state[cfg.clientId]) {
                // Restore state
                cache.restore(state[cfg.clientId]);
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
                    var authorization = cfg.getAuth(hbp);
                    // console.log(authorization)
                    return authorization
                        ? { authorization: authorization, headers: { authorization: authorization } }
                        : {};
                },
            });
            // console.log(wsClient)
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
    if (cfg.clientState) {
        console.warn("clientState is deprecated, see https://vue-cli-plugin-apollo.netlify.com/guide/client-state.html");
        stateLink = (0, apollo_link_state_1.withClientState)(__assign({ cache: cache }, cfg.clientState));
        link = (0, apollo_link_1.from)([stateLink, link]);
    }
    var additionalConfig = cfg.additionalConfig, typeDefs = cfg.typeDefs, resolvers = cfg.resolvers;
    // object that will be used to instantiate apollo client
    var apolloClientConfigObj = __assign({ link: link, cache: cache, typeDefs: typeDefs, resolvers: resolvers }, additionalConfig);
    // run hook before creating apollo client instance
    (0, apollo_client_hooks_1.apolloClientBeforeCreate)(__assign({ apolloClientConfigObj: apolloClientConfigObj }, context));
    // create an `apollo client` instance
    var apolloClient = new apollo_client_1.ApolloClient(apolloClientConfigObj);
    // Re-write the client state defaults on cache reset
    if (stateLink) {
        apolloClient.onResetStore(stateLink.writeDefaults);
    }
    if (cfg.onCacheInit) {
        cfg.onCacheInit(cache);
        apolloClient.onResetStore(function () { return cfg.onCacheInit(cache); });
    }
    // run hook after creating apollo client instance
    (0, apollo_client_hooks_1.apolloClientAfterCreate)(__assign({ apolloClient: apolloClient }, context));
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