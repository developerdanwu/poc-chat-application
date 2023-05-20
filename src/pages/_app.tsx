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
import { type ReactElement, type ReactNode, useEffect } from 'react';
import { type NextPage } from 'next';
import { configureAbly, usePresence } from '@ably-labs/react-hooks';
import { ablyChannelKeyStore } from '@/utils/useAblyWebsocket';
import { create } from 'zustand';
import { Types } from 'ably';
import produce from 'immer';
import PresenceMessage = Types.PresenceMessage;

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

export const useAppStore = create<{
  onlinePresence: Record<string, PresenceMessage>;
  addOnlinePresence: (presenceMessage: PresenceMessage) => void;
  removeOnlinePresence: (clientId: string) => void;
  setOnlinePresence: (presenceMessages: PresenceMessage[]) => void;
}>((setState) => ({
  onlinePresence: {},
  addOnlinePresence: (presenceMessage) => {
    setState((prev) => ({
      onlinePresence: produce(prev.onlinePresence, (draft) => {
        draft[presenceMessage.clientId] = presenceMessage;
      }),
    }));
  },
  setOnlinePresence: (presenceMessages: PresenceMessage[]) => {
    setState(() => ({
      onlinePresence: presenceMessages.reduce<Record<string, PresenceMessage>>(
        (acc, nextVal) => {
          acc[nextVal.clientId] = nextVal;
          return acc;
        },
        {}
      ),
    }));
  },
  removeOnlinePresence: (clientId: string) => {
    setState((prev) => ({
      onlinePresence: produce(prev.onlinePresence, (draft) => {
        delete draft[clientId];
      }),
    }));
  },
}));

const useSyncOnlinePresence = () => {
  // subscribe to only set function to prevent global re-render on state change
  const { setOnlinePresence } = useAppStore((state) => ({
    setOnlinePresence: state.setOnlinePresence,
  }));

  // should only use usePresence hook once and sync with global store because each call counts as 1 call to ably === $$$
  const [onlineUsers] = usePresence<any>({
    channelName: ablyChannelKeyStore.online,
  });

  // HACK: sync presence state with global store
  useEffect(() => {
    setOnlinePresence(onlineUsers);
  }, [setOnlinePresence, onlineUsers]);
};

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
