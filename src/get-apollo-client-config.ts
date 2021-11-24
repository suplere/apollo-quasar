import merge from "webpack-merge";
import config from "./apollo-client-config";

// quasar mode (spa, ssr,...)
const quasarMode = process.env.MODE;

// `true` when this code runs on server (node environment), `false` when on
// client (web browser for example)
// https://quasar.dev/quasar-cli/cli-documentation/handling-process-env#Values-supplied-by-Quasar-CLI
const onServer = process.env.SERVER;

export default function (context) {
  // get raw configuration provided by the app
  const rawConfig = config(context);

  // merge provided configs.
  // specific mode configs will be merged to the default config
  return merge(
    rawConfig.default,
    rawConfig[quasarMode] ? rawConfig[quasarMode] : {},
    process.env.DEV ? rawConfig.dev : {},
    process.env.PROD ? rawConfig.prod : {},
    quasarMode === "ssr" && onServer ? rawConfig.ssrOnServer : {},
    quasarMode === "ssr" && !onServer ? rawConfig.ssrOnClient : {}
  );
}
