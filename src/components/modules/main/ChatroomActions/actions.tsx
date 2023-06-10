import { Tabs, TabsList, TabsTrigger } from '@/components/elements/tabs';
import { PlusIcon, XIcon } from 'lucide-react';
import { IconButton } from '@/components/elements/IconButton';
import { Separator } from '@/components/elements/separator';

export const ChatBranches = () => {
  return (
    <Tabs className="w-full">
      <TabsList className="w-full justify-start rounded-none">
        <TabsTrigger className="flex space-x-2" value="hello">
          <p>Tab1</p>
          <XIcon size={12} />
        </TabsTrigger>
        <TabsTrigger className="flex space-x-2" value="bye">
          <p>Tab1</p>
          <XIcon size={12} />
        </TabsTrigger>
        <Separator className="h-5" orientation="vertical" />
        <IconButton size="sm" variant="ghost">
          <PlusIcon size={16} />
        </IconButton>
      </TabsList>
    </Tabs>
  );
};
