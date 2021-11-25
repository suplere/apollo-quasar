import { ApolloClient } from "apollo-client";
import { ApolloConfig } from "./types";
export declare function createApolloClient(config: ApolloConfig, hbpInstance?: any): {
    apolloClient: ApolloClient<unknown>;
    wsClient: any;
    stateLink: any;
};
export declare function restartWebsockets(wsClient: any): void;
