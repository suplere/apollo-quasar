export declare function apolloClientBeforeCreate({ apolloClientConfigObj, store, app, router, urlPath, redirect }: {
    apolloClientConfigObj: any;
    store: any;
    app: any;
    router: any;
    urlPath: any;
    redirect: any;
}): Promise<void>;
export declare function apolloClientAfterCreate({ apolloClient, store, app, router, urlPath, redirect, }: {
    apolloClient: any;
    store: any;
    app: any;
    router: any;
    urlPath: any;
    redirect: any;
}): void;
