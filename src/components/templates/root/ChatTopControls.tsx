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

  const { filterAuthedUserFromChatroomAuthors, getFullName } =
    useApiTransformUtils();
  const filteredChatroomUsers = filterAuthedUserFromChatroomAuthors(
    chatroomDetail.data?.authors ?? []
  );

  return (
    <div
      className={
        'flex w-full flex-[0_0_60px] items-center border-b-2 border-black'
      }
    >
      <p className={'w-full px-6  font-semibold text-black'}>
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
    </div>
  );
};

export default ChatTopControls;
