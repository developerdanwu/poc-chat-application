import origCN, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUser } from '@clerk/nextjs';

export const getFullName = ({
  firstName,
  lastName,
  fallback,
}: {
  firstName: string | undefined | null;
  lastName: string | undefined | null;
  fallback: string;
}) => {
  /*
   * Check firstName or lastName exists
   * if neither are defined fallback to untitled
   */
  let fullName;
  // check first name to avoid space in the front if only lastname exists
  if (firstName) {
    fullName = `${firstName || ''} ${lastName || ''}`;
  } else {
    fullName = lastName ? lastName : fallback;
  }

  return fullName;
};

export const useApiTransformUtils = () => {
  const user = useUser();
  const filterAuthedUserFromChatroomAuthors = <T extends { user_id: string }>(
    authors: T[]
  ) => authors?.filter((author) => author.user_id !== user?.user?.id);

  return {
    filterAuthedUserFromChatroomAuthors,
    getFullName,
  };
};

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(origCN(inputs));
};
