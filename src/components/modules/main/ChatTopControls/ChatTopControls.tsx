import { notEmpty } from '@/lib/ts-utils';
import { api } from '@/lib/api';
import { useApiTransformUtils } from '@/lib/utils';

const ChatTopControls = ({ chatroomId }: { chatroomId: string }) => {
  const chatroomDetail = api.messaging.getChatroom.useQuery({
    chatroomId: chatroomId,
  });

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

  if (!chatroomDetail.data) {
    return null;
  }

  return (
    <div className="flex w-full flex-[0_0_48px] items-center justify-start border-b border-slate-300">
      <p className=" px-6 text-lg font-semibold text-slate-900">
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
      {onlineUserPrescence ? (
        <div className="h-3 w-3 rounded-full bg-green-600" />
      ) : null}
    </div>
  );
};

export default ChatTopControls;