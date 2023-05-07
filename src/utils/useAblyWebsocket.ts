import { api } from "@/utils/api";
import { configureAbly } from "@ably-labs/react-hooks";
import { useUser } from "@clerk/nextjs";

export const ablyChannelKeyStore = {
  chatroom: (chatroomId: string) => `chatroom-${chatroomId}`,
};

const useAblyWebsocket = () => {
  const user = useUser();
  const ablyAuthentication = api.ably.auth.useMutation();
  configureAbly({
    async authCallback(data, callback) {
      try {
        const token = await ablyAuthentication.mutateAsync();
        callback(null, token);
      } catch (error) {
        callback(JSON.stringify(error), null);
      }
    },
  });
};

export default useAblyWebsocket;
