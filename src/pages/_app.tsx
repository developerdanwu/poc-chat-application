import { type AppProps } from 'next/app';

import { api } from '@/lib/api';

import '@/styles/globals.css';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs';
import { type ReactElement, type ReactNode } from 'react';
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

configureAbly({
  authUrl: 'http://localhost:3000/api/ably-auth',
  authMethod: 'GET',
});

dayjs.extend(advancedFormat);
dayjs.extend(utc);

const MyApp = ({
  Component,
  pageProps: { ...pageProps },
}: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page);
  useSyncOnlinePresence();

  return (
    <>
      <ClerkProvider {...pageProps}>
        <SignedIn>{getLayout(<Component {...pageProps} />)}</SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </ClerkProvider>
      <ReactQueryDevtools position="top-right" panelPosition="right" />
    </>
  );
};

export default api.withTRPC(MyApp);
