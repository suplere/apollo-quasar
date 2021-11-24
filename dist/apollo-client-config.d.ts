declare function defaultGetAuth(hbp: any): string;
export default function (context: any): {
    default: {
        clientId: string;
        persisting: boolean;
        link: any;
        defaultHttpLink: boolean;
        httpEndpoint: string;
        httpLinkConfig: {};
        cache: any;
        cacheConfig: {};
        wsEndpoint: string;
        websocketsOnly: boolean;
        clientState: any;
        typeDefs: any;
        resolvers: any;
        additionalConfig: {};
        onCacheInit: any;
        tokenName: string;
        getAuth: typeof defaultGetAuth;
        ssr: boolean;
        dev: {};
        prod: {};
    };
    ssrOnServer: {
        additionalConfig: {
            ssrMode: boolean;
        };
    };
    ssrOnClient: {
        additionalConfig: {
            ssrForceFetchDelay: number;
        };
    };
    dev: {};
    prod: {};
};
export {};
