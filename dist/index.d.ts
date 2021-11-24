import { ApolloClient } from "apollo-client";
export declare function createApolloClient({ app, router, store, urlPath, redirect, ssrContext, }: {
    app: any;
    router: any;
    store: any;
    urlPath: any;
    redirect: any;
    ssrContext: any;
}): ApolloClient<unknown>;
