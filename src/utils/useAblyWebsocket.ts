import { api } from "@/utils/api";
import { configureAbly } from "@ably-labs/react-hooks";

const useAblyWebsocket = () => {
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
