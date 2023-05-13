import { notEmpty } from "@/utils/ts-utils";
import { api } from "@/utils/api";

const ChatTopControls = ({ chatroomId }: { chatroomId: string }) => {
  const chatroomDetail = api.messaging.getChatroom.useQuery(
    {
      chatroomId: chatroomId,
    },
    {
      enabled: !!chatroomId,
    }
  );
  return (
    <div
      className={
        "flex w-full flex-[0_0_60px] items-center border-b-2 border-black"
      }
    >
      <p className={"w-full px-6  font-semibold text-black"}>
        {chatroomDetail.data?.authors
          .map((author) => author?.first_name)
          .filter(notEmpty)
          .join(",")}
      </p>
    </div>
  );
};

export default ChatTopControls;
