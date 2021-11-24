# Apollo service to Quasar application

Helper for use Apollo (GRAPHQL) in quasar applications.

Using for example in boot file:

```
import Vue from 'vue'
import VueApollo from 'vue-apollo'
import { createApolloClient } from 'src/services/apollo/create-apollo-client'
import { hbp } from "src/boot/nhost"

// Install vue-apollo plugin
Vue.use(VueApollo)

export default ({ app, router, store, urlPath, redirect }) => {
  // create an 'apollo client' instance
  const { apolloClient, wsClient } = createApolloClient({ app, router, store, urlPath, redirect, hbp })

  apolloClient.wsClient = wsClient

  // create an 'apollo provider' instance
  const apolloProvider = new VueApollo({ defaultClient: apolloClient })

  // attach created 'apollo provider' instance to the app
  app.apolloProvider = apolloProvider
  store.$apolloClient = apolloClient
}

```