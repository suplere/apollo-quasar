import { ApolloClient } from "apollo-client";
export declare function createApolloClient(context: any, config: any): {
    apolloClient: ApolloClient<unknown>;
    wsClient: any;
    stateLink: any;
};
export declare function restartWebsockets(wsClient: any): void;
