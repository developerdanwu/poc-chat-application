import { notEmpty } from '@/utils/ts-utils';
import { api } from '@/utils/api';
import { useApiTransformUtils } from '@/utils/utils';

const ChatTopControls = ({ chatroomId }: { chatroomId: string }) => {
  const chatroomDetail = api.messaging.getChatroom.useQuery(
    {
      chatroomId: chatroomId,
    },
    {
      enabled: !!chatroomId,
    }
  );

  const { filterAuthedUserFromChatroomAuthors, getFullName, getUserPrescence } =
    useApiTransformUtils();
  const filteredChatroomUsers = filterAuthedUserFromChatroomAuthors(
    chatroomDetail.data?.authors ?? []
  );
  const onlineUserPrescence =
    filteredChatroomUsers.length === 1
      ? filteredChatroomUsers[0]
        ? getUserPrescence(filteredChatroomUsers[0].user_id)
        : undefined
      : undefined;

  return (
    <div className="flex w-full flex-[0_0_60px] items-center justify-start border-b-2 border-black">
      <p className=" px-6 font-semibold text-black">
        {filteredChatroomUsers
          ?.map((author) =>
            getFullName({
              firstName: author.first_name,
              lastName: author.last_name,
              fallback: 'Untitled',
            })
          )
          .filter(notEmpty)
          .join(',')}
      </p>
      {onlineUserPrescence ? <div>online</div> : null}
    </div>
  );
};

export default ChatTopControls;
