import { usePresence } from '@ably-labs/react-hooks';
import { useEffect } from 'react';
import { create } from 'zustand';
import produce from 'immer';
import { Types } from 'ably';
import PresenceMessage = Types.PresenceMessage;

export const MESSAGE_STREAM_NAMES = {
  openAiMessage: 'OPEN_AI_MESSAGE',
} as const;

export const ablyChannelKeyStore = {
  chatroom: (chatroomId: string) => `chatroom-${chatroomId}`,
  online: 'online',
};
export const useAblyStore = create<{
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
export const useSyncOnlinePresence = () => {
  // subscribe to only set function to prevent global re-render on state change
  const { setOnlinePresence } = useAblyStore((state) => ({
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
