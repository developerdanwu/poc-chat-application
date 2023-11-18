import {useApiTransformUtils} from '@/lib/utils';
import {
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupList,
    AvatarImage,
    AvatarOverflowIndicator,
} from '@/components/Avatar';
import React from 'react';

const StartOfDirectMessage = ({
                                  authors,
                              }: {
    authors: {
        author_id: number;
        first_name: string;
        last_name: string;
    }[];
}) => {
    const {getFullName} = useApiTransformUtils();
    return (
        <div className="flex flex-col px-6 py-10">
            <div className="relative flex items-center space-x-2">
                <AvatarGroup limit={3}>
                    <AvatarGroupList>
                        {authors.map((author) => (
                            <Avatar
                                key={author.author_id}
                                className=" h-20 w-20 border border-slate-300"
                                size="lg"
                            >
                                <AvatarImage
                                    src="https://github.com/shadcn.png"
                                    alt="@shadcn"
                                />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        ))}
                    </AvatarGroupList>
                    <AvatarOverflowIndicator/>
                </AvatarGroup>
            </div>
            <p className="pt-5 pb-2 text-lead font-bold">
                {authors
                    .map((author) =>
                        getFullName({
                            firstName: author?.first_name,
                            lastName: author?.last_name,
                            fallback: 'Untitled',
                        })
                    )
                    .join(', ')}
            </p>
            <p className="text-warm-gray-400 text-sm">
                This is the beginning of your message history with{' '}
                <span className="font-semibold">
          {authors
              .map((author) =>
                  getFullName({
                      firstName: author.first_name,
                      lastName: author.last_name,
                      fallback: 'Untitled',
                  })
              )
              .join(', ')}
        </span>
            </p>
        </div>
    );
};

export default StartOfDirectMessage;
