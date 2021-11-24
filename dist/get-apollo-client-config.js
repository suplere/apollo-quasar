"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var webpack_merge_1 = __importDefault(require("webpack-merge"));
var apollo_client_config_1 = __importDefault(require("./apollo-client-config"));
// quasar mode (spa, ssr,...)
var quasarMode = process.env.MODE;
// `true` when this code runs on server (node environment), `false` when on
// client (web browser for example)
// https://quasar.dev/quasar-cli/cli-documentation/handling-process-env#Values-supplied-by-Quasar-CLI
var onServer = process.env.SERVER;
function default_1(_a) {
    var app = _a.app, router = _a.router, store = _a.store, ssrContext = _a.ssrContext, urlPath = _a.urlPath, redirect = _a.redirect;
    // get raw configuration provided by the app
    var rawConfig = (0, apollo_client_config_1.default)({
        app: app,
        router: router,
        store: store,
        ssrContext: ssrContext,
        urlPath: urlPath,
        redirect: redirect,
    });
    // merge provided configs.
    // specific mode configs will be merged to the default config
    return (0, webpack_merge_1.default)(rawConfig.default, rawConfig[quasarMode], process.env.DEV ? rawConfig.dev : {}, process.env.PROD ? rawConfig.prod : {}, quasarMode === "ssr" && onServer ? rawConfig.ssrOnServer : {}, quasarMode === "ssr" && !onServer ? rawConfig.ssrOnClient : {});
}
exports.default = default_1;
//# sourceMappingURL=get-apollo-client-config.js.map