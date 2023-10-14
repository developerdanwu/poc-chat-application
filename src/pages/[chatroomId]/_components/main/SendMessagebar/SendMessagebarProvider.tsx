import React, { createContext, useContext, useRef } from 'react';
import { createStore, type StoreApi, useStore } from 'zustand';

type SendMessagebarStore = {
  peekMessageOpen: boolean;
  setPeekMessageOpen: (peekMessageOpen: boolean) => void;
};

const StoreContext = createContext<StoreApi<SendMessagebarStore> | null>(null);

export default function SendMessagebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<StoreApi<SendMessagebarStore>>();
  if (!storeRef.current) {
    storeRef.current = createStore<SendMessagebarStore>((setState) => ({
      peekMessageOpen: false,
      setPeekMessageOpen: (peekMessageOpen: boolean) => {
        setState({ peekMessageOpen });
      },
    }));
  }
  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
}

export function useSendMessagebar<U>(
  selector: (state: SendMessagebarStore) => U
) {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('Missing StoreProvider');
  }
  return useStore<StoreApi<SendMessagebarStore>, U>(store, selector);
}
