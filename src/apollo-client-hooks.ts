export async function apolloClientBeforeCreate(
  {
    apolloClientConfigObj,
    store,
    app,
    router,
    urlPath,
    redirect
  } /* { apolloClientConfigObj, app, router, store, ssrContext, urlPath, redirect } */
) {}

export function apolloClientAfterCreate(
  {
    apolloClient,
    store,
    app,
    router,
    urlPath,
    redirect,
  } /* { apolloClient, app, router, store, ssrContext, urlPath, redirect } */
) {}
