import { notEmpty } from "@/utils/ts-utils";
import { api } from "@/utils/api";
import { useUser } from "@clerk/nextjs";

const ChatTopControls = ({ chatroomId }: { chatroomId: string }) => {
  const chatroomDetail = api.messaging.getChatroom.useQuery(
    {
      chatroomId: chatroomId,
    },
    {
      enabled: !!chatroomId,
    }
  );

  const selfUser = useUser();
  const filteredChatroomUsers = chatroomDetail.data?.authors.filter(
    (user) => user.user_id !== selfUser.user?.id
  );

  return (
    <div
      className={
        "flex w-full flex-[0_0_60px] items-center border-b-2 border-black"
      }
    >
      <p className={"w-full px-6  font-semibold text-black"}>
        {filteredChatroomUsers
          ?.map((author) => author?.first_name)
          .filter(notEmpty)
          .join(",")}
      </p>
    </div>
  );
};

export default ChatTopControls;
