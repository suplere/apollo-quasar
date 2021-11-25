# Apollo service to Quasar application

Helper for use Apollo (GRAPHQL) in quasar applications.

Using for example in QUASAR boot file, how I using with Hasura Backend Plus:

```
import Vue from 'vue'
import VueApollo from 'vue-apollo'
import { createApolloClient } from '@suplere/apollo-quasar'
import { hbp } from "src/boot/nhost"

// Install vue-apollo plugin
Vue.use(VueApollo)

function hbpGetAutentication(hbp) {
  const token = hbp.auth.getJWTToken()
  return token ? `Bearer ${token}` : ''
}

export default ({ app, router, store, urlPath, redirect }) => {
  // create an 'apollo client' instance
  function testCallbackBefore(clientConfigObj) {
    console.log("--------BEFORE CREATE HOOK---------")
    console.log("clientConfigObj",clientConfigObj)
    console.log("STORE", store)
  }

  function testCallBackAfter(apolloClient) {
    console.log("--------AFTER CREATE HOOK---------")
    console.log("apolloClient", apolloClient)
    console.log("ROUTER", router)
  }

  const httpEndpoint = process.env.GRAPHQL_URI
  const wsEndpoint = process.env.GRAPHQL_WS_URI
  
  const { apolloClient, wsClient } = createApolloClient({
    httpEndpoint,
    wsEndpoint,
    getAuth: hbpGetAutentication,
    apolloClientBeforeCreate: testCallbackBefore,
    apolloClientAfterCreate: testCallBackAfter
  }, hbp)

  apolloClient.wsClient = wsClient

  // create an 'apollo provider' instance
  const apolloProvider = new VueApollo({ defaultClient: apolloClient })

  // attach created 'apollo provider' instance to the app
  app.apolloProvider = apolloProvider
  store.$apolloClient = apolloClient
}

```