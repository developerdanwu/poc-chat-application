import { type AppType } from "next/app";
import { type Session } from "next-auth";

import { api } from "@/utils/api";

import "@/styles/globals.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <>
      <ClerkProvider {...pageProps}>
        <SignedIn>
          <Component {...pageProps} />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </ClerkProvider>
      <ReactQueryDevtools position={"top-right"} panelPosition={"right"} />
    </>
  );
};

export default api.withTRPC(MyApp);
