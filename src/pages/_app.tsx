import { type AppProps } from 'next/app';

import { api } from '@/lib/api';

import '@/styles/globals.css';
import '@/styles/prism.css';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs';
import { type ReactElement, type ReactNode, useEffect, useState } from 'react';
import { type NextPage } from 'next';
import { configureAbly } from '@ably-labs/react-hooks';
import { useSyncOnlinePresence } from '@/lib/ably';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import utc from 'dayjs/plugin/utc';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const AblyConfigWrapper = ({ children }: { children: React.ReactNode }) => {
  const [configured, setConfigured] = useState(false);
  const hasWindow = typeof window !== undefined;
  useEffect(() => {
    if (hasWindow && !configured) {
      configureAbly({
        authUrl: '/api/ably-auth',
        authMethod: 'GET',
      });
      setConfigured(true);
    }
  }, [hasWindow, configured]);

  if (!configured) {
    return null;
  }
  return <>{children}</>;
};

const GlobalConfigWrapper = ({ children }: { children: React.ReactNode }) => {
  useSyncOnlinePresence();
  return <>{children}</>;
};

dayjs.extend(advancedFormat);
dayjs.extend(utc);

const MyApp = ({
  Component,
  pageProps: { ...pageProps },
}: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page);
  return (
    <>
      <ClerkProvider {...pageProps}>
        <SignedIn>
          {getLayout(
            <AblyConfigWrapper>
              <GlobalConfigWrapper>
                <Component {...pageProps} />
              </GlobalConfigWrapper>
            </AblyConfigWrapper>
          )}
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </ClerkProvider>
      <ReactQueryDevtools position="top-right" panelPosition="right" />
    </>
  );
};

export default api.withTRPC(MyApp);
