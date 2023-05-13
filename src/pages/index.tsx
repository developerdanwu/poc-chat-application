import React from "react";
import { cn } from "@/utils/utils";
import ChatSidebar from "@/components/templates/root/ChatSidebar/ChatSidebar";
import { type NextPageWithLayout } from "@/pages/_app";

const Home: NextPageWithLayout = () => {
  return <></>;
};

Home.getLayout = function getLayout(page) {
  return (
    <div
      className={cn(
        "flex h-screen w-screen flex-row items-center justify-center bg-warm-gray-50"
      )}
    >
      <div className={cn("flex h-full w-full flex-row")}>
        <ChatSidebar />
        {page}
      </div>
    </div>
  );
};

export default Home;
