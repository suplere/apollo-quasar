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
exports.createApolloClient = void 0;
var apollo_client_1 = require("apollo-client");
var apollo_link_http_1 = require("apollo-link-http");
var apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
var get_apollo_client_config_1 = __importDefault(require("./get-apollo-client-config"));
var apollo_client_hooks_1 = require("./apollo-client-hooks");
// function that returns an 'apollo client' instance
function createApolloClient(_a) {
    var app = _a.app, router = _a.router, store = _a.store, urlPath = _a.urlPath, redirect = _a.redirect, ssrContext = _a.ssrContext;
    var cfg = (0, get_apollo_client_config_1.default)({
        app: app,
        router: router,
        store: store,
        urlPath: urlPath,
        ssrContext: ssrContext,
        redirect: redirect,
    });
    // create apollo client link
    var link = new apollo_link_http_1.HttpLink(cfg.httpLinkConfig);
    // create apollo client cache
    var cache = new apollo_cache_inmemory_1.InMemoryCache(cfg.cacheConfig);
    // object that will be used to instantiate apollo client
    var apolloClientConfigObj = __assign({ link: link, cache: cache }, cfg.additionalConfig);
    // run hook before creating apollo client instance
    (0, apollo_client_hooks_1.apolloClientBeforeCreate)({
        apolloClientConfigObj: apolloClientConfigObj,
        app: app,
        router: router,
        store: store,
        urlPath: urlPath,
        redirect: redirect,
    });
    // create an `apollo client` instance
    var apolloClient = new apollo_client_1.ApolloClient(apolloClientConfigObj);
    // run hook after creating apollo client instance
    (0, apollo_client_hooks_1.apolloClientAfterCreate)({
        apolloClient: apolloClient,
        app: app,
        router: router,
        store: store,
        urlPath: urlPath,
        redirect: redirect,
    });
    // return `apollo client` instance
    return apolloClient;
}
exports.createApolloClient = createApolloClient;
//# sourceMappingURL=index.js.map