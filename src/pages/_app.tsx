import { type AppProps } from 'next/app';

import { api } from '@/utils/api';

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

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp = ({
  Component,
  pageProps: { ...pageProps },
}: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page);
  // useAblyWebsocket();

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
