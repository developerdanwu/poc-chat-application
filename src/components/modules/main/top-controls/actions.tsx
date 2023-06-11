import { Tabs, TabsList, TabsTrigger } from '@/components/elements/tabs';
import { PlusIcon, XIcon } from 'lucide-react';
import { IconButton } from '@/components/elements/IconButton';
import { Separator } from '@/components/elements/separator';
import { api } from '@/lib/api';
import { useApiTransformUtils } from '@/lib/utils';
import { notEmpty } from '@/lib/ts-utils';
import { type RouterOutput } from '@/server/api/root';

export const ChatBranches = ({
  currentBranchId,
  branches,
}: {
  currentBranchId: string;
  branches: RouterOutput['messaging']['getChatroom']['branches'];
}) => {
  return (
    <Tabs value={currentBranchId} className="w-full">
      <TabsList className="w-full justify-start rounded-none">
        {branches.map((branch) => (
          <TabsTrigger
            key={branch.id}
            className="flex space-x-2"
            value={branch.id}
          >
            <p>{branch.id}</p>
            <XIcon size={12} />
          </TabsTrigger>
        ))}
        <Separator className="h-5" orientation="vertical" />
        <IconButton size="sm" variant="ghost">
          <PlusIcon size={16} />
        </IconButton>
      </TabsList>
    </Tabs>
  );
};

export const ChatNameBar = ({ chatroomId }: { chatroomId: string }) => {
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
