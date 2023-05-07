import origCN, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
    fullName = `${firstName || ""} ${lastName || ""}`;
  } else {
    fullName = lastName ? lastName : fallback;
  }

  return fullName;
};

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(origCN(inputs));
};
