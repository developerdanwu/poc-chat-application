import { create } from 'zustand';
import produce from 'immer';
import { Types } from 'ably';
import PresenceMessage = Types.PresenceMessage;

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
