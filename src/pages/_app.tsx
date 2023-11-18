import {type AppProps} from 'next/app';

import {api} from '@/lib/api';

import '@/styles/globals.css';
import '@/styles/prism.css';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {ClerkProvider, RedirectToSignIn, SignedIn, SignedOut,} from '@clerk/nextjs';
import {type ReactElement, type ReactNode, useEffect, useRef, useState,} from 'react';
import {type NextPage} from 'next';
import {configureAbly} from '@ably-labs/react-hooks';
import {useSyncGlobalStore, useSyncOnlinePresence} from '@/lib/ably';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import utc from 'dayjs/plugin/utc';
import {useQueryClient} from '@tanstack/react-query';
import {type PersistedClient, type Persister,} from '@tanstack/react-query-persist-client';
import {del, get, set} from 'idb-keyval';
import GlobalLoadingSkeleton from '@/components/GlobalLoadingSkeleton';
import ErrorBoundaryWithQueryReset from '@/components/ErrorBoundaryWithQueryReset';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout;
};

const AblyConfigWrapper = ({children}: { children: React.ReactNode }) => {
    const [configured, setConfigured] = useState(false);
    const hasWindow = typeof window !== undefined;
    useEffect(() => {
        if (hasWindow && !configured) {
            configureAbly({
                authUrl: '/api/ably-auth',
                authMethod: 'GET',
                autoConnect: true,
            });
            setConfigured(true);
        }
    }, [hasWindow, configured]);

    if (!configured) {
        return null;
    }
    return <>{children}</>;
};

const UserCreation = () => {
    const seedAuthor = api.auth.seedAuthor.useMutation({
        onSuccess: () => {
            window.location.href = window.location.href;
        },
    });
    useEffect(() => {
        seedAuthor.mutate();
    }, []);

    return <GlobalLoadingSkeleton/>;
};

const AccessGuard = ({children}: { children: React.ReactNode }) => {
    const isUserInDatabase = api.auth.isUserInDatabase.useQuery();

    if (isUserInDatabase.isLoading) {
        return <GlobalLoadingSkeleton/>;
    }

    if (!isUserInDatabase.data && !isUserInDatabase.isLoading) {
        return <UserCreation/>;
    }

    return <>{children}</>;
};

/**
 * Creates an Indexed DB persister
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
export function createIDBPersister(idbValidKey: IDBValidKey = 'reactQuery') {
    return {
        persistClient: async (client: PersistedClient) => {
            await set(idbValidKey, client);
        },
        restoreClient: async () => {
            return await get<PersistedClient>(idbValidKey);
        },
        removeClient: async () => {
            await del(idbValidKey);
        },
    } as Persister;
}

const persister = createIDBPersister();

const GlobalConfigWrapper = ({children}: { children: React.ReactNode }) => {
    useSyncOnlinePresence();
    useSyncGlobalStore();
    const queryClient = useQueryClient();
    const loaded = useRef(false);

    // // TODO: fine tune indexDB persister
    // persistQueryClient({
    //   queryClient,
    //   persister,
    //   maxAge: Infinity,
    // });

    useEffect(() => {
        if (!loaded.current) {
            // invalidate all queries on page load to make sure everything is up to date
            queryClient.invalidateQueries();
            loaded.current = true;
        }
    }, []);

    return <>{children}</>;
};

dayjs.extend(advancedFormat);
dayjs.extend(utc);

const MyApp = ({
                   Component,
                   pageProps: {...pageProps},
               }: AppPropsWithLayout) => {
    const getLayout = Component.getLayout ?? ((page) => page);

    return (
        <ErrorBoundaryWithQueryReset
            fallbackRender={(props) => {
                return (
                    <div>
                        <div>Something went wrong</div>
                        <button
                            onClick={() => {
                                props.resetErrorBoundary();
                            }}
                        >
                            RESET
                        </button>
                    </div>
                );
            }}
        >
            <ClerkProvider {...pageProps}>
                <SignedIn>
                    {getLayout(
                        <AccessGuard>
                            <AblyConfigWrapper>
                                <GlobalConfigWrapper>
                                    <Component {...pageProps} />
                                </GlobalConfigWrapper>
                            </AblyConfigWrapper>
                        </AccessGuard>
                    )}
                </SignedIn>
                <SignedOut>
                    <RedirectToSignIn/>
                </SignedOut>
            </ClerkProvider>
            <ReactQueryDevtools position="top-right" panelPosition="right"/>
        </ErrorBoundaryWithQueryReset>
    );
};

export default api.withTRPC(MyApp);
